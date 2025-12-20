import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const chapterId = searchParams.get("chapterId");

    if (chapterId) {
      const resources = await prisma.resource.findMany({
        where: { chapterId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(resources);
    }

    if (subjectId) {
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
