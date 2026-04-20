import { Router, Response } from "express";
import { requireAdmin, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.get("/", requireAdmin, async (_req: AuthedRequest, res: Response) => {
  try {
    const emails = await prisma.authorizedEmail.findMany({
      include: { class: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(emails);
  } catch {
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

router.post("/", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { email, role, classId } = req.body;
    const newEmail = await prisma.authorizedEmail.create({
      data: { email, role, classId },
      include: { class: true },
    });
    res.json(newEmail);
  } catch {
    res.status(500).json({ error: "Failed to add email" });
  }
});

router.delete("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    await prisma.authorizedEmail.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete email" });
  }
});

export default router;
