import Link from "next/link";

export default function Home() {
  return (
    <div className="page">
      <div className="container center-card">
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
    </div>
  );
}
