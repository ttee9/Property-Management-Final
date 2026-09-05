"use client";

import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import {
  MaintenanceRequest,
  Payment,
  Property,
  TenantSummary,
  Unit,
  formatCents,
  formatMonth,
  getLatestPaymentByTenant,
  getPaymentsByTenant,
} from "@/lib/types";

const REQUEST_STATUSES = ["open", "in_progress", "completed", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "late"];

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"tenants" | "requests" | "properties">("tenants");
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTenantIds, setExpandedTenantIds] = useState<Set<string>>(new Set());

  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newUnitId, setNewUnitId] = useState("");
  const [addingTenant, setAddingTenant] = useState(false);
  const [addTenantError, setAddTenantError] = useState<string | null>(null);

  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyAddress, setNewPropertyAddress] = useState("");
  const [addingProperty, setAddingProperty] = useState(false);
  const [addPropertyError, setAddPropertyError] = useState<string | null>(null);

  const [addUnitPropertyId, setAddUnitPropertyId] = useState<string | null>(null);
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const [addingUnit, setAddingUnit] = useState(false);
  const [addUnitError, setAddUnitError] = useState<string | null>(null);

  function toggleHistory(tenantId: string) {
    setExpandedTenantIds((prev) => {
      const next = new Set(prev);
      if (next.has(tenantId)) {
        next.delete(tenantId);
      } else {
        next.add(tenantId);
      }
      return next;
    });
  }

  const loadData = useCallback(
    async (activeToken: string) => {
      try {
        const [tenantsRes, requestsRes, paymentsRes, unitsRes, propertiesRes] = await Promise.all([
          apiFetch<TenantSummary[]>("/manager/tenants", { token: activeToken }),
          apiFetch<MaintenanceRequest[]>("/manager/maintenance-requests", { token: activeToken }),
          apiFetch<Payment[]>("/manager/payments", { token: activeToken }),
          apiFetch<Unit[]>("/manager/units", { token: activeToken }),
          apiFetch<Property[]>("/manager/properties", { token: activeToken }),
        ]);
        setTenants(tenantsRes);
        setRequests(requestsRes);
        setPayments(paymentsRes);
        setUnits(unitsRes);
        setProperties(propertiesRes);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearToken("manager");
          router.push("/manager/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const t = getToken("manager");
    if (!t) {
      router.push("/manager/login");
      return;
    }
    setToken(t);
    loadData(t);
  }, [loadData, router]);

  async function updateRequestStatus(id: string, status: string) {
    if (!token) return;
    try {
      await apiFetch(`/manager/maintenance-requests/${id}`, { method: "PATCH", token, body: { status } });
      loadData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request");
    }
  }

  async function updatePaymentStatus(id: string, status: string) {
    if (!token) return;
    try {
      await apiFetch(`/manager/payments/${id}`, { method: "PATCH", token, body: { status } });
      loadData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment");
    }
  }

  async function removeTenant(id: string, name: string) {
    if (!token) return;
    if (!window.confirm(`Remove ${name}? This also deletes their payment and maintenance request history.`)) {
      return;
    }
    try {
      await apiFetch(`/manager/tenants/${id}`, { method: "DELETE", token });
      loadData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove tenant");
    }
  }

  async function addTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setAddTenantError(null);
    setAddingTenant(true);
    try {
      await apiFetch("/manager/tenants", {
        method: "POST",
        token,
        body: { name: newName, phone: newPhone, unit_id: newUnitId },
      });
      setNewName("");
      setNewPhone("");
      setNewUnitId("");
      setShowAddTenant(false);
      await loadData(token);
    } catch (err) {
      setAddTenantError(err instanceof Error ? err.message : "Failed to add tenant");
    } finally {
      setAddingTenant(false);
    }
  }

  async function addProperty(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setAddPropertyError(null);
    setAddingProperty(true);
    try {
      await apiFetch("/manager/properties", {
        method: "POST",
        token,
        body: { name: newPropertyName, address: newPropertyAddress },
      });
      setNewPropertyName("");
      setNewPropertyAddress("");
      setShowAddProperty(false);
      await loadData(token);
    } catch (err) {
      setAddPropertyError(err instanceof Error ? err.message : "Failed to add property");
    } finally {
      setAddingProperty(false);
    }
  }

  async function addUnit(e: React.FormEvent, propertyId: string) {
    e.preventDefault();
    if (!token) return;
    setAddUnitError(null);
    setAddingUnit(true);
    try {
      await apiFetch(`/manager/properties/${propertyId}/units`, {
        method: "POST",
        token,
        body: { unit_number: newUnitNumber },
      });
      setNewUnitNumber("");
      setAddUnitPropertyId(null);
      await loadData(token);
    } catch (err) {
      setAddUnitError(err instanceof Error ? err.message : "Failed to add unit");
    } finally {
      setAddingUnit(false);
    }
  }

  function signOut() {
    clearToken("manager");
    router.push("/manager/login");
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container">Loading...</div>
      </div>
    );
  }

  const paymentsByTenant = getLatestPaymentByTenant(payments);
  const paymentHistoryByTenant = getPaymentsByTenant(payments);

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

        <h1>Manager Dashboard</h1>
        <p className="subtitle">Track tenant rent payments and maintenance requests.</p>

        <div className="tabs">
          <div className={`tab ${tab === "tenants" ? "active" : ""}`} onClick={() => setTab("tenants")}>
            Tenants & Payments
          </div>
          <div className={`tab ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>
            Maintenance Requests
          </div>
          <div className={`tab ${tab === "properties" ? "active" : ""}`} onClick={() => setTab("properties")}>
            Properties
          </div>
        </div>

        {tab === "tenants" && (
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2>Tenants</h2>
              <button className="secondary" onClick={() => setShowAddTenant((v) => !v)}>
                {showAddTenant ? "Cancel" : "+ Add Tenant"}
              </button>
            </div>

            {showAddTenant && (
              <form onSubmit={addTenant} className="row" style={{ alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="new-tenant-name">Name</label>
                  <input
                    id="new-tenant-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="new-tenant-phone">Phone</label>
                  <input
                    id="new-tenant-phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 415 555 0100"
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="new-tenant-unit">Unit</label>
                  <select
                    id="new-tenant-unit"
                    value={newUnitId}
                    onChange={(e) => setNewUnitId(e.target.value)}
                    required
                    disabled={units.length === 0}
                  >
                    <option value="" disabled>
                      {units.length === 0 ? "Add a property first" : "Select a unit"}
                    </option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_number} &middot; {u.property_name}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={addingTenant || units.length === 0}>
                  {addingTenant ? "Adding..." : "Add"}
                </button>
              </form>
            )}
            {addTenantError && <div className="error">{addTenantError}</div>}
            {showAddTenant && units.length === 0 && (
              <p className="helper-text" style={{ marginTop: -8 }}>
                You don&apos;t have any units yet — add a property and unit on the{" "}
                <button type="button" className="link" onClick={() => setTab("properties")}>
                  Properties
                </button>{" "}
                tab first.
              </p>
            )}

            {tenants.length === 0 ? (
              <p className="empty">No tenants yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Unit</th>
                    <th>Phone</th>
                    <th>Payment Status</th>
                    <th>Rent Amount</th>
                    <th>Open Requests</th>
                    <th>Update Payment</th>
                    <th>History</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => {
                    const payment = paymentsByTenant.get(t.id);
                    const history = paymentHistoryByTenant.get(t.id) ?? [];
                    const expanded = expandedTenantIds.has(t.id);
                    return (
                      <Fragment key={t.id}>
                        <tr>
                          <td>{t.name}</td>
                          <td>
                            {t.unit_number} &middot; {t.property_name}
                          </td>
                          <td>{t.phone}</td>
                          <td>
                            <span className={`badge badge-${t.current_status}`}>{t.current_status}</span>
                          </td>
                          <td>{payment ? formatCents(payment.amount_cents) : "—"}</td>
                          <td>{t.open_requests}</td>
                          <td>
                            {payment ? (
                              <select
                                value={payment.status}
                                onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
                              >
                                {PAYMENT_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="empty">No payment record</span>
                            )}
                          </td>
                          <td>
                            {history.length > 0 && (
                              <button className="link" onClick={() => toggleHistory(t.id)}>
                                {expanded ? "Hide" : "Show"} ({history.length})
                              </button>
                            )}
                          </td>
                          <td>
                            <button
                              className="link"
                              style={{ color: "var(--danger)" }}
                              onClick={() => removeTenant(t.id, t.name)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                        {expanded && history.length > 0 && (
                          <tr>
                            <td colSpan={9}>
                              <table className="history-table">
                                <thead>
                                  <tr>
                                    <th>Month</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Update</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {history.map((p) => (
                                    <tr key={p.id}>
                                      <td>{formatMonth(p.due_date)}</td>
                                      <td>{formatCents(p.amount_cents)}</td>
                                      <td>
                                        <span className={`badge badge-${p.status}`}>{p.status}</span>
                                      </td>
                                      <td>
                                        <select
                                          value={p.status}
                                          onChange={(e) => updatePaymentStatus(p.id, e.target.value)}
                                        >
                                          {PAYMENT_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                              {s}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "requests" && (
          <div className="card">
            <h2>Maintenance Requests</h2>
            {requests.length === 0 ? (
              <p className="empty">No maintenance requests yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Tenant</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.title}
                        <div className="cell-note">{r.description}</div>
                      </td>
                      <td>
                        {r.tenant_name} &middot; {r.unit_number}
                      </td>
                      <td>{r.category}</td>
                      <td>{r.priority}</td>
                      <td>
                        <span className={`badge badge-${r.status}`}>{r.status.replace("_", " ")}</span>
                      </td>
                      <td>
                        <select value={r.status} onChange={(e) => updateRequestStatus(r.id, e.target.value)}>
                          {REQUEST_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "properties" && (
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2>Properties</h2>
              <button className="secondary" onClick={() => setShowAddProperty((v) => !v)}>
                {showAddProperty ? "Cancel" : "+ Add Property"}
              </button>
            </div>

            {showAddProperty && (
              <form
                onSubmit={addProperty}
                className="row"
                style={{ alignItems: "flex-start", marginBottom: 20 }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="new-property-name">Property name</label>
                  <input
                    id="new-property-name"
                    value={newPropertyName}
                    onChange={(e) => setNewPropertyName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="new-property-address">Address</label>
                  <input
                    id="new-property-address"
                    value={newPropertyAddress}
                    onChange={(e) => setNewPropertyAddress(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={addingProperty}>
                  {addingProperty ? "Adding..." : "Add"}
                </button>
              </form>
            )}
            {addPropertyError && <div className="error">{addPropertyError}</div>}

            {properties.length === 0 ? (
              <p className="empty">No properties yet. Add one to start adding tenants.</p>
            ) : (
              properties.map((p) => (
                <div key={p.id} className="card" style={{ background: "var(--bg)" }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <strong>{p.name}</strong>
                      <div className="cell-note">{p.address}</div>
                    </div>
                    <button
                      className="secondary"
                      onClick={() =>
                        setAddUnitPropertyId(addUnitPropertyId === p.id ? null : p.id)
                      }
                    >
                      {addUnitPropertyId === p.id ? "Cancel" : "+ Add Unit"}
                    </button>
                  </div>

                  {addUnitPropertyId === p.id && (
                    <form
                      onSubmit={(e) => addUnit(e, p.id)}
                      className="row"
                      style={{ alignItems: "flex-start", margin: "16px 0 0" }}
                    >
                      <div style={{ flex: 1 }}>
                        <label htmlFor={`new-unit-${p.id}`}>Unit number</label>
                        <input
                          id={`new-unit-${p.id}`}
                          value={newUnitNumber}
                          onChange={(e) => setNewUnitNumber(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" disabled={addingUnit}>
                        {addingUnit ? "Adding..." : "Add"}
                      </button>
                    </form>
                  )}
                  {addUnitPropertyId === p.id && addUnitError && (
                    <div className="error">{addUnitError}</div>
                  )}

                  {p.units.length === 0 ? (
                    <p className="empty" style={{ marginTop: 12 }}>
                      No units yet.
                    </p>
                  ) : (
                    <p className="cell-note" style={{ marginTop: 12 }}>
                      Units: {p.units.map((u) => u.unit_number).join(", ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
