import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const where: Record<string, any> = {};

    if (statusParam && ["PENDING", "APPROVED", "REJECTED"].includes(statusParam)) {
      where.status = statusParam;
    }

    const requests = await (prisma as any).feeRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            installment1Paid: true,
            installment2Paid: true,
            class: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching fee requests:", error);
    return NextResponse.json({ error: "Failed to fetch fee requests" }, { status: 500 });
  }
}
