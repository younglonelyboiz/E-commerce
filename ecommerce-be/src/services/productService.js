import db from "../models/index.js";
import { Op } from "sequelize";
import slugify from "slugify";

// Helper nội bộ: Phẳng hóa dữ liệu ảnh để lấy thumbnailUrl cho Frontend
const formatProductThumbnail = (product) => {
  if (!product) return null;
  const item = product.get({ plain: true });

  // Alias 'product_images' phải khớp chính xác với initModels.js
  if (item.product_images && item.product_images.length > 0) {
    item.thumbnailUrl = item.product_images[0].url;
  } else {
    item.thumbnailUrl = item.image_url || null;
  }
  delete item.product_images;
  return item;
};

const getProductsWithFilter = async (params) => {
  try {
    const {
      page,
      limit,
      search,
      sort,
      minPrice,
      maxPrice,
      brandId,
      categoryId,
      slug, // THÊM: Lấy slug từ params truyền lên
    } = params;

    let offset = (page - 1) * limit;

    const sortOptions = {
      price_asc: [["discount_price", "ASC"]],
      price_desc: [["discount_price", "DESC"]],
      name_asc: [["name", "ASC"]],
      name_desc: [["name", "DESC"]],
      id_asc: [["id", "ASC"]],
      id_desc: [["id", "DESC"]],
    };

    // Khởi tạo điều kiện lọc
    let whereCondition = {};

    // TRƯỜNG HỢP 1: Nếu có slug (Trang chi tiết), chỉ tìm duy nhất sản phẩm đó
    if (slug) {
      whereCondition.slug = slug;
    }
    // TRƯỜNG HỢP 2: Nếu không có slug (Trang danh sách), dùng các filter bình thường
    else {
      if (minPrice !== undefined && maxPrice !== undefined) {
        whereCondition.discount_price = { [Op.between]: [minPrice, maxPrice] };
      }
      if (search) whereCondition.name = { [Op.like]: `%${search}%` };
      if (brandId) whereCondition.brand_id = brandId;
      if (categoryId) whereCondition.category_id = categoryId;
    }

    const { count, rows } = await db.products.findAndCountAll({
      where: whereCondition,
      offset: offset ? +offset : 0,
      limit: limit ? +limit : 10,
      include: [
        {
          model: db.product_images,
          as: "product_images",
          where: { is_thumbnail: 1 },
          required: false,
        },
        { model: db.brands, as: "brand", attributes: ["id", "name"] },
      ],
      order: sortOptions[sort] || sortOptions["id_desc"],
      distinct: true,
    });

    return {
      EC: 0,
      EM: "OK",
      DT: {
        totalRows: count,
        totalPages: limit ? Math.ceil(count / limit) : 1,
        products: rows.map((r) => formatProductThumbnail(r)),
      },
    };
  } catch (e) {
    console.error(">>> Service Filter Error:", e);
    return { EC: -1, EM: "Lỗi service filter", DT: "" };
  }
};

const getTopSaleProducts = async () => {
  try {
    const products = await db.products.findAll({
      attributes: [
        "id",
        "name",
        "slug",
        "regular_price",
        "discount_price",
        [
          db.sequelize.literal(
            "ROUND(((regular_price - discount_price) / regular_price) * 100)",
          ),
          "discountPercent",
        ],
      ],
      where: {
        discount_price: { [Op.lt]: db.sequelize.col("regular_price") },
        regular_price: { [Op.gt]: 0 },
      },
      include: [
        {
          model: db.product_images,
          as: "product_images",
          where: { is_thumbnail: 1 },
          required: false,
        },
      ],
      order: [
        [
          db.sequelize.literal(
            "((regular_price - discount_price) / regular_price)",
          ),
          "DESC",
        ],
      ],
      limit: 20,
    });
    return {
      EC: 0,
      EM: "OK",
      DT: products.map((p) => formatProductThumbnail(p)),
    };
  } catch (e) {
    console.error(">>> Service TopSale Error:", e);
    return { EC: -1, EM: "Lỗi service top sale", DT: [] };
  }
};

const getTopSellingProducts = async () => {
  try {
    const products = await db.products.findAll({
      attributes: [
        "id",
        "name",
        "slug",
        "regular_price",
        "discount_price",
        // Tính tổng số lượng đã bán từ bảng order_products
        [
          db.sequelize.fn("SUM", db.sequelize.col("order_products.quantity")),
          "totalSold",
        ],
      ],
      include: [
        {
          model: db.order_products,
          as: "order_products", // Phải khớp với alias trong initModels.js
          attributes: [], // Không lấy các cột của bảng order_products
          required: false,
        },
        {
          model: db.product_images,
          as: "product_images",
          where: { is_thumbnail: 1 },
          required: false,
          attributes: ["url"],
        },
      ],
      group: ["products.id"], // Nhóm theo ID sản phẩm để tính tổng
      order: [[db.sequelize.literal("totalSold"), "DESC"]], // Sắp xếp theo số lượng bán giảm dần
      limit: 20,
      subQuery: false, // Quan trọng khi dùng Group By với Limit và Include
    });

    return {
      EC: 0,
      EM: "OK",
      DT: products.map((p) => formatProductThumbnail(p)),
    };
  } catch (e) {
    console.error(">>> Error Selling Service (from order_products):", e);
    return { EC: -1, EM: "Lỗi truy vấn sản phẩm bán chạy", DT: [] };
  }
};

