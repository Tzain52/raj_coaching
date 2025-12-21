"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    class: {
      id: string;
      name: string;
    } | null;
  };
}

const statusColors: Record<FeeRequestStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusIcon = (status: FeeRequestStatus) => {
  if (status === "APPROVED") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === "PENDING") return <Clock className="h-4 w-4 text-yellow-600" />;
  return <RefreshCcw className="h-4 w-4 text-red-600" />;
};

export default function AdminFeeRequestsPage() {
  const [requests, setRequests] = useState<FeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FeeRequestStatus | "ALL">("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/fee-requests${query}`);

      if (!res.ok) {
        throw new Error("Failed to fetch fee requests");
      }

      const data = await res.json();
      setRequests(
        data.map((item: any) => ({
          ...item,
          requestedAt: item.requestedAt,
          resolvedAt: item.resolvedAt,
        }))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to load requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(id + action);
    try {
      const res = await fetch(`/api/admin/fee-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Request failed");
      }

      toast({
        title: `Request ${action === "APPROVE" ? "approved" : "rejected"}`,
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString() : "—";

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Requests</h1>
              <p className="text-sm text-gray-600">Review and approve student payments</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
              <CardDescription>All fee requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
              <CardDescription>Awaiting action</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Approved</CardTitle>
              <CardDescription>Marked as paid</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rejected</CardTitle>
              <CardDescription>Needs re-submission</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Requests</CardTitle>
                <CardDescription>Filter by status to focus on pending actions</CardDescription>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as FeeRequestStatus | "ALL")}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-gray-500">No requests found for this filter.</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {statusIcon(request.status)}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {request.student.name || request.student.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.student.email} •{" "}
                          {request.student.class?.name ? `Class ${request.student.class.name}` : "Unassigned"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {request.installment === "INSTALLMENT1" ? "Installment 1" : "Installment 2"} • Requested{" "}
                          {formatDate(request.requestedAt)}
                          {request.resolvedAt && ` • Resolved ${formatDate(request.resolvedAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {request.status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(request.id, "APPROVE")}
                            disabled={actionLoading === request.id + "APPROVE"}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request.id, "REJECT")}
                            disabled={actionLoading === request.id + "REJECT"}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[request.status]}`}>
                          {request.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
