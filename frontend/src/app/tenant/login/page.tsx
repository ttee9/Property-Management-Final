"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function TenantLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string; debug_code?: string }>(
        "/auth/tenant/request-otp",
        { method: "POST", body: { phone } }
      );
      setDevCode(res.debug_code || null);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string }>("/auth/tenant/verify-otp", {
        method: "POST",
        body: { phone, code },
      });
      saveToken("tenant", res.access_token);
      router.push("/tenant/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container center-card">
        <h1>Tenant Login</h1>
        <p className="subtitle">Sign in with your cell phone number.</p>
        <div className="card">
          {error && <div className="error">{error}</div>}

          {step === "phone" && (
            <form onSubmit={requestOtp}>
              <label htmlFor="phone">Cell phone number</label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 415 555 0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Sending code..." : "Send login code"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verifyOtp}>
              <label htmlFor="code">6-digit code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
              {devCode && (
                <p className="helper-text">Dev mode: your code is {devCode} (no SMS provider configured).</p>
              )}
              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
              <div style={{ marginTop: 12 }}>
                <button type="button" className="link" onClick={() => setStep("phone")}>
                  Use a different number
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="subtitle">
          <Link href="/">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
