import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { status, studentId } = req.query as Record<string, string | undefined>;
    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const requests = await (prisma as any).feeRequest.findMany({
      where,
      include: { student: { include: { class: true } } },
      orderBy: { requestedAt: "desc" },
    });
    res.json(requests);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const action = req.body.action as "APPROVE" | "REJECT";
    const adminNote = req.body.adminNote as string | undefined;

    if (!["APPROVE", "REJECT"].includes(action)) {
      res.status(400).json({ error: "Invalid action" });
      return;
    }

    const existing = await (prisma as any).feeRequest.findUnique({
      where: { id: req.params.id },
      include: { student: true },
    });

    if (!existing) { res.status(404).json({ error: "Request not found" }); return; }
    if (existing.status !== "PENDING") { res.status(400).json({ error: "Request already resolved" }); return; }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updated = await (tx as any).feeRequest.update({
        where: { id: existing.id },
        data: {
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          adminNote: adminNote ?? null,
          resolvedAt: now,
        },
      });

      if (action === "APPROVE") {
        const field = existing.installment === "INSTALLMENT1" ? "installment1Paid" : "installment2Paid";
        await tx.user.update({ where: { id: existing.studentId }, data: { [field]: true } });
      }

      await (tx as any).feeLog.create({
        data: {
          studentId: existing.studentId,
          installment: existing.installment,
          eventType: action === "APPROVE" ? "APPROVED" : "REJECTED",
          note: adminNote
            ? `${action === "APPROVE" ? "Approved" : "Rejected"} by admin — ${adminNote}`
            : `${action === "APPROVE" ? "Approved" : "Rejected"} by admin (${req.user!.email})`,
          createdAt: now,
        },
      });

      return updated;
    });

    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to update request" });
  }
});

export default router;