// backend/src/services/productService.js
const getProductBySlug = async (productSlug) => {
  try {
    const product = await db.products.findOne({
      where: {
        slug: productSlug,
        status: "active", // Đảm bảo chỉ lấy sản phẩm đang kinh doanh
      },
      include: [
        {
          model: db.product_images,
          as: "product_images",
          attributes: ["url"],
        },
        {
          model: db.brands,
          as: "brand",
          attributes: ["name"],
        },
      ],
    });

    if (!product) {
      return { EC: 404, EM: "Sản phẩm không tồn tại", DT: null };
    }

    return { EC: 0, EM: "OK", DT: product };
  } catch (e) {
    console.error(">>> Error getProductBySlug:", e);
    return { EC: -1, EM: "Lỗi Server", DT: null };
  }
};

const createNewProduct = async (data) => {
  try {
    // 1. Kiểm tra SKU trùng lặp trước khi INSERT
    const checkSku = await db.products.findOne({ where: { sku: data.sku } });
    if (checkSku) {
      return { EC: 1, EM: "Mã SKU này đã tồn tại trên hệ thống!", DT: "" };
    }

    // 2. Tạo sản phẩm
    const product = await db.products.create({
      category_id: data.category_id || null,
      brand_id: data.brand_id || null,
      sku: data.sku,
      name: data.name,
      slug: data.slug || slugify(data.name, { lower: true }),
      regular_price: parseFloat(data.regular_price) || 0,
      discount_price: parseFloat(data.discount_price) || 0,
      quantity: parseInt(data.quantity) || 0,
      status: data.status || "active",
    });

    return { EC: 0, EM: "Tạo sản phẩm thành công", DT: product };
  } catch (error) {
    console.log(">>> Service Error:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};

const deleteProduct = async (id) => {
  try {
    await db.products.destroy({ where: { id } });
    return { EC: 0, EM: "Delete success", DT: "" };
  } catch (e) {
    return { EC: -1, EM: "Lỗi service delete", DT: "" };
  }
};

const updateProduct = async (id, data) => {
  try {
    await db.products.update({ ...data }, { where: { id } });
    return { EC: 0, EM: "Update success", DT: "" };
  } catch (e) {
    return { EC: -1, EM: "Lỗi service update", DT: "" };
  }
};

// 1. Lấy danh sách cho Admin (Tối ưu hóa)
const getProductsForAdmin = async (params) => {
  try {
    const page = +params.page || 1;
    const limit = +params.limit || 10;
    const offset = (page - 1) * limit;
    const { search, brandId, categoryId, sort } = params;

    // Map key từ Frontend vào đúng cột Database
    const sortOptions = {
      price_asc: [["discount_price", "ASC"]],
      price_desc: [["discount_price", "DESC"]],
      id_desc: [["id", "DESC"]],
      id_asc: [["id", "ASC"]],

      stock_asc: [["quantity", "ASC"]],
      stock_desc: [["quantity", "DESC"]],

      // top_selling: [
      //   [
      //     Sequelize.literal(
      //       `(SELECT COALESCE(SUM(op.quantity), 0)
      //     FROM order_products AS op
      //     WHERE op.product_id = products.id)`,
      //     ),
      //     "DESC",
      //   ],
      // ],
    };

    let whereCondition = {};
    if (search) whereCondition.name = { [Op.like]: `%${search}%` };
    if (brandId) whereCondition.brand_id = brandId;
    if (categoryId) whereCondition.category_id = categoryId;

    const { count, rows } = await db.products.findAndCountAll({
      where: whereCondition,
      offset: offset,
      limit: limit,
      subQuery: false,
      include: [
        {
          model: db.product_images,
          as: "product_images",
          where: { is_thumbnail: 1 },
          required: false,
          attributes: ["url"],
        },
        { model: db.brands, as: "brand", attributes: ["name"] },
      ],
      order: sortOptions[sort], // Thực hiện sắp xếp ở đây
      distinct: true,
    });

    return {
      EC: 0,
      EM: "OK",
      DT: {
        totalRows: count,
        totalPages: Math.ceil(count / limit),
        products: rows.map((item) => formatProductThumbnail(item)),
      },
    };
  } catch (error) {
    console.error(">>> Service Error:", error);
    return { EC: -1, EM: "Lỗi Server", DT: "" };
  }
};
// 2. Lấy chi tiết sản phẩm (Dùng khi nhấn nút "Sửa")
const getProductDetailById = async (id) => {
  try {
    const product = await db.products.findOne({
      where: { id: id },
      include: [
        { model: db.product_images, as: "product_images" }, // Để fill danh sách URL ảnh
        { model: db.brands, as: "brand", attributes: ["id", "name"] },
        { model: db.categories, as: "category", attributes: ["id", "name"] },
      ],
    });
    if (!product) return { EC: 404, EM: "Không tìm thấy sản phẩm", DT: null };
    return { EC: 0, EM: "Lấy chi tiết thành công", DT: product };
  } catch (error) {
    return { EC: -1, EM: "Lỗi Server", DT: null };
  }
};

export {
  getProductsWithFilter,
  getTopSaleProducts,
  getTopSellingProducts,
  getProductsForAdmin,
  getProductBySlug,
  createNewProduct,
  deleteProduct,
  updateProduct,
  getProductDetailById,
};
