import { Router, Response } from "express";
import { requireAuth, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    if (!req.user!.classId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const chapterId = req.query.chapterId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;

    if (chapterId) {
      const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, subject: { classId: req.user!.classId } },
      });
      if (!chapter) { res.status(404).json({ error: "Chapter not found" }); return; }

      const resources = await prisma.resource.findMany({ where: { chapterId }, orderBy: { createdAt: "desc" } });
      res.json(resources);
      return;
    }

    if (subjectId) {
      const subject = await prisma.subject.findFirst({ where: { id: subjectId, classId: req.user!.classId } });
      if (!subject) { res.status(404).json({ error: "Subject not found" }); return; }

      const chapters = await prisma.chapter.findMany({
        where: { subjectId },
        include: { resources: { orderBy: { createdAt: "desc" } } },
        orderBy: { name: "asc" },
      });
      res.json(chapters);
      return;
    }

    res.status(400).json({ error: "Missing parameters" });
  } catch {
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

export default router;
