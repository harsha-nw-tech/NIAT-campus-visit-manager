import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import searchRouter from "./search.js";
import campusRouter from "./campus.js";
import adminRouter from "./admin.js";
import logsRouter from "./logs.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(searchRouter);
router.use(campusRouter);
router.use(adminRouter);
router.use(logsRouter);

export default router;
