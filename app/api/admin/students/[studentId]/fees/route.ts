import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installment1Paid, installment2Paid } = await request.json();

    const data: Prisma.UserUpdateInput = {};

    if (typeof installment1Paid === "boolean") {
      data.installment1Paid = installment1Paid;
    }

    if (typeof installment2Paid === "boolean") {
      data.installment2Paid = installment2Paid;
    }

    if (!("installment1Paid" in data) && !("installment2Paid" in data)) {
      return NextResponse.json(
        { error: "No valid installment fields provided" },
        { status: 400 }
      );
    }

    const updatedStudent = await prisma.user.update({
      where: { id: params.studentId },
      data,
      include: { class: true },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Error updating installment status:", error);
    return NextResponse.json(
      { error: "Failed to update installment status" },
      { status: 500 }
    );
  }
}
