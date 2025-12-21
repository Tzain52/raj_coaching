import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const feeRequestRepo = (prisma as any).feeRequest;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as "APPROVE" | "REJECT";
    const adminNote = body.adminNote as string | undefined;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const existing = await feeRequestRepo.findUnique({
      where: { id: params.id },
      include: { student: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Request already resolved" }, { status: 400 });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updated = await (tx as any).feeRequest.update({
        where: { id: existing.id },
        data: {
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          adminNote: adminNote ?? null,
          resolvedAt: now,
        },
      });

      if (action === "APPROVE") {
        const installmentField =
          existing.installment === "INSTALLMENT1" ? "installment1Paid" : "installment2Paid";

        await tx.user.update({
          where: { id: existing.studentId },
          data: {
            [installmentField]: true,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating fee request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
