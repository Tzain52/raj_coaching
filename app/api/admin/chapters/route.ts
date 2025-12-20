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
    const subjectId = searchParams.get("subjectId");

    const chapters = await prisma.chapter.findMany({
      where: subjectId ? { subjectId } : undefined,
      include: {
        subject: {
          include: { class: true },
        },
        _count: {
          select: { resources: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, subjectId } = body;

    const newChapter = await prisma.chapter.create({
      data: { name, subjectId },
      include: {
        subject: {
          include: { class: true },
        },
      },
    });

    return NextResponse.json(newChapter);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}
