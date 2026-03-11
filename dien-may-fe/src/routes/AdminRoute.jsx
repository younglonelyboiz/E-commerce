// src/routes/AdminRoute.jsx
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
    const { user } = useContext(UserContext);

    if (user.isLoading) {
        return <div>Đang nạp dữ liệu...</div>;
    }

    if (user && user.auth && user.roles.includes("ADMIN")) {
        return children;
    }

    return <Navigate to="/login" />;
};

// THIẾU DÒNG NÀY:
export default AdminRoute;