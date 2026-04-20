import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { classId, installment1, installment2 } = req.query as Record<string, string | undefined>;
    const where: Record<string, any> = {};
    if (classId) where.classId = classId === "none" ? null : classId;
    if (installment1 === "paid") where.installment1Paid = true;
    if (installment1 === "unpaid") where.installment1Paid = false;
    if (installment2 === "paid") where.installment2Paid = true;
    if (installment2 === "unpaid") where.installment2Paid = false;

    const users = await prisma.user.findMany({
      include: { class: true },
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const name = (req.body.name as string | undefined)?.trim();
    const email = (req.body.email as string | undefined)?.trim().toLowerCase();
    const phone = (req.body.phone as string | undefined)?.trim() || null;
    const classId = req.body.classId ? (req.body.classId as string) : null;
    const installment1Paid = Boolean(req.body.installment1Paid);
    const installment2Paid = Boolean(req.body.installment2Paid);

    if (!name || !email) { res.status(400).json({ error: "Name and email are required" }); return; }
    if (phone && !/^\+91[0-9]{10}$/.test(phone)) {
      res.status(400).json({ error: "Phone must be +91 followed by 10 digits" }); return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(409).json({ error: "A user with this email already exists" }); return; }

    await prisma.authorizedEmail.upsert({
      where: { email },
      update: { role: "STUDENT", classId },
      create: { email, role: "STUDENT", classId },
    });

    const user = await prisma.user.create({
      data: { name, email, phone, role: "STUDENT", classId, installment1Paid, installment2Paid },
      include: { class: true },
    });
    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: "Failed to create student" });
  }
});

