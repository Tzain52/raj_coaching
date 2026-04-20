import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const studentId = req.query.studentId as string | undefined;
    const logs = await (prisma as any).feeLog.findMany({
      where: studentId ? { studentId } : {},
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Failed to fetch fee logs" });
  }
});

export default router;
