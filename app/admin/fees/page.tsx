"use client";
import { apiFetch } from "@/lib/api";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, Loader2, Search, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

type FeeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
type InstallmentKey = "INSTALLMENT1" | "INSTALLMENT2";

interface FeeRequest {
  id: string;
  installment: InstallmentKey;
  status: FeeRequestStatus;
  requestedAt: string;
  resolvedAt: string | null;
  adminNote?: string | null;
  student: {
    id: string;
    name: string | null;
    email: string;
    installment1Paid: boolean;
    installment2Paid: boolean;
    class: { id: string; name: string } | null;
  };
}

interface FeeLog {
  id: string;
  installment: InstallmentKey;
  eventType: string; // REQUEST_RAISED | APPROVED | REJECTED | MARKED_UNPAID
  note: string | null;
  createdAt: string;
}

interface Student {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  installment1Paid: boolean;
  installment2Paid: boolean;
  class: { id: string; name: string } | null;
}

const statusColors: Record<FeeRequestStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const logMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  REQUEST_RAISED: {
    label: "Request raised by student",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: <Clock className="h-3.5 w-3.5 text-blue-600" />,
  },
  APPROVED: {
    label: "Approved by admin",
    color: "text-green-700 bg-green-50 border-green-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
  },
  REJECTED: {
    label: "Rejected by admin",
    color: "text-red-700 bg-red-50 border-red-200",
    icon: <XCircle className="h-3.5 w-3.5 text-red-600" />,
  },
  MARKED_UNPAID: {
    label: "Marked unpaid by admin",
    color: "text-orange-700 bg-orange-50 border-orange-200",
    icon: <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />,
  },
  ADMIN_MARKED_PAID: {
    label: "Marked paid by admin",
    color: "text-purple-700 bg-purple-50 border-purple-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />,
  },
};

