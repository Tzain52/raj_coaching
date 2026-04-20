import { Router, Response } from "express";
import { requireAuth, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/:subjectId", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    if (!req.user!.classId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const subject = await prisma.subject.findFirst({
      where: { id: req.params.subjectId, classId: req.user!.classId },
      include: {
        class: true,
        resources: { where: { chapterId: null }, orderBy: { createdAt: "desc" } },
        chapters: {
          include: { resources: { orderBy: { createdAt: "desc" } } },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!subject) { res.status(404).json({ error: "Subject not found" }); return; }
    res.json(subject);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
