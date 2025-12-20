import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    const { classId } = await request.json();

    // Update user
    await prisma.user.update({
      where: { id: params.studentId },
      data: { classId: classId || null },
    });

    // Also update authorized email if exists
    const user = await prisma.user.findUnique({
      where: { id: params.studentId },
    });

    if (user) {
      await prisma.authorizedEmail.updateMany({
        where: { email: user.email },
        data: { classId: classId || null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning class:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