const fmt = (v: string | null) =>
  v ? new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function AdminFeeRequestsPage() {
  const [requests, setRequests] = useState<FeeRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FeeRequestStatus | "ALL">("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [studentLogs, setStudentLogs] = useState<Record<string, FeeLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    studentId: string;
    field: "installment1Paid" | "installment2Paid";
    studentName: string;
    installmentLabel: string;
  } | null>(null);

  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
      const res = await apiFetch(`/admin/fee-requests${query}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setRequests(await res.json());
    } catch {
      toast({ title: "Error", description: "Could not load requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await apiFetch("/admin/students");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setStudents(data.filter((s: Student) => s.role === "STUDENT"));
    } catch {
      toast({ title: "Error", description: "Could not load students", variant: "destructive" });
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { fetchStudents(); }, []);

  const fetchLogsForStudent = async (studentId: string) => {
    if (studentLogs[studentId]) return; // already loaded
    try {
      setLogsLoading(studentId);
      const res = await apiFetch(`/admin/fee-logs?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed");
      const data: FeeLog[] = await res.json();
      setStudentLogs((prev) => ({ ...prev, [studentId]: data }));
    } catch {
      toast({ title: "Error", description: "Could not load fee history", variant: "destructive" });
    } finally {
      setLogsLoading(null);
    }
  };

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(id + action);
    try {
      const res = await apiFetch(`/admin/fee-requests/${id}`, {
        method: "PATCH",
        headers: { },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Request failed");
      toast({ title: `Request ${action === "APPROVE" ? "approved" : "rejected"}` });
      fetchRequests();
      fetchStudents();
      // Invalidate logs cache for that student so history reloads
      const req = requests.find((r) => r.id === id);
      if (req) {
        setStudentLogs((prev) => {
          const next = { ...prev };
          delete next[req.student.id];
          return next;
        });
      }
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmMarkUnpaid = (student: Student, field: "installment1Paid" | "installment2Paid") => {
    setConfirmDialog({
      open: true,
      studentId: student.id,
      field,
      studentName: student.name || student.email,
      installmentLabel: field === "installment1Paid" ? "Installment 1" : "Installment 2",
    });
  };

  const handleMarkUnpaid = async () => {
    if (!confirmDialog) return;
    const { studentId, field } = confirmDialog;
    setConfirmDialog(null);

    const key = studentId + field;
    setToggleLoading(key);
    try {
      const res = await apiFetch(`/admin/students/${studentId}/fees`, {
        method: "PATCH",
        headers: { },
        body: JSON.stringify({ [field]: false }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast({ title: "Marked as unpaid" });
      fetchStudents();
      // Invalidate logs cache so history reloads fresh
      setStudentLogs((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    } catch (error) {
      toast({ title: "Failed to update", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setToggleLoading(null);
    }
  };

  const toggleExpand = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
        fetchLogsForStudent(studentId);
      }
      return next;
    });
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      !q ||
      (s.name || "").toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.class?.name || "").toLowerCase().includes(q) ||
      (s.phone || "").includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Confirm mark-unpaid dialog */}
      <Dialog open={!!confirmDialog?.open} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Mark as Unpaid?
            </DialogTitle>
            <DialogDescription>
              This will mark <strong>{confirmDialog?.installmentLabel}</strong> as <strong>unpaid</strong> for{" "}
              <strong>{confirmDialog?.studentName}</strong>. The student will need to raise a new fee request to pay again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleMarkUnpaid}>
              Yes, Mark Unpaid
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-sm text-gray-600">Requests &amp; installment status</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Shown", value: requests.length, color: "text-gray-900" },
            { label: "Pending", value: requests.filter((r) => r.status === "PENDING").length, color: "text-yellow-600" },
            { label: "Approved", value: requests.filter((r) => r.status === "APPROVED").length, color: "text-green-600" },
            { label: "Rejected", value: requests.filter((r) => r.status === "REJECTED").length, color: "text-red-600" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fee Requests */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-base">Fee Requests</CardTitle>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FeeRequestStatus | "ALL")}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-gray-500">No requests for this filter.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="border rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      {r.status === "APPROVED" ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : r.status === "PENDING" ? <Clock className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.student.name || r.student.email}</p>
                        <p className="text-xs text-gray-500">{r.student.email} · {r.student.class ? `Class ${r.student.class.name}` : "Unassigned"}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {r.installment === "INSTALLMENT1" ? "Installment 1" : "Installment 2"} · Raised {fmt(r.requestedAt)}
                          {r.resolvedAt ? ` · Resolved ${fmt(r.resolvedAt)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {r.status === "PENDING" ? (
                        <>
                          <Button size="sm" onClick={() => handleAction(r.id, "APPROVE")} disabled={actionLoading === r.id + "APPROVE"}>
                            {actionLoading === r.id + "APPROVE" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "REJECT")} disabled={actionLoading === r.id + "REJECT"}>
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[r.status]}`}>{r.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Installment Status + Full Log History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Installment Status</CardTitle>
            <CardDescription>
              Toggle paid → unpaid (with confirmation). To mark unpaid → paid, student must raise a fee request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search by name, email, phone or class..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            {studentsLoading ? (
              <p className="text-sm text-gray-500">Loading students...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-sm text-gray-500">{studentSearch ? "No students match your search." : "No students found."}</p>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const expanded = expandedStudents.has(student.id);
                  const logs = studentLogs[student.id] ?? [];
                  const isLogsLoading = logsLoading === student.id;

                  return (
                    <div key={student.id} className="border rounded-xl overflow-hidden">
                      <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{student.name || "—"}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {student.email}
                            {student.phone ? ` · ${student.phone}` : ""}
                            {student.class ? ` · Class ${student.class.name}` : " · Unassigned"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Installment 1 — only show button if currently PAID */}
                          {student.installment1Paid ? (
                            <button
                              onClick={() => confirmMarkUnpaid(student, "installment1Paid")}
                              disabled={toggleLoading === student.id + "installment1Paid"}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                            >
                              {toggleLoading === student.id + "installment1Paid" ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Inst. 1 · Paid
                            </button>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-yellow-50 text-yellow-700 border-yellow-200 cursor-default">
                              <XCircle className="h-3 w-3" />
                              Inst. 1 · Unpaid
                            </span>
                          )}

                          {/* Installment 2 — only show button if currently PAID */}
                          {student.installment2Paid ? (
                            <button
                              onClick={() => confirmMarkUnpaid(student, "installment2Paid")}
                              disabled={toggleLoading === student.id + "installment2Paid"}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                            >
                              {toggleLoading === student.id + "installment2Paid" ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Inst. 2 · Paid
                            </button>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-yellow-50 text-yellow-700 border-yellow-200 cursor-default">
                              <XCircle className="h-3 w-3" />
                              Inst. 2 · Unpaid
                            </span>
                          )}

                          {/* History toggle */}
                          <button
                            onClick={() => toggleExpand(student.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                          >
                            {isLogsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            History
                            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>

                      {/* History — full fee log */}
                      {expanded && (
                        <div className="border-t bg-gray-50 p-4">
                          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                            Complete Fee History
                          </p>
                          {isLogsLoading ? (
                            <p className="text-xs text-gray-400 text-center py-3">Loading history…</p>
                          ) : logs.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-2">No fee activity recorded yet.</p>
                          ) : (
                            <div className="relative pl-5">
                              {/* Timeline line */}
                              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
                              <div className="space-y-3">
                                {logs.map((log, i) => {
                                  const meta = logMeta[log.eventType] ?? {
                                    label: log.eventType,
                                    color: "text-gray-700 bg-gray-50 border-gray-200",
                                    icon: <Clock className="h-3.5 w-3.5 text-gray-500" />,
                                  };
                                  return (
                                    <div key={log.id} className="relative">
                                      {/* Timeline dot */}
                                      <div className="absolute -left-5 top-2 w-3 h-3 rounded-full border-2 border-white bg-gray-300 shadow-sm" />
                                      <div className={`rounded-lg border px-3 py-2 ${meta.color}`}>
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <div className="flex items-center gap-1.5">
                                            {meta.icon}
                                            <span className="text-xs font-semibold">{meta.label}</span>
                                            <span className="text-[11px] opacity-75">
                                              — {log.installment === "INSTALLMENT1" ? "Installment 1" : "Installment 2"}
                                            </span>
                                          </div>
                                          <span className="text-[11px] opacity-70">{fmt(log.createdAt)}</span>
                                        </div>
                                        {log.note && (
                                          <p className="text-[11px] mt-1 opacity-75 leading-snug">{log.note}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
