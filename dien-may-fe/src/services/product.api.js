import axios from "../setUp/axios";

export const getTopSaleProducts = () => {
  return axios.get("/top-sale");
};

export const getTopSellingProducts = () => {
  return axios.get("/top-selling");
};

// Hàm cũ lấy theo ID (giữ lại nếu cần cho Admin panel)
export const getProductDetail = (id) => {
  return axios.get(`/products/${id}`);
};

export const getSearchSuggestionsApi = (search) => {
  return axios.get("/products/suggestions", { params: { search } });
};

/**
 * Lấy chi tiết sản phẩm theo SLUG
 * Dùng cho trang chi tiết người dùng để có URL đẹp
 */
export const getProductBySlug = (slug) => {
  return axios.get("/products", {
    params: { slug, limit: 1 },
  });
};

export const getProducts = (params) => {
  return axios.get("/products", { params });
};

export const getProductsByAdmin = (params) => {
  return axios.get("/admin/products", { params });
};
export const getProductDetailById = (id) => {
  return axios.get(`/products/${id}`); //
};

// Tạo mới sản phẩm (Khớp với router.post("/create-product"))
export const createProductApi = (data) => {
  return axios.post("/create-product", data); //
};

// Xóa sản phẩm (Khớp với router.delete("/delete-product/:id"))
export const deleteProductApi = (id) => {
  return axios.delete(`/delete-product/${id}`); //
};

// Cập nhật sản phẩm (Khớp với router.put("/update-product/:id"))
export const updateProductApi = (id, data) => {
  return axios.put(`/update-product/${id}`, data); //
};
