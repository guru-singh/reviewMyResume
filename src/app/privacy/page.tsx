export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        <strong>Effective Date:</strong> 1-April-2026
      </p>

      <p className="mb-6">
        Welcome to ReviewMyResume. This Privacy Policy explains how we collect,
        use, and protect your information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <ul className="list-disc ml-6 space-y-1">
        <li>Name, email (via Google login)</li>
        <li>Resume files and extracted text</li>
        <li>Job descriptions</li>
        <li>Usage data (browser, IP, activity)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Data</h2>
      <ul className="list-disc ml-6 space-y-1">
        <li>Generate ATS score and analysis</li>
        <li>Improve product experience</li>
        <li>Manage accounts and usage</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. AI Processing</h2>
      <p>
        Your resume data is processed using AI tools only to generate reports.
        We do not use your data for training without consent.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Sharing</h2>
      <p>
        We do not sell your data. Data may be shared with trusted providers
        (hosting, AI APIs, payments) or when legally required.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Payments</h2>
      <p>
        Payments are handled via Razorpay. We do not store card details.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Your Rights</h2>
      <ul className="list-disc ml-6 space-y-1">
        <li>Access or update your data</li>
        <li>Request deletion</li>
        <li>Opt out of emails</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Cookies</h2>
      <p>
        We use cookies for login sessions and analytics.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Security</h2>
      <p>
        We use standard security practices, but no system is fully secure.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Contact</h2>
      <p>Email: admin@freeatsreview.com</p>
    </main>
  );
}