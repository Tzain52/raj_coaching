import { Router, Response } from "express";
import { requireStudent, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireStudent, async (req: AuthedRequest, res: Response) => {
  try {
    if (!req.user!.classId) { res.status(404).json({ error: "No class assigned" }); return; }

    const userClass = await prisma.class.findUnique({
      where: { id: req.user!.classId },
      include: {
        subjects: {
          orderBy: { name: "asc" },
          include: { _count: { select: { chapters: true } } },
        },
      },
    });
    res.json(userClass);
  } catch {
    res.status(500).json({ error: "Failed to fetch class" });
  }
});

export default router;
