export default function RefundPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>

      <p className="mb-4">
        <strong>Effective Date:</strong> 1-April-2026
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. No Refund Policy</h2>
      <p>
        Due to the digital nature of our services, all purchases are final and
        non-refundable once the report has been generated.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Exceptions</h2>
      <p>
        Refunds may be considered only in the following cases:
      </p>
      <ul className="list-disc ml-6 space-y-1">
        <li>Payment deducted but service not delivered</li>
        <li>Technical error preventing report generation</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Time Window</h2>
      <p>
        Refund requests must be made within 48 hours of the transaction.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Processing</h2>
      <p>
        Approved refunds will be processed within 5–7 business days via the
        original payment method.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Contact</h2>
      <p>
        To request a refund, contact: admin@freeatsreview.com with transaction details.
      </p>
    </main>
  );
}