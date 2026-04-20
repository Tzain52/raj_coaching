import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StudentFeeSection from "@/components/student/fee-section";
import Link from "next/link";
import { ArrowLeft, Rocket, CreditCard } from "lucide-react";
import BottomNav from "@/components/student/bottom-nav";

export default async function StudentFeesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") redirect("/auth/signin");

  const [requests, student] = await Promise.all([
    (prisma as any).feeRequest.findMany({
      where: { studentId: session.user.id },
      orderBy: { requestedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { installment1Paid: true, installment2Paid: true },
    }),
  ]);

  return (
    <div
      className="min-h-screen bg-slate-950 pb-24"
      style={{ backgroundImage: "radial-gradient(rgba(0,212,255,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
    >
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/student">
            <button className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-white text-base">Fee Payments</h1>
            <p className="text-xs text-slate-500">Submit & track your installments</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <StudentFeeSection
          installment1Paid={student?.installment1Paid ?? false}
          installment2Paid={student?.installment2Paid ?? false}
          initialRequests={requests.map((r: any) => ({
            id: r.id as string,
            installment: r.installment as "INSTALLMENT1" | "INSTALLMENT2",
            status: r.status as "PENDING" | "APPROVED" | "REJECTED",
            requestedAt: new Date(r.requestedAt).toISOString(),
            resolvedAt: r.resolvedAt ? new Date(r.resolvedAt).toISOString() : null,
          }))}
        />
      </main>

      <BottomNav />
    </div>
  );
}
