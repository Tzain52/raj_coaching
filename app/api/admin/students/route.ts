import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId") || undefined;
    const installment1 = searchParams.get("installment1");
    const installment2 = searchParams.get("installment2");

    const where: Record<string, any> = {};

    if (classId) {
      where.classId = classId === "none" ? null : classId;
    }

    if (installment1 === "paid") where.installment1Paid = true;
    if (installment1 === "unpaid") where.installment1Paid = false;

    if (installment2 === "paid") where.installment2Paid = true;
    if (installment2 === "unpaid") where.installment2Paid = false;

    const users = await prisma.user.findMany({
      include: {
        class: true,
      },
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching students:", error);
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
    const name = (body.name as string | undefined)?.trim();
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const classId = body.classId ? (body.classId as string) : null;
    const installment1Paid = Boolean(body.installment1Paid);
    const installment2Paid = Boolean(body.installment2Paid);

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    await prisma.authorizedEmail.upsert({
      where: { email },
      update: {
        role: "STUDENT",
        classId,
      },
      create: {
        email,
        role: "STUDENT",
        classId,
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: "STUDENT",
        classId,
        installment1Paid,
        installment2Paid,
      },
      include: {
        class: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
