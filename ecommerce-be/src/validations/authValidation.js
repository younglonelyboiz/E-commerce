import Joi from "joi";

export const registerSchema = Joi.object({
  user_name: Joi.string().min(3).max(30).required().messages({
    "string.min": "Tên phải ít nhất 3 ký tự",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Định dạng email không hợp lệ",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu phải từ 6 ký tự",
  }),
  // Kiểm tra confirmPassword khớp với password ngay tại đây
  confirmPassword: Joi.any().equal(Joi.ref("password")).required().messages({
    "any.only": "Mật khẩu xác nhận không khớp",
  }),
});
