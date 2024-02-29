import express from "express";

import {
  dealerLogin,
  dealerSignup,
} from "../controllers/dealerAuthController.js";

const router = express.Router();

router.post("/signup", dealerSignup);
router.post("/login", dealerLogin);

export default router;
