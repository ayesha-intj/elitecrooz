import { Router } from "express";
import apiKeyAuth from "../middleware/apiKeyAuth";
import upload from "../middleware/upload";
import { signUp, login, resetPassword } from "../controllers/userController";
const router = Router();

router.post("/sign-up", apiKeyAuth, upload.single("avatar"), signUp);
router.post("/login", apiKeyAuth, login);
router.put("/rest-password", apiKeyAuth, resetPassword);

export default router;
