/**
 * @param {number} errorCode - Mã lỗi tự định nghĩa (0: thành công, 1: lỗi validate, -1: lỗi hệ thống...)
 * @param {string} errorMessage - Thông báo cho người dùng/frontend
 * @param {any} data - Dữ liệu thực tế trả về (Object hoặc Array)
 */
// src/utils/apiResponse.js
export const sendResponse = (res, ec, em, dt = null) => {
  return res.status(200).json({
    EC: ec,
    EM: em,
    DT: dt,
  });
};
