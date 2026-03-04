import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: "var(--smartstorey-cream)" }}>
      <main className="flex max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-semibold" style={{ color: "var(--smartstorey-charcoal)" }}>
          SmartStorey
        </h1>
        <p style={{ color: "var(--smartstorey-charcoal-muted)" }}>
          Expense request management
        </p>
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/requester"
            className="w-full rounded-xl px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--smartstorey-charcoal)" }}
          >
            New Request
          </Link>
          <Link
            href="/pay"
            className="w-full rounded-xl border px-6 py-4 font-semibold transition-opacity hover:opacity-90"
            style={{ borderColor: "var(--smartstorey-sand)", color: "var(--smartstorey-charcoal)" }}
          >
            Payee Dashboard
          </Link>
          <Link
            href="/test-setup"
            className="text-center text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--smartstorey-charcoal-muted)" }}
          >
            Test Setup →
          </Link>
        </div>
      </main>
    </div>
  );
}
