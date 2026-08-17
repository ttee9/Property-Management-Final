"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { MaintenanceRequest, Payment, TenantProfile, formatCents } from "@/lib/types";

export default function TenantDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const loadData = useCallback(async (activeToken: string) => {
    try {
      const [profileRes, requestsRes, paymentsRes] = await Promise.all([
        apiFetch<TenantProfile>("/tenant/me", { token: activeToken }),
        apiFetch<MaintenanceRequest[]>("/tenant/maintenance-requests", { token: activeToken }),
        apiFetch<Payment[]>("/tenant/payments", { token: activeToken }),
      ]);
      setProfile(profileRes);
      setRequests(requestsRes);
      setPayments(paymentsRes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken("tenant");
        router.push("/tenant/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const t = getToken("tenant");
    if (!t) {
      router.push("/tenant/login");
      return;
    }
    setToken(t);
    loadData(t);
  }, [loadData, router]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setSubmitMessage(null);
    setError(null);
    try {
      await apiFetch<MaintenanceRequest>("/tenant/maintenance-requests", {
        method: "POST",
        token,
        body: { title, description, category, priority },
      });
      setTitle("");
      setDescription("");
      setCategory("other");
      setPriority("normal");
      setSubmitMessage("Request submitted.");
      await loadData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  function signOut() {
    clearToken("tenant");
    router.push("/tenant/login");
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container">Loading...</div>
      </div>
    );
  }

  const latestPayment = payments[0];

  return (
    <div className="page">
      <div className="topbar">
        <span className="brand">Property Management</span>
        <button className="secondary" onClick={signOut}>
          Sign out
        </button>
      </div>
      <div className="container">
        {error && <div className="error">{error}</div>}

        {profile && (
          <div className="card">
            <h2>Welcome, {profile.name}</h2>
            <p className="subtitle" style={{ marginBottom: 0 }}>
              {profile.property_name} &middot; Unit {profile.unit_number} &middot; {profile.phone}
            </p>
          </div>
        )}

        <div className="card">
          <h2>Rent Payment Status</h2>
          {latestPayment ? (
            <div className="row">
              <span className={`badge badge-${latestPayment.status}`}>{latestPayment.status}</span>
              <span>{formatCents(latestPayment.amount_cents)}</span>
              <span className="subtitle" style={{ margin: 0 }}>
                due {new Date(latestPayment.due_date).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <p className="empty">No payment records yet.</p>
          )}
        </div>

        <div className="card">
          <h2>Submit a Maintenance Request</h2>
          {submitMessage && <div className="success">{submitMessage}</div>}
          <form onSubmit={submitRequest}>
            <label htmlFor="title">Title</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div className="row" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="category">Category</label>
                <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="appliance">Appliance</option>
                  <option value="hvac">HVAC</option>
                  <option value="pest">Pest</option>
                  <option value="structural">Structural</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="priority">Priority</label>
                <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Your Requests</h2>
          {requests.length === 0 ? (
            <p className="empty">No maintenance requests yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.category}</td>
                    <td>{r.priority}</td>
                    <td>
                      <span className={`badge badge-${r.status}`}>{r.status.replace("_", " ")}</span>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
