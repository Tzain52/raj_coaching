import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import adminClasses from "./routes/admin/classes";
import adminSubjects from "./routes/admin/subjects";
import adminChapters from "./routes/admin/chapters";
import adminResources from "./routes/admin/resources";
import adminEmails from "./routes/admin/emails";
import adminContent from "./routes/admin/content";
import adminFeeLogs from "./routes/admin/feeLogs";
import adminFeeRequests from "./routes/admin/feeRequests";
import adminStudents from "./routes/admin/students";
import adminUpload from "./routes/admin/upload";
import studentClasses from "./routes/student/classes";
import studentFees from "./routes/student/fees";
import studentSubjects from "./routes/student/subjects";
import studentResources from "./routes/student/resources";

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.set("trust proxy", 1);
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
}));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/admin/classes", adminClasses);
app.use("/admin/subjects", adminSubjects);
app.use("/admin/chapters", adminChapters);
app.use("/admin/resources", adminResources);
app.use("/admin/emails", adminEmails);
app.use("/admin/content", adminContent);
app.use("/admin/fee-logs", adminFeeLogs);
app.use("/admin/fee-requests", adminFeeRequests);
app.use("/admin/students", adminStudents);
app.use("/admin/upload", adminUpload);
app.use("/student/classes", studentClasses);
app.use("/student/fees", studentFees);
app.use("/student/subjects", studentSubjects);
app.use("/student/resources", studentResources);

const PORT = parseInt(process.env.PORT ?? "8080", 10);
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
