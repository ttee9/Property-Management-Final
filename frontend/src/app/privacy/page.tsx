import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1>Privacy Policy</h1>
          <p className="subtitle">Last updated: 2026</p>

          <h2>Information we collect</h2>
          <p>
            When a property manager adds a tenant, we store that tenant&apos;s name, phone number,
            and assigned unit. As tenants use the service, we also store the maintenance requests
            they submit and their rent payment status and history. Property managers additionally
            provide their name, email address, and a password to sign in.
          </p>

          <h2>How we use your information</h2>
          <ul>
            <li>To sign tenants in via a one-time verification code sent by text message</li>
            <li>To let property managers track maintenance requests and rent payments for their units</li>
            <li>To let tenants view the status of their own requests and payments</li>
          </ul>
          <p>
            We do not sell your information, and we do not use it for advertising. We do not run
            any analytics or tracking scripts on this site.
          </p>

          <h2>Text messages</h2>
          <p>
            We use a third-party messaging provider (Twilio) to deliver one-time login codes by
            SMS to the phone number on file for a tenant. Message and data rates may apply.
            Your phone number is used only for account sign-in and is not used for marketing.
          </p>

          <h2>Data retention</h2>
          <p>
            We retain tenant and payment records for as long as a property manager keeps that
            tenant active in the system. A property manager can remove a tenant at any time,
            which deletes that tenant&apos;s stored maintenance and payment history.
          </p>

          <h2>Contact us</h2>
          <p>
            Questions about this policy or your data can be sent to{" "}
            <a href="mailto:tomltee@gmail.com">tomltee@gmail.com</a>.
          </p>

          <p style={{ marginTop: 24 }}>
            <Link href="/">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
