import express from "express";
import { checkUserJWT } from "../middlewares/JWTAction.js";
import {
  askAI,
  getAIHistory,
  resetAIChat,
} from "../controllers/aiChatController.js";

const router = express.Router();

router.all("*", checkUserJWT);

router.post("/", askAI);
router.get("/history", getAIHistory);
router.delete("/", resetAIChat);

export default router;
