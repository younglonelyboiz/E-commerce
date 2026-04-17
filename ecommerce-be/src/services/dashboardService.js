import db from "../models/index.js";
import { Op, Sequelize } from "sequelize";

export const getDashboardDataService = async () => {
  try {
    const Order = db.orders || db.Order;
    const User = db.users || db.User;
    const Product = db.products || db.Product;
    const OrderProduct = db.order_products || db.OrderProduct;
    const Category = db.categories || db.Category;
    const Brand = db.brands || db.Brand;
    const ProductImage = db.product_images || db.ProductImage;

    // Lấy mốc thời gian: Mùng 1 của 11 tháng trước (để lấy đủ 12 tháng gần nhất bao gồm tháng hiện tại)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // ==============================================================
    // 1. HÀNG 1: METRIC CARDS (Tổng quan nhanh)
    // ==============================================================
    const [totalRevenue12Months, totalOrders, totalCustomers, lowStockCount] =
      await Promise.all([
        Order.sum("grand_total", {
          where: {
            payment_status: "paid",
            order_date: { [Op.gte]: twelveMonthsAgo },
          },
        }),
        Order.count(),
        User.count(),
        Product.count({
          where: { quantity: { [Op.lt]: 5 }, status: "active" },
        }),
      ]);

    // ==============================================================
    // 2. HÀNG 2: CHARTS (Biểu đồ)
    // ==============================================================
    // [Trái] Column Chart: Doanh thu 12 tháng gần nhất
    const revenueByMonthRaw = await Order.findAll({
      attributes: [
        [Sequelize.fn("YEAR", Sequelize.col("order_date")), "year"],
        [Sequelize.fn("MONTH", Sequelize.col("order_date")), "month"],
        [Sequelize.fn("SUM", Sequelize.col("grand_total")), "revenue"],
      ],
      where: {
        payment_status: "paid",
        order_date: { [Op.gte]: twelveMonthsAgo },
      },
      group: [
        Sequelize.fn("YEAR", Sequelize.col("order_date")),
        Sequelize.fn("MONTH", Sequelize.col("order_date")),
      ],
      order: [
        [Sequelize.fn("YEAR", Sequelize.col("order_date")), "ASC"],
        [Sequelize.fn("MONTH", Sequelize.col("order_date")), "ASC"],
      ],
      raw: true,
    });

    const revenueByMonth = revenueByMonthRaw.map((item) => ({
      month: `T${item.month}/${item.year}`,
      revenue: Number(item.revenue) || 0,
    }));

    // Xác định ID các đơn hàng đã thanh toán để dùng cho các truy vấn dưới
    const paidOrders = await Order.findAll({
      attributes: ["id"],
      where: { payment_status: "paid" },
      raw: true,
    });
    const paidOrderIds = paidOrders.map((o) => o.id);

    // [Phải] Pie Chart: Tỉ trọng doanh thu theo Danh mục
    let revenueByCategory = [];
    if (paidOrderIds.length > 0) {
      const revenueByCategoryRaw = await OrderProduct.findAll({
        attributes: [
          "product_id",
          [Sequelize.fn("SUM", Sequelize.col("subtotal")), "total_revenue"],
        ],
        where: { order_id: { [Op.in]: paidOrderIds } },
        group: ["product_id"],
        raw: true,
      });

      const categoryRevenueMap = {};
      await Promise.all(
        revenueByCategoryRaw.map(async (item) => {
          const product = await Product.findByPk(item.product_id, {
            attributes: ["category_id"],
            raw: true,
          });
          if (product && product.category_id) {
            if (!categoryRevenueMap[product.category_id])
              categoryRevenueMap[product.category_id] = 0;
            categoryRevenueMap[product.category_id] +=
              Number(item.total_revenue) || 0;
          }
        }),
      );

      for (const [catId, rev] of Object.entries(categoryRevenueMap)) {
        const category = await Category.findByPk(catId, {
          attributes: ["name"],
          raw: true,
        });
        revenueByCategory.push({
          name: category ? category.name : "Khác",
          value: rev,
        });
      }
    }

    // ==============================================================
    // 3. HÀNG 3: DANH SÁCH (Lists & Tables)
    // ==============================================================
    // [Trái] Rank List: Top 10 Sản phẩm bán chạy nhất
    let topSellingProducts = [];
    if (paidOrderIds.length > 0) {
      const rawTopProducts = await OrderProduct.findAll({
        attributes: [
          "product_id",
          [Sequelize.fn("SUM", Sequelize.col("quantity")), "total_sold"],
        ],
        where: { order_id: { [Op.in]: paidOrderIds } },
        group: ["product_id"],
        order: [[Sequelize.fn("SUM", Sequelize.col("quantity")), "DESC"]],
        limit: 10,
        raw: true,
      });

      topSellingProducts = await Promise.all(
        rawTopProducts.map(async (item) => {
          const p = await Product.findByPk(item.product_id, {
            attributes: ["id", "name", "sku"],
            raw: true,
          });
          let image = null;
          if (p) {
            // Ưu tiên lấy ảnh thumbnail, nếu không có thì lấy ảnh đầu tiên của sản phẩm
            const img =
              (await ProductImage.findOne({
                where: { product_id: p.id, is_thumbnail: 1 },
                raw: true,
              })) ||
              (await ProductImage.findOne({
                where: { product_id: p.id },
                raw: true,
              }));
            if (img) image = img.url;
          }
          return {
            id: item.product_id,
            name: p ? p.name : "Sản phẩm đã xóa",
            sku: p ? p.sku : "N/A",
            total_sold: Number(item.total_sold) || 0,
            image: image,
          };
        }),
      );
    }

    // [Phải] Alert Table: Danh sách SP có tồn kho thấp
    const rawLowStock = await Product.findAll({
      attributes: ["id", "name", "sku", "quantity", "brand_id"],
      where: { quantity: { [Op.lt]: 5 } },
      order: [["quantity", "ASC"]],
      limit: 10,
      raw: true,
    });

    const lowStockProducts = await Promise.all(
      rawLowStock.map(async (p) => {
        const b = await Brand.findByPk(p.brand_id, {
          attributes: ["name"],
          raw: true,
        });
        const img =
          (await ProductImage.findOne({
            where: { product_id: p.id, is_thumbnail: 1 },
            raw: true,
          })) ||
          (await ProductImage.findOne({
            where: { product_id: p.id },
            raw: true,
          }));

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          brand_name: b ? b.name : "N/A",
          image: img ? img.url : null,
        };
      }),
    );

    return {
      EC: 0,
      EM: "Lấy dữ liệu Dashboard thành công",
      DT: {
        cards: {
          totalRevenue12Months: totalRevenue12Months || 0,
          totalOrders: totalOrders || 0,
          totalCustomers: totalCustomers || 0,
          lowStockCount: lowStockCount || 0,
        },
        charts: {
          revenueByMonth,
          revenueByCategory,
        },
        lists: {
          topSellingProducts,
          lowStockProducts,
        },
      },
    };
  } catch (error) {
    console.error(">>> [Dashboard Service Error]:", error);
    return {
      EC: -1,
      EM: "Lỗi hệ thống khi lấy dữ liệu Dashboard",
      DT: null,
    };
  }
};
