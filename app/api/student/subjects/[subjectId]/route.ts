import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.classId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subject = await prisma.subject.findFirst({
      where: {
        id: params.subjectId,
        classId: session.user.classId,
      },
      include: {
        class: true,
        resources: {
          where: {
            chapterId: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        chapters: {
          include: {
            resources: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
