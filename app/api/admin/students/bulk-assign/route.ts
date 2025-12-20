import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentIds, classId } = await request.json();

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "Invalid student IDs" }, { status: 400 });
    }

    // Update all users
    await prisma.user.updateMany({
      where: {
        id: { in: studentIds },
        role: "STUDENT",
      },
      data: { classId: classId || null },
    });

    // Get emails of updated users
    const users = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { email: true },
    });

    const emails = users.map((u) => u.email);

    // Update authorized emails
    await prisma.authorizedEmail.updateMany({
      where: { email: { in: emails } },
      data: { classId: classId || null },
    });

    return NextResponse.json({ 
      success: true, 
      updated: studentIds.length 
    });
  } catch (error) {
    console.error("Error bulk assigning classes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