router.get("/metrics", requireAdmin, async (_req: AuthedRequest, res: Response) => {
  try {
    const [classes, totalCounts, installment1Counts, installment2Counts] = await Promise.all([
      prisma.class.findMany({ orderBy: { displayOrder: "asc" }, select: { id: true, name: true } }),
      prisma.user.groupBy({ by: ["classId"], where: { role: "STUDENT" }, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["classId"], where: { role: "STUDENT", installment1Paid: true }, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["classId"], where: { role: "STUDENT", installment2Paid: true }, _count: { _all: true } }),
    ]);

    const toMap = (rows: { classId: string | null; _count: { _all: number } }[]) =>
      rows.reduce((m, r) => { m.set(r.classId ?? "unassigned", r._count._all); return m; }, new Map<string, number>());

    const totalsMap = toMap(totalCounts);
    const i1Map = toMap(installment1Counts);
    const i2Map = toMap(installment2Counts);

    res.json({
      totals: {
        totalStudents: totalCounts.reduce((s, r) => s + r._count._all, 0),
        installment1Paid: installment1Counts.reduce((s, r) => s + r._count._all, 0),
        installment2Paid: installment2Counts.reduce((s, r) => s + r._count._all, 0),
        unassigned: totalsMap.get("unassigned") ?? 0,
      },
      classMetrics: classes.map((c) => ({
        id: c.id, name: c.name,
        total: totalsMap.get(c.id) ?? 0,
        installment1Paid: i1Map.get(c.id) ?? 0,
        installment2Paid: i2Map.get(c.id) ?? 0,
      })),
      unassigned: {
        id: "unassigned", name: "Unassigned",
        total: totalsMap.get("unassigned") ?? 0,
        installment1Paid: i1Map.get("unassigned") ?? 0,
        installment2Paid: i2Map.get("unassigned") ?? 0,
      },
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:studentId", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, phone, classId, installment1Paid, installment2Paid } = req.body;

    const current = await prisma.user.findUnique({
      where: { id: req.params.studentId },
      select: { id: true, role: true, phone: true, installment1Paid: true, installment2Paid: true },
    });
    if (!current || current.role !== "STUDENT") { res.status(404).json({ error: "Student not found" }); return; }

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (classId !== undefined) data.classId = classId || null;

    if (phone !== undefined && phone !== null && phone !== "") {
      if (current.phone && current.phone !== phone) {
        res.status(400).json({ error: "Phone number cannot be changed once it has been set" }); return;
      }
      if (!current.phone) data.phone = phone;
    }
    if (typeof installment1Paid === "boolean") data.installment1Paid = installment1Paid;
    if (typeof installment2Paid === "boolean") data.installment2Paid = installment2Paid;

    const now = new Date();
    const logEntries: any[] = [];

    if (typeof installment1Paid === "boolean" && installment1Paid !== current.installment1Paid) {
      logEntries.push({
        studentId: req.params.studentId, installment: "INSTALLMENT1",
        eventType: installment1Paid ? "ADMIN_MARKED_PAID" : "MARKED_UNPAID",
        note: `Installment 1 marked ${installment1Paid ? "paid" : "unpaid"} by admin (${req.user!.email}) via student edit`,
        createdAt: now,
      });
    }
    if (typeof installment2Paid === "boolean" && installment2Paid !== current.installment2Paid) {
      logEntries.push({
        studentId: req.params.studentId, installment: "INSTALLMENT2",
        eventType: installment2Paid ? "ADMIN_MARKED_PAID" : "MARKED_UNPAID",
        note: `Installment 2 marked ${installment2Paid ? "paid" : "unpaid"} by admin (${req.user!.email}) via student edit`,
        createdAt: now,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({ where: { id: req.params.studentId }, data, include: { class: true } });
      if (logEntries.length) await (tx as any).feeLog.createMany({ data: logEntries });
      return result;
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update student" });
  }
});

router.delete("/:studentId", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.params.studentId },
      select: { id: true, role: true, email: true },
    });
    if (!student || student.role !== "STUDENT") { res.status(404).json({ error: "Student not found" }); return; }

    await prisma.$transaction([
      prisma.user.delete({ where: { id: student.id } }),
      prisma.authorizedEmail.deleteMany({ where: { email: student.email ?? "" } }),
    ]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

router.patch("/:studentId/assign-class", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { classId } = req.body;
    await prisma.user.update({ where: { id: req.params.studentId }, data: { classId: classId || null } });
    const user = await prisma.user.findUnique({ where: { id: req.params.studentId } });
    if (user) {
      await prisma.authorizedEmail.updateMany({ where: { email: user.email }, data: { classId: classId || null } });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:studentId/fees", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { installment1Paid, installment2Paid } = req.body;
    if (installment1Paid === true || installment2Paid === true) {
      res.status(400).json({ error: "Marking as paid must be done via fee request approval" }); return;
    }

    const student = await prisma.user.findUnique({
      where: { id: req.params.studentId },
      select: { id: true, installment1Paid: true, installment2Paid: true },
    });
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }

    const now = new Date();
    const logEntries: any[] = [];
    const updateData: Record<string, boolean> = {};

    if (installment1Paid === false && student.installment1Paid) {
      updateData.installment1Paid = false;
      logEntries.push({ studentId: req.params.studentId, installment: "INSTALLMENT1", eventType: "MARKED_UNPAID", note: `Marked unpaid by admin (${req.user!.email})`, createdAt: now });
    }
    if (installment2Paid === false && student.installment2Paid) {
      updateData.installment2Paid = false;
      logEntries.push({ studentId: req.params.studentId, installment: "INSTALLMENT2", eventType: "MARKED_UNPAID", note: `Marked unpaid by admin (${req.user!.email})`, createdAt: now });
    }
    if (!Object.keys(updateData).length) { res.status(400).json({ error: "Nothing to update" }); return; }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({ where: { id: req.params.studentId }, data: updateData, include: { class: true } });
      if (logEntries.length) await (tx as any).feeLog.createMany({ data: logEntries });
      return result;
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update installment status" });
  }
});

router.post("/bulk-assign", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { studentIds, classId } = req.body;
    if (!Array.isArray(studentIds) || !studentIds.length) { res.status(400).json({ error: "Invalid student IDs" }); return; }

    await prisma.user.updateMany({ where: { id: { in: studentIds }, role: "STUDENT" }, data: { classId: classId || null } });
    const users = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { email: true } });
    await prisma.authorizedEmail.updateMany({ where: { email: { in: users.map((u) => u.email) } }, data: { classId: classId || null } });

    res.json({ success: true, updated: studentIds.length });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
