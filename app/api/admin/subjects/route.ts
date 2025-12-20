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
    const classId = searchParams.get("classId");

    const subjects = await prisma.subject.findMany({
      where: classId ? { classId } : undefined,
      include: {
        class: true,
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, classId } = body;

    const newSubject = await prisma.subject.create({
      data: { name, classId },
      include: { class: true },
    });

    return NextResponse.json(newSubject);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}
