"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string }>("/auth/manager/login", {
        method: "POST",
        body: { email, password },
      });
      saveToken("manager", res.access_token);
      router.push("/manager/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container center-card">
        <h1>Property Manager Login</h1>
        <p className="subtitle">Sign in to manage tenants and requests.</p>
        <div className="card">
          {error && <div className="error">{error}</div>}
          <form onSubmit={login}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
        <p className="subtitle">
          <Link href="/">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
