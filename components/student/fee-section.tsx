"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, Clock, XCircle, ShieldCheck } from "lucide-react";
import { trackFeeRequest } from "@/lib/ga";

type InstallmentKey = "INSTALLMENT1" | "INSTALLMENT2";
type FeeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface FeeRequestView {
  id: string;
  installment: InstallmentKey;
  status: FeeRequestStatus;
  requestedAt: string;
  resolvedAt: string | null;
}

interface StudentFeeSectionProps {
  initialRequests: FeeRequestView[];
  installment1Paid: boolean;
  installment2Paid: boolean;
}

const INSTALLMENTS: { key: InstallmentKey; label: string; desc: string }[] = [
  { key: "INSTALLMENT1", label: "Installment 1", desc: "First payment" },
  { key: "INSTALLMENT2", label: "Installment 2", desc: "Second payment" },
];

const statusStyle: Record<FeeRequestStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  APPROVED: "bg-green-500/10 text-green-400 border border-green-500/30",
  REJECTED: "bg-red-500/10 text-red-400 border border-red-500/30",
};

const statusLabel: Record<FeeRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved ✓",
  REJECTED: "Rejected",
};

export default function StudentFeeSection({ initialRequests, installment1Paid, installment2Paid }: StudentFeeSectionProps) {
  const [requests, setRequests] = useState<FeeRequestView[]>(initialRequests);
  const [submitting, setSubmitting] = useState<InstallmentKey | null>(null);
  const { toast } = useToast();

  const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const getLatest = (key: InstallmentKey) => requests.find((r) => r.installment === key);

  // Ground truth: use server-side paid flags, not request status
  // This handles: admin-marked-paid, admin-marked-unpaid-after-approval, etc.
  const getInstallmentState = (key: InstallmentKey) => {
    const serverPaid = key === "INSTALLMENT1" ? installment1Paid : installment2Paid;
    const latest = getLatest(key);
    const paidViaRequest = serverPaid && latest?.status === "APPROVED";
    const paidByAdmin = serverPaid && latest?.status !== "APPROVED";
    const isPending = !serverPaid && latest?.status === "PENDING";
    return { serverPaid, paidViaRequest, paidByAdmin, isPending };
  };

  const handleRequest = async (installment: InstallmentKey) => {
    setSubmitting(installment);
    trackFeeRequest(installment);
    try {
      const res = await fetch("/api/student/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to submit");
      }
      const data = await res.json();
      setRequests((prev) => [{ id: data.id, installment: data.installment, status: data.status, requestedAt: data.requestedAt, resolvedAt: data.resolvedAt }, ...prev]);
      toast({ title: "Submitted! 🚀", description: "Admin will review your payment soon." });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  const fmt = (v: string | null) => v ? dateFormatter.format(new Date(v)) : "—";

  return (
    <div className="space-y-6">
      {/* Installment cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {INSTALLMENTS.map(({ key, label, desc }) => {
          const latest = getLatest(key);
          const { serverPaid, paidViaRequest, paidByAdmin, isPending } = getInstallmentState(key);
          const isFullyPaid = serverPaid;
          const adminPaid = paidByAdmin;

          const borderColor = isFullyPaid
            ? "border-green-500/40"
            : isPending
            ? "border-yellow-500/40"
            : "border-slate-700";

          return (
            <div key={key} className={`rounded-2xl bg-slate-900 border ${borderColor} p-5 space-y-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-white">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                {adminPaid && (
                  <span className="text-xs px-2 py-1 rounded-lg font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
                {paidViaRequest && (
                  <span className="text-xs px-2 py-1 rounded-lg font-bold bg-green-500/10 text-green-400 border border-green-500/30">
                    Approved ✓
                  </span>
                )}
                {isPending && (
                  <span className="text-xs px-2 py-1 rounded-lg font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    Pending
                  </span>
                )}
              </div>

              {adminPaid && (
                <p className="text-xs text-purple-400">
                  <ShieldCheck className="inline h-3 w-3 mr-1" />
                  Marked paid by admin · No action needed.
                </p>
              )}
              {paidViaRequest && (
                <p className="text-xs text-green-400">Payment verified ✓ No further action needed.</p>
              )}
              {!serverPaid && latest?.status === "REJECTED" && (
                <p className="text-xs text-red-400">Rejected — please resubmit after verifying your payment.</p>
              )}

              <button
                disabled={isPending || isFullyPaid || submitting === key}
                onClick={() => handleRequest(key)}
                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  isFullyPaid
                    ? adminPaid
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 cursor-not-allowed"
                      : "bg-green-500/10 text-green-400 border border-green-500/30 cursor-not-allowed"
                    : isPending
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:shadow-[0_0_20px_rgba(0,212,255,0.35)]"
                }`}
              >
                {submitting === key && <Loader2 className="h-4 w-4 animate-spin" />}
                {adminPaid
                  ? "Paid ✓"
                  : paidViaRequest
                  ? "Approved ✓"
                  : isPending
                  ? "Awaiting Review..."
                  : latest
                  ? "Request Again"
                  : "Request Verification 🚀"}
              </button>
            </div>
          );
        })}
      </div>

      {/* History */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Request History</p>
        {requests.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-4">No requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-700/50 px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {r.status === "APPROVED" ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" /> : r.status === "PENDING" ? <Clock className="h-4 w-4 text-yellow-400 shrink-0" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{r.installment === "INSTALLMENT1" ? "Installment 1" : "Installment 2"}</p>
                    <p className="text-[11px] text-slate-500 truncate">Requested: {fmt(r.requestedAt)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-lg font-bold ${statusStyle[r.status]}`}>{statusLabel[r.status]}</span>
                  {r.resolvedAt && <p className="text-[10px] text-slate-600 mt-1">{fmt(r.resolvedAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
