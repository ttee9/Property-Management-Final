import Link from "next/link";

export default function Home() {
  return (
    <div className="page">
      <div className="container">
        <div className="center-card" style={{ marginBottom: 40 }}>
          <h1>Property Management</h1>
          <p className="subtitle">Maintenance requests and rent tracking, made simple.</p>
          <div className="landing-choices">
            <Link href="/tenant/login" className="choice-card">
              I&apos;m a Tenant
            </Link>
            <Link href="/manager/login" className="choice-card">
              I&apos;m a Property Manager
            </Link>
          </div>
        </div>

        <div className="card">
          <h2>What Property Management does</h2>
          <p>
            Property Management is a lightweight portal that connects landlords and property
            managers with the tenants living in their buildings. Managers add each unit&apos;s
            tenant once, and from then on tenants can:
          </p>
          <ul>
            <li>Sign in with just their phone number using a one-time text message code</li>
            <li>Submit and track maintenance requests (plumbing, electrical, appliances, and more)</li>
            <li>See their rent payment status and history for their unit</li>
          </ul>
          <p>
            Property managers get a single dashboard to see every tenant across their properties,
            update rent payment status, and manage incoming maintenance requests through to
            completion.
          </p>
        </div>

        <div className="card">
          <h2>Contact</h2>
          <p>
            Questions about this service or a specific property? Reach us at{" "}
            <a href="mailto:tomltee@gmail.com">tomltee@gmail.com</a>.
          </p>
        </div>

        <footer style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          <Link href="/privacy">Privacy Policy</Link>
          {" · "}
          <Link href="/terms">Terms of Service</Link>
        </footer>
      </div>
    </div>
  );
}
