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
    const chapterId = searchParams.get("chapterId");
    const subjectId = searchParams.get("subjectId");

    const where: any = {};
    if (chapterId) where.chapterId = chapterId;
    if (subjectId) where.subjectId = subjectId;

    const resources = await prisma.resource.findMany({
      where,
      include: {
        chapter: {
          include: {
            subject: {
              include: {
                class: true,
              },
            },
          },
        },
        subject: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, description, link, chapterId, subjectId } = body;

    if (!title || !type || !link) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!chapterId && !subjectId) {
      return NextResponse.json({ error: "Either chapterId or subjectId is required" }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        type,
        description,
        link,
        chapterId: chapterId || null,
        subjectId: subjectId || null,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
