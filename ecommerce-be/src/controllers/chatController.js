import * as chatService from "../services/chatService.js";

export const getUnreadCount = async (req, res) => {
  try {
    // TODO: Lấy userId từ req.user (middleware JWT)
    // const result = await chatService.countUnreadMessages(req.user.id);
    return res.status(200).json({ EC: 0, EM: "OK", DT: { count: 0 } });
  } catch (error) {
    return res.status(500).json({ EC: -1, EM: "Lỗi hệ thống", DT: "" });
  }
};

export const getConversations = async (req, res) => {
  // ...
};
