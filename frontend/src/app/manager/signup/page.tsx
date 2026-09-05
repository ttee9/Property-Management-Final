"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function ManagerSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string }>("/auth/manager/signup", {
        method: "POST",
        body: { name, email, password },
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
        <h1>Property Manager Sign Up</h1>
        <p className="subtitle">Create an account to manage your own properties and tenants.</p>
        <div className="card">
          {error && <div className="error">{error}</div>}
          <form onSubmit={signup}>
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
        <p className="subtitle">
          Already have an account? <Link href="/manager/login">Sign in</Link>
        </p>
        <p className="subtitle">
          <Link href="/">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
