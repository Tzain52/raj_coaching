import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { subjects: true, users: true } } },
    });
    res.json(classes);
  } catch {
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

router.post("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, displayOrder } = req.body;
    const newClass = await prisma.class.create({ data: { name, displayOrder } });
    res.json(newClass);
  } catch {
    res.status(500).json({ error: "Failed to create class" });
  }
});

router.patch("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, displayOrder } = req.body;
    const updated = await prisma.class.update({
      where: { id: req.params.id },
      data: { name, displayOrder },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update class" });
  }
});

router.delete("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    await prisma.class.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete class" });
  }
});

export default router;
