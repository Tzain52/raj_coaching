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

    const [classes, totalCounts, installment1Counts, installment2Counts] = await Promise.all([
      prisma.class.findMany({
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.user.groupBy({
        by: ["classId"],
        where: { role: "STUDENT" },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ["classId"],
        where: { role: "STUDENT", installment1Paid: true },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ["classId"],
        where: { role: "STUDENT", installment2Paid: true },
        _count: { _all: true },
      }),
    ]);

    const toMap = (rows: { classId: string | null; _count: { _all: number } }[]) => {
      return rows.reduce((map, row) => {
        map.set(row.classId ?? "unassigned", row._count._all);
        return map;
      }, new Map<string, number>());
    };

    const totalsMap = toMap(totalCounts);
    const installment1Map = toMap(installment1Counts);
    const installment2Map = toMap(installment2Counts);

    const totalStudents = totalCounts.reduce((sum, row) => sum + row._count._all, 0);
    const installment1PaidTotal = installment1Counts.reduce((sum, row) => sum + row._count._all, 0);
    const installment2PaidTotal = installment2Counts.reduce((sum, row) => sum + row._count._all, 0);

    const unassigned = {
      id: "unassigned",
      name: "Unassigned",
      total: totalsMap.get("unassigned") ?? 0,
      installment1Paid: installment1Map.get("unassigned") ?? 0,
      installment2Paid: installment2Map.get("unassigned") ?? 0,
    };

    const classMetrics = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      total: totalsMap.get(cls.id) ?? 0,
      installment1Paid: installment1Map.get(cls.id) ?? 0,
      installment2Paid: installment2Map.get(cls.id) ?? 0,
    }));

    return NextResponse.json({
      totals: {
        totalStudents,
        installment1Paid: installment1PaidTotal,
        installment2Paid: installment2PaidTotal,
        unassigned: unassigned.total,
      },
      classMetrics,
      unassigned,
    });
  } catch (error) {
    console.error("Error generating student metrics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
