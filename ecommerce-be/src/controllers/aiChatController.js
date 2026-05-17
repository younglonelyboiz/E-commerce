import {
  askAIService,
  getAIHistoryService,
  resetAIChatService,
} from "../services/aiChatService.js";

export const askAI = async (req, res) => {
  try {
    const userId = req.user.id;
    const { question } = req.body;
    const result = await askAIService(userId, question);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> askAI Controller Error:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const getAIHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getAIHistoryService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> getAIHistory Controller Error:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const resetAIChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await resetAIChatService(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> resetAIChat Controller Error:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};
