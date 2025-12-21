import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INSTALLMENTS = ["INSTALLMENT1", "INSTALLMENT2"] as const;
type FeeInstallment = (typeof INSTALLMENTS)[number];
const feeRequestRepo = (prisma as any).feeRequest;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await feeRequestRepo.findMany({
      where: { studentId: session.user.id },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching fee requests:", error);
    return NextResponse.json({ error: "Failed to fetch fee requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const installment = body.installment as FeeInstallment | undefined;

    if (!installment || !INSTALLMENTS.includes(installment)) {
      return NextResponse.json({ error: "Invalid installment" }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const installment1Flag = (student as any).installment1Paid as boolean | undefined;
    const installment2Flag = (student as any).installment2Paid as boolean | undefined;

    const alreadyPaid = installment === "INSTALLMENT1" ? !!installment1Flag : !!installment2Flag;

    if (alreadyPaid) {
      return NextResponse.json({ error: "Installment already marked as paid" }, { status: 400 });
    }

    const existingPending = await feeRequestRepo.findFirst({
      where: {
        studentId: student.id,
        installment,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json({ error: "Request already pending approval" }, { status: 400 });
    }

    const newRequest = await feeRequestRepo.create({
      data: {
        studentId: student.id,
        installment,
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error submitting fee request:", error);
    return NextResponse.json({ error: "Failed to submit fee request" }, { status: 500 });
  }
}
