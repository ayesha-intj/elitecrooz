import { Router } from "express";
import apiKeyAuth from "../middleware/apiKeyAuth";
import upload from "../middleware/upload";
import { signUp } from "../controllers/userController";

const router = Router();

router.post("/sign-up", apiKeyAuth, upload.single("avatar"), signUp);

export default router;
