export default function AdminCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-terracotta">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-100">
      <table className="min-w-full divide-y divide-stone-100 text-sm">{children}</table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    preparing: "bg-mustard/20 text-ink",
    ready: "bg-green-100 text-green-800",
    delivering: "bg-blue-100 text-blue-800",
    completed: "bg-stone-100 text-stone-700",
    paid: "bg-terracotta/10 text-terracotta",
    pending: "bg-orange-100 text-orange-800",
    pending_payment: "bg-orange-100 text-orange-800",
    cancelled: "bg-red-100 text-red-700",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[status] || "bg-stone-100 text-stone-600"
      }`}
    >
      {status}
    </span>
  );
}
