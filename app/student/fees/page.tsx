import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StudentFeeSection from "@/components/student/fee-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function StudentFeesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/auth/signin");
  }

  const requests = await (prisma as any).feeRequest.findMany({
    where: { studentId: session.user.id },
    orderBy: { requestedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">RCCC Portal</p>
            <h1 className="text-3xl font-bold text-gray-900">Manage Fees</h1>
            <p className="text-sm text-gray-500">
              Submit installment payments for approval and track their status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/student">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentFeeSection
          initialRequests={requests.map((request: any) => ({
            id: request.id as string,
            installment: request.installment as "INSTALLMENT1" | "INSTALLMENT2",
            status: request.status as "PENDING" | "APPROVED" | "REJECTED",
            requestedAt: new Date(request.requestedAt).toISOString(),
            resolvedAt: request.resolvedAt ? new Date(request.resolvedAt).toISOString() : null,
          }))}
        />
      </main>
    </div>
  );
}
