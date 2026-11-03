// Small building blocks shared by the admin pages.
import Link from "next/link";

export const inputCls = "h-10 w-full rounded-md border border-border-input bg-surface px-3 text-sm focus:border-accent focus:outline-none";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-surface p-5 ${className}`}>
      {title && <h2 className="mb-4 font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Button({ variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-accent text-on-accent hover:bg-accent-hover",
    outline: "border border-border bg-surface hover:border-ink",
    danger: "border border-danger/40 bg-surface text-danger hover:bg-danger hover:text-white",
    ghost: "hover:bg-surface-alt",
  }[variant];
  return <button {...props} className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold disabled:opacity-50 ${styles} ${className}`} />;
}

export function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover">{children}</Link>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: React.ReactNode }) {
  const t = { neutral: "bg-surface-alt text-ink", good: "bg-success/10 text-success", warn: "bg-brass/10 text-brass", bad: "bg-danger/10 text-danger" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function Notice({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-md px-4 py-3 text-sm ${kind === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
      {children}
    </p>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-alt" />)}
    </div>
  );
}
