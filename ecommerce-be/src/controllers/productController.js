import {
  getProductsWithFilter,
  getTopSaleProducts,
  getTopSellingProducts,
  getProductBySlug,
  createNewProduct,
  deleteProduct,
  updateProduct,
  getProductsForAdmin,
  getSearchSuggestions, // Import hàm mới
  getProductDetailById,
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

// Lấy chi tiết sản phẩm theo ID (dùng cho Admin Edit)
export const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getProductDetailById(id);
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error(">>> Controller getProductDetail Error:", error);
    return sendResponse(res, -1, "Lỗi server", null);
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const { search, limit } = req.query;
    const result = await getSearchSuggestions({ search, limit });
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error(">>> Controller getSuggestions Error:", error);
    return sendResponse(res, -1, "Lỗi hệ thống khi lấy gợi ý tìm kiếm", null);
  }
};

export const createProduct = async (req, res) => {
  try {
    const data = req.body;

    // Chuyển mảng string link (nhập tay) thành object
    let newImageUrls = [];
    if (data.newImageUrls) {
      let parsedUrls = [];
      if (typeof data.newImageUrls === "string") {
        try {
          parsedUrls = JSON.parse(data.newImageUrls);
        } catch (e) {
          parsedUrls = [data.newImageUrls];
        }
      } else if (Array.isArray(data.newImageUrls)) {
        parsedUrls = data.newImageUrls;
      } else {
        parsedUrls = [data.newImageUrls];
      }
      newImageUrls = parsedUrls.map((url) => ({
        url: typeof url === "string" ? url : url.url,
        public_id: null,
      }));
    }

    // Chuyển mảng file (từ Cloudinary trả về) thành object
    let uploadedFiles = [];
    if (req.files) {
      uploadedFiles = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    // Nếu dùng JSON thuần và truyền thẳng mảng images thay vì form-data
    let rawImages = [];
    if (data.images) {
      if (typeof data.images === "string") {
        try {
          rawImages = JSON.parse(data.images);
        } catch (e) {
          rawImages = [data.images];
        }
      } else if (Array.isArray(data.images)) {
        rawImages = data.images;
      } else {
        rawImages = [data.images];
      }
    }

    data.images = [...rawImages, ...newImageUrls, ...uploadedFiles].filter(
      (img) => img,
    );

    const result = await createNewProduct(data);
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    console.error(">>> Controller Create Error:", error);
    return sendResponse(res, -1, "Lỗi server (Create)", null);
  }
};

export const updateProductbyID = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    console.log(`\n=== [CONTROLLER] BẮT ĐẦU CẬP NHẬT SẢN PHẨM ID: ${id} ===`);
    console.log(
      ">>> [Controller] req.body nhận được:",
      JSON.stringify(data, null, 2),
    );
    console.log(
      ">>> [Controller] req.files nhận được:",
      req.files ? req.files.length + " files" : "Không có file",
    );

    // 1. Kiểm tra ID có tồn tại trong params không (Tránh null/undefined)
    if (!id) {
      return sendResponse(res, 1, "Missing product ID", null);
    }

    // Chỉ phân tích và ghi đè mảng ảnh nếu Frontend thực sự có gửi dữ liệu liên quan đến ảnh (multipart/form-data)
    if (
      data.keptImages !== undefined ||
      data.newImageUrls !== undefined ||
      (req.files && req.files.length > 0)
    ) {
      let keptImages = [];
      if (data.keptImages) {
        if (typeof data.keptImages === "string") {
          try {
            keptImages = JSON.parse(data.keptImages);
          } catch (e) {
            keptImages = [data.keptImages];
          }
        } else if (Array.isArray(data.keptImages)) {
          keptImages = data.keptImages;
        } else {
          keptImages = [data.keptImages];
        }
      }

      let newImageUrls = [];
      if (data.newImageUrls) {
        let parsedUrls = [];
        if (typeof data.newImageUrls === "string") {
          try {
            parsedUrls = JSON.parse(data.newImageUrls);
          } catch (e) {
            parsedUrls = [data.newImageUrls];
          }
        } else if (Array.isArray(data.newImageUrls)) {
          parsedUrls = data.newImageUrls;
        } else {
          parsedUrls = [data.newImageUrls];
        }
        newImageUrls = parsedUrls.map((url) => ({
          url: typeof url === "string" ? url : url.url,
          public_id: null,
        }));
      }

      let uploadedFiles = [];
      if (req.files) {
        uploadedFiles = req.files.map((file) => ({
          url: file.path,
          public_id: file.filename,
        }));
      }

      // Gộp tất cả làm 1 cho Service
      data.images = [...keptImages, ...newImageUrls, ...uploadedFiles].filter(
        (img) => img,
      );
      console.log(
        ">>> [Controller] data.images sau khi parse form-data:",
        data.images,
      );
    } else if (data.images) {
      // Xử lý trường hợp Frontend truyền thẳng mảng ảnh vào data.images (ko qua keptImages)
      if (typeof data.images === "string") {
        try {
          data.images = JSON.parse(data.images);
        } catch (e) {
          data.images = [data.images];
        }
      } else if (!Array.isArray(data.images)) {
        data.images = [data.images];
      }
      console.log(
        ">>> [Controller] data.images sau khi parse JSON thuần:",
        data.images,
      );
    }

    console.log(
      ">>> [Controller] Dữ liệu chuẩn bị truyền xuống Service:",
      JSON.stringify(data, null, 2),
    );
    const result = await updateProduct(id, data);
    console.log(">>> [Controller] Kết quả từ Service trả về:", result);

    // 4. Trả về kết quả đồng nhất qua sendResponse
    return sendResponse(res, result.EC, result.EM, result.DT);
  } catch (error) {
    // Log lỗi chi tiết để debug trong môi trường development
    console.error(">>> Controller Update Error:", error);

    return sendResponse(res, -1, "Internal Server Error", null);
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
