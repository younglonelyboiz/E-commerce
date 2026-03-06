import {
  getProductsWithFilter,
  getTopSaleProducts,
  getTopSellingProducts,
  getProductBySlug,
  createNewProduct,
  deleteProduct,
  updateProduct,
  getProductsForAdmin,
} from "../services/productService.js";
import { sendResponse } from "../utils/apiResponse.js";

export const readProductsForAdmin = async (req, res) => {
  try {
    // Gom các tham số từ URL
    const params = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      brandId: req.query.brandId,
      categoryId: req.query.categoryId,
      sort: req.query.sort,
    };

    const data = await getProductsForAdmin(params);
    return res.status(200).json({
      EC: data.EC,
      EM: data.EM,
      DT: data.DT,
    });
  } catch (error) {
    return sendResponse(res, result.EC, result.EM, result.DT);
  }
};

export const readProducts = async (req, res) => {
  try {
    const { slug } = req.query; // Lấy slug từ query string (?slug=...)

    if (slug) {
      // GỌI ĐÚNG HÀM NÀY ĐỂ LẤY 1 SẢN PHẨM
      const result = await getProductBySlug(slug);

      // Vì hàm getProductBySlug trả về object trực tiếp (không phải mảng),
      // ta bọc nó lại thành mảng để khớp với cấu trúc DT.products[0] ở Frontend
      const formattedDT = result.DT
        ? {
            totalRows: 1,
            products: [result.DT],
          }
        : null;

      return sendResponse(res, result.EC, result.EM, formattedDT);
    }

    // Nếu không có slug thì mới chạy logic filter danh sách cũ
    else {
      const result = await getProductsWithFilter(req.query);
      return sendResponse(res, result.EC, result.EM, result.DT);
    }
  } catch (error) {
    console.error(">>> Controller Error:", error);
    return sendResponse(res, -1, "Lỗi hệ thống", null);
  }
};

export const createProduct = async (req, res) => {
  try {
    const result = await createNewProduct(req.body);
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error(">>> Controller Create Error:", error);
    return sendResponse(res, -1, "Lỗi server (Create)", null);
  }
};

export const updateProductbyID = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateProduct(id, req.body);
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error(">>> Controller Update Error:", error);
    return sendResponse(res, -1, "Lỗi server (Update)", null);
  }
};

export const deleteProductbyID = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteProduct(id);
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error(">>> Controller Delete Error:", error);
    return sendResponse(res, -1, "Lỗi server (Delete)", null);
  }
};

export const getSaleList = async (req, res) => {
  try {
    const result = await getTopSaleProducts();
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error(">>> Controller Sale Error:", error);
    return sendResponse(res, -1, "Lỗi server (Sale List)", null);
  }
};

export const getSalingList = async (req, res) => {
  try {
    const result = await getTopSellingProducts();
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error(">>> Controller Selling Error:", error);
    return sendResponse(res, -1, "Lỗi server (Selling List)", null);
  }
};
