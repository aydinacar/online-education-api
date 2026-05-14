import { Router } from "express";
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import coursesRoutes from "./courses.routes";
import lessonsRoutes from "./lessons.routes";
import sectionsRoutes from "./sections.routes";
import enrollmentsRoutes from "./enrollments.routes";
import categoriesRoutes from "./categories.routes";
import reviewsRoutes from "./reviews.routes";
import paymentsRoutes from "./payments.routes";
import workspacesRoutes from "./workspaces.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/courses", coursesRoutes);
router.use("/lessons", lessonsRoutes);
router.use("/sections", sectionsRoutes);
router.use("/enrollments", enrollmentsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/workspaces", workspacesRoutes);

export default router;
