import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Cart from "../pages/Cart";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProductDetail from "../pages/ProductDetail";
import CategoryPage from "../pages/CategoryPage";
import CheckoutPage from "../pages/CheckoutPage";
import OrderHistory from '../pages/OrderHistory';
import Profile from "../pages/Profile"
import SearchPage from "../pages/SearchPage";
// Import các trang Admin
import AdminLayout from "../layouts/AdminLayout"; // Bạn cần tạo layout này
import AdminDashboard from "../pages/AdminDashboard"; // Thêm dòng này
import AdminProduct from "../pages/AdminProduct";
import AdminUsers from "../pages/AdminUsers";
import AdminOrders from "../pages/AdminOrders";
import AdminReviews from "../pages/AdminReviews"; // Import trang quản lý review
import AdminChat from "../pages/AdminChat"; // Import trang Chat cho Admin
import UserDetail from "../pages/UserDetail";
import App from "../App";
import AdminRoute from "../routes/AdminRoute";

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
            { path: "category/:categoryId", element: <CategoryPage /> },
            { path: "checkout", element: <CheckoutPage /> },
            { path: "order-history", element: <OrderHistory /> },
            { path: "profile", element: <Profile /> },
            { path: "search", element: <SearchPage /> }
        ]
    },
    // NHÁNH ADMIN (Quản lý hệ thống)
    {
        path: "/admin",
        // BỌC ADMIN LAYOUT Ở ĐÂY
        element: (
            <AdminRoute>
                <AdminLayout />
            </AdminRoute>
        ),
        children: [
            {
                index: true, // Khi truy cập "/admin" sẽ tự động load trang Dashboard này
                element: <AdminDashboard />
            },
            {
                path: "dashboard", // Khi truy cập "/admin/dashboard" cũng ra trang này
                element: <AdminDashboard />
            },
            {
                path: "products",
                element: <AdminProduct />,
            },
            {
                path: "users",
                element: <AdminUsers />,
            },
            {
                path: "orders",
                element: <AdminOrders />,
            },
            {
                path: "reviews",
                element: <AdminReviews />,
            },
            {
                path: "chat",
                element: <AdminChat />,
            },
            {
                path: "user/:id",
                element: <UserDetail />
            }
            // Thêm các con của admin vào đây thoải mái
        ]
    }
]);