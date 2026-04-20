import { Router, Response } from "express";
import { requireStudent, AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();
const INSTALLMENTS = ["INSTALLMENT1", "INSTALLMENT2"] as const;
type FeeInstallment = (typeof INSTALLMENTS)[number];

router.get("/", requireStudent, async (req: AuthedRequest, res: Response) => {
  try {
    const requests = await (prisma as any).feeRequest.findMany({
      where: { studentId: req.user!.id },
      orderBy: { requestedAt: "desc" },
    });
    res.json(requests);
  } catch {
    res.status(500).json({ error: "Failed to fetch fee requests" });
  }
});

router.post("/", requireStudent, async (req: AuthedRequest, res: Response) => {
  try {
    const installment = req.body.installment as FeeInstallment | undefined;
    if (!installment || !INSTALLMENTS.includes(installment)) {
      res.status(400).json({ error: "Invalid installment" }); return;
    }

    const student = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }

    const alreadyPaid = installment === "INSTALLMENT1"
      ? !!(student as any).installment1Paid
      : !!(student as any).installment2Paid;
    if (alreadyPaid) { res.status(400).json({ error: "Installment already marked as paid" }); return; }

    const existingPending = await (prisma as any).feeRequest.findFirst({
      where: { studentId: student.id, installment, status: "PENDING" },
    });
    if (existingPending) { res.status(400).json({ error: "Request already pending approval" }); return; }

    const now = new Date();
    const newRequest = await prisma.$transaction(async (tx) => {
      const req2 = await (tx as any).feeRequest.create({ data: { studentId: student.id, installment } });
      await (tx as any).feeLog.create({
        data: {
          studentId: student.id, installment, eventType: "REQUEST_RAISED",
          note: `Student raised payment request for ${installment === "INSTALLMENT1" ? "Installment 1" : "Installment 2"}`,
          createdAt: now,
        },
      });
      return req2;
    });

    res.status(201).json(newRequest);
  } catch {
    res.status(500).json({ error: "Failed to submit fee request" });
  }
});

export default router;
