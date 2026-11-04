"use client";

import { useEffect, useState } from "react";
import { Download, MessageCircle, Phone, Trash2 } from "lucide-react";
import { friendlyError } from "@/lib/admin";
import { browserClient } from "@/lib/supabase-browser";
import { Button, Notice, PageHeader, Skeleton } from "@/components/admin/ui";

type Lead = { id: string; phone: string; coupon_code: string | null; source: string; created_at: string; last_seen_at: string };

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function SignupsPage() {
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    browserClient().from("leads").select("*").order("created_at", { ascending: false }).limit(2000)
      .then(({ data, error }) => (error ? setError(error.message) : setRows(data as Lead[])));
  }, []);

  const exportCsv = () => {
    if (!rows?.length) return;
    const lines = [["Mobile", "Code given", "Signed up", "Last seen"], ...rows.map((r) => [`+91${r.phone}`, r.coupon_code ?? "", r.created_at, r.last_seen_at])];
    const csv = lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `airawat-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const remove = async (r: Lead) => {
    if (!confirm(`Delete +91 ${r.phone} from this list? Do this when someone asks not to be contacted.`)) return;
    const { error } = await browserClient().from("leads").delete().eq("id", r.id);
    if (error) return setError(friendlyError(error.message));
    setRows((all) => all?.filter((x) => x.id !== r.id) ?? null);
  };

  return (
    <>
      <PageHeader
        title="Sign-ups"
        sub="Mobile numbers shared through the shop's sign-up offer pop-up. Only contact people about Airawat Handicraft, and remove anyone who asks."
        action={<Button variant="outline" onClick={exportCsv} disabled={!rows?.length}><Download size={16} /> Download CSV</Button>}
      />
      {error && <div className="mb-4"><Notice kind="error">{error}</Notice></div>}
      {!rows && !error ? <Skeleton rows={5} /> : rows && !rows.length ? (
        <p className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">No sign-ups yet. They appear here when visitors claim the pop-up offer.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">Mobile</th><th className="px-4 py-3">Code given</th><th className="px-4 py-3">Signed up</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows?.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium tabular-nums">+91 {r.phone.slice(0, 5)} {r.phone.slice(5)}</td>
                  <td className="px-4 py-3 font-mono">{r.coupon_code ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{fmt(r.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <a href={`tel:+91${r.phone}`} aria-label={`Call +91 ${r.phone}`} className="inline-grid h-8 w-8 place-items-center rounded text-accent hover:bg-surface-alt"><Phone size={15} /></a>
                    <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp +91 ${r.phone}`} className="inline-grid h-8 w-8 place-items-center rounded text-accent hover:bg-surface-alt"><MessageCircle size={15} /></a>
                    <button onClick={() => remove(r)} aria-label={`Delete +91 ${r.phone}`} className="inline-grid h-8 w-8 place-items-center rounded text-danger hover:bg-danger/10"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
