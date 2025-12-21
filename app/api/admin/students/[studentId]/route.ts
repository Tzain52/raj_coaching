import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.user.findUnique({
      where: { id: params.studentId },
      select: { id: true, role: true, email: true },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.delete({ where: { id: student.id } }),
      prisma.authorizedEmail.deleteMany({ where: { email: student.email ?? "" } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
