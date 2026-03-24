import * as chatService from "../services/chatService.js";

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await chatService.getUnreadCountService(userId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ EC: -1, EM: "Lỗi hệ thống", DT: 0 });
  }
};

export const getConversations = async (req, res) => {
  try {
    const result = await chatService.getConversationsService();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ EC: -1, EM: "Lỗi hệ thống", DT: [] });
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const result = await chatService.getMessagesService(conversationId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ EC: -1, EM: "Lỗi hệ thống", DT: [] });
  }
};

export const getUserMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await chatService.getUserMessagesService(userId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ EC: -1, EM: "Lỗi hệ thống", DT: [] });
  }
};
