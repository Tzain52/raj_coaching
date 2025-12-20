import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "STUDENT" && session.user.classId) {
      const userClass = await prisma.class.findUnique({
        where: { id: session.user.classId },
        include: {
          subjects: {
            orderBy: { name: "asc" },
            include: {
              _count: {
                select: { chapters: true },
              },
            },
          },
        },
      });

      return NextResponse.json(userClass);
    }

    return NextResponse.json({ error: "No class assigned" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 });
  }
}
