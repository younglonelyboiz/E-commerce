import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Cart from "../pages/Cart";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProductDetail from "../pages/ProductDetail";
import CategoryPage from "../pages/CategoryPage";
// Import các trang Admin
import AdminLayout from "../layouts/AdminLayout"; // Bạn cần tạo layout này
import AdminProduct from "../pages/AdminProduct";
// import AdminDashboard from "../pages/AdminDashboard";
import App from "../App";

export const router = createBrowserRouter([
    // NHÁNH CLIENT (Người dùng mua hàng)
    {
        path: "/",
        element: <App />,
        children: [
            { index: true, element: <Home /> },
            { path: "product/:slug", element: <ProductDetail /> },
            { path: "cart", element: <Cart /> },
            { path: "login", element: <Login /> },
            { path: "register", element: <Register /> },
            { path: "category/:categoryId", element: <CategoryPage /> }
        ]
    },
    // NHÁNH ADMIN (Quản lý hệ thống)
    {
        path: "/admin",
        element: <AdminLayout />, // Layout riêng có Sidebar cho Admin
        children: [
            // {
            //     index: true, // Đường dẫn /admin
            //     element: <AdminDashboard />,
            // },
            {
                path: "products", // Đường dẫn /admin/products
                element: <AdminProduct />,
            },
            // Bạn có thể thêm các trang đơn hàng, khách hàng ở đây
        ]
    }
]);