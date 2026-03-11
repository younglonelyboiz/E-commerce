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
  const t = await db.sequelize.transaction();
  try {
    // 1. Tạo slug ban đầu
    let baseSlug = data.slug || slugify(data.name, { lower: true });
    let finalSlug = baseSlug;

    // 2. Kiểm tra slug đã tồn tại chưa (Vòng lặp để tránh trùng nhiều lần)
    let count = 1;
    while (true) {
      const existing = await db.products.findOne({
        where: { slug: finalSlug },
        transaction: t,
      });
      if (!existing) break;
      finalSlug = `${baseSlug}-${count}`;
      count++;
    }

    // 3. Tạo sản phẩm với finalSlug đã kiểm tra
    const product = await db.products.create(
      {
        sku: data.sku,
        name: data.name,
        slug: finalSlug, // Dùng slug mới nhất
        regular_price: data.regular_price || 0,
        discount_price: data.discount_price || 0,
        quantity: data.quantity || 0,
        status: data.status || "active",
        category_id: data.category_id,
      },
      { transaction: t },
    );

    // 4. Lưu ảnh (Giữ nguyên logic cũ)
    if (data.images && data.images.length > 0) {
      const imageData = data.images
        .filter((url) => url.trim() !== "")
        .map((url, index) => ({
          product_id: product.id,
          url: url,
          is_thumbnail: index === 0 ? 1 : 0,
        }));
      await db.product_images.bulkCreate(imageData, { transaction: t });
    }

    await t.commit();
    return { EC: 0, EM: "Tạo sản phẩm thành công", DT: product };
  } catch (error) {
    await t.rollback();
    console.error(">>> SERVICE ERROR:", error);
    return {
      EC: -1,
      EM:
        error.name === "SequelizeUniqueConstraintError"
          ? "Lỗi: SKU hoặc Slug bị trùng lặp "
          : "Lỗi hệ thống",
      DT: "",
    };
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
  // 1. Khởi tạo Transaction (để rollback nếu một trong hai bảng lỗi)
  const transaction = await db.sequelize.transaction();

  try {
    // 2. Kiểm tra sản phẩm có tồn tại không
    let product = await db.products.findOne({
      where: { id: id },
    });

    if (!product) {
      return {
        EC: 1,
        EM: "Sản phẩm không tồn tại!",
        DT: "",
      };
    }

    // 3. Cập nhật thông tin bảng Product
    await db.products.update(
      {
        name: data.name,
        sku: data.sku,
        regular_price: data.regular_price,
        discount_price: data.discount_price,
        quantity: data.quantity,
        brand_id: data.brand_id,
        category_id: data.category_id,
        // Lấy ảnh đầu tiên làm ảnh đại diện (Thumbnail)
        thumbnailUrl:
          data.images && data.images.length > 0 ? data.images[0] : "",
      },
      {
        where: { id: id },
        transaction,
      },
    );

    // 4. Cập nhật bảng Hình ảnh (ProductImage)
    if (data.images && Array.isArray(data.images)) {
      // A. Xóa toàn bộ ảnh cũ của sản phẩm này
      await db.product_images.destroy({
        where: { product_id: id },
        transaction,
      });

      // B. Lọc các URL hợp lệ và chuẩn bị mảng để Insert
      const imageRecords = data.images
        .filter((url) => url && url.trim() !== "") // Loại bỏ chuỗi rỗng/null
        .map((url, index) => ({
          product_id: id,
          url: url,
          is_thumbnail: index === 0 ? 1 : 0, // Ảnh đầu tiên là thumbnail
        }));

      // C. Bulk insert ảnh mới
      if (imageRecords.length > 0) {
        await db.product_images.bulkCreate(imageRecords, { transaction });
      }
    }

    // 5. Mọi thứ thành công thì Lưu (Commit)
    await transaction.commit();

    return {
      EC: 0,
      EM: "Cập nhật sản phẩm và hình ảnh thành công!",
      DT: "",
    };
  } catch (e) {
    // Nếu có lỗi, Hoàn tác (Rollback) toàn bộ quá trình
    await transaction.rollback();
    console.log(">>> Check error: ", e);
    return {
      EC: -1,
      EM: "Lỗi hệ thống: " + e.message,
      DT: "",
    };
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
        { model: db.categories, as: "category", attributes: ["name"] },
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
