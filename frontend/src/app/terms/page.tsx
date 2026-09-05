import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1>Terms of Service</h1>
          <p className="subtitle">Last updated: 2026</p>

          <h2>Using this service</h2>
          <p>
            Property Management is provided to help property managers and their tenants
            communicate about maintenance requests and rent payments. Tenant accounts are created
            by a property manager; tenants sign in with the phone number their property manager
            has on file for them, verified by a one-time text message code.
          </p>

          <h2>Text message consent</h2>
          <p>
            By providing your phone number to a property manager for use with this service, you
            consent to receive one-time login codes by SMS at that number. Message and data rates
            may apply. Reply STOP to any message to opt out of receiving further messages, or
            contact your property manager to have your account removed.
          </p>

          <h2>Accounts and access</h2>
          <p>
            Property managers are responsible for the accuracy of the tenant, unit, and payment
            information they enter, and for removing tenants who should no longer have access.
            Tenants are responsible for keeping the phone number on their account current with
            their property manager.
          </p>

          <h2>Acceptable use</h2>
          <p>
            This service may only be used to manage real tenancies at real properties. Submitting
            false maintenance requests, impersonating another person, or attempting to access
            another tenant&apos;s or property manager&apos;s data is prohibited.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of the service after a
            change means you accept the updated terms.
          </p>

          <h2>Contact us</h2>
          <p>
            Questions about these terms can be sent to{" "}
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
