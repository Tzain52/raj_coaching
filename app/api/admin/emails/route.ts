import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const emails = await prisma.authorizedEmail.findMany({
      include: { class: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(emails);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, classId } = body;

    const newEmail = await prisma.authorizedEmail.create({
      data: { email, role, classId },
      include: { class: true },
    });

    return NextResponse.json(newEmail);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add email" }, { status: 500 });
  }
}
