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
    console.log(`[Chat] Getting messages for conversation: ${conversationId}`);

    if (!conversationId) {
      return res
        .status(400)
        .json({ EC: -1, EM: "Conversation ID không hợp lệ", DT: [] });
    }

    const result = await chatService.getMessagesService(conversationId);
    console.log(`[Chat] Retrieved ${result.DT?.length || 0} messages`);
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> getMessages Error:", error);
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

// Upload ảnh cho tin nhắn
export const uploadChatImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ EC: -1, EM: "Vui lòng chọn một ảnh" });
    }

    const imageUrl = req.file.path;
    const publicId = req.file.filename;
    const caption = req.body.caption || "";

    return res.status(200).json({
      EC: 0,
      EM: "Upload ảnh thành công",
      DT: { imageUrl, publicId, caption },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi upload ảnh", DT: null });
  }
};
