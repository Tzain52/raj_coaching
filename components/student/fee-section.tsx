"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, Clock, RefreshCcw } from "lucide-react";

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
}

const INSTALLMENTS: { key: InstallmentKey; label: string; description: string }[] = [
  {
    key: "INSTALLMENT1",
    label: "Installment 1",
    description: "First payment towards your annual fees.",
  },
  {
    key: "INSTALLMENT2",
    label: "Installment 2",
    description: "Second payment towards your annual fees.",
  },
];

const statusColors: Record<FeeRequestStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusLabels: Record<FeeRequestStatus, string> = {
  PENDING: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function StudentFeeSection({ initialRequests }: StudentFeeSectionProps) {
  const [requests, setRequests] = useState<FeeRequestView[]>(initialRequests);
  const [submitting, setSubmitting] = useState<InstallmentKey | null>(null);
  const { toast } = useToast();
  const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const getLatestFor = (installment: InstallmentKey) =>
    requests.find((request) => request.installment === installment);

  const handleRequest = async (installment: InstallmentKey) => {
    setSubmitting(installment);
    try {
      const res = await fetch("/api/student/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installment }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Failed to submit request");
      }

      const data = await res.json();

      setRequests((prev) => [
        {
          id: data.id,
          installment: data.installment,
          status: data.status,
          requestedAt: data.requestedAt,
          resolvedAt: data.resolvedAt,
        },
        ...prev,
      ]);

      toast({
        title: "Request submitted",
        description: "We'll review your payment confirmation shortly.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const actionLabel = (latest?: FeeRequestView) => {
    if (!latest) return "Request approval";
    if (latest.status === "PENDING") return "Waiting for approval";
    if (latest.status === "APPROVED") return "Approved";
    return "Request again";
  };

  const actionDisabled = (latest?: FeeRequestView) => {
    if (!latest) return false;
    return latest.status === "PENDING" || latest.status === "APPROVED";
  };

  const iconForStatus = (status: FeeRequestStatus) => {
    if (status === "APPROVED") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "PENDING") return <Clock className="h-4 w-4 text-yellow-600" />;
    return <RefreshCcw className="h-4 w-4 text-red-600" />;
  };

  const formatDate = (value: string | null) =>
    value ? dateFormatter.format(new Date(value)) : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Payments</CardTitle>
        <CardDescription>
          Submit your installment payments for verification by the administrator.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {INSTALLMENTS.map((installment) => {
            const latest = getLatestFor(installment.key);
            return (
              <div
                key={installment.key}
                className="border rounded-lg p-4 flex flex-col justify-between gap-3 bg-white"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{installment.label}</p>
                      <p className="text-sm text-gray-500">{installment.description}</p>
                    </div>
                    {latest && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${statusColors[latest.status]}`}
                      >
                        {statusLabels[latest.status]}
                      </span>
                    )}
                  </div>
                  {latest?.status === "REJECTED" && (
                    <p className="text-xs text-red-600">
                      Your previous submission was rejected. Please ensure your payment is correct
                      before requesting again.
                    </p>
                  )}
                  {latest?.status === "APPROVED" && (
                    <p className="text-xs text-green-600">
                      This installment has been approved. No further action is needed.
                    </p>
                  )}
                </div>

                <Button
                  variant={latest?.status === "APPROVED" ? "secondary" : "default"}
                  disabled={actionDisabled(latest) || submitting === installment.key}
                  onClick={() => handleRequest(installment.key)}
                  className="w-full"
                >
                  {submitting === installment.key ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {actionLabel(latest)}
                </Button>
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-900 mb-3">Request history</p>
          {requests.length === 0 ? (
            <p className="text-sm text-gray-500">No fee requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    {iconForStatus(request.status)}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {request.installment === "INSTALLMENT1" ? "Installment 1" : "Installment 2"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested: {formatDate(request.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${statusColors[request.status]}`}
                    >
                      {statusLabels[request.status]}
                    </span>
                    {request.resolvedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Resolved: {formatDate(request.resolvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
