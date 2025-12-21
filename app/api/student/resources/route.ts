import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT" || !session.user.classId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const chapterId = searchParams.get("chapterId");

    if (chapterId) {
      const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, subject: { classId: session.user.classId } },
      });

      if (!chapter) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
      }

      const resources = await prisma.resource.findMany({
        where: { chapterId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(resources);
    }

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, classId: session.user.classId },
      });

      if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }

      const chapters = await prisma.chapter.findMany({
        where: { subjectId },
        include: {
          resources: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(chapters);
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}
