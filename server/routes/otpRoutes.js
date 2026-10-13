import { Router } from "express";
import { sendOtpHandler, verifyOtpHandler } from "./authRoutes.js";

const router = Router();

router.post("/send", sendOtpHandler);
router.post("/verify", verifyOtpHandler);

export default router;
