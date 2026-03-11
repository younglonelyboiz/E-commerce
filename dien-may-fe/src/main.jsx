import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.jsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from "./context/UserContext.jsx"; // Nhập kho dữ liệu

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* UserProvider phải nằm ngoài cùng để Router có thể lấy được dữ liệu */}
    <UserProvider>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} />
    </UserProvider>
  </React.StrictMode>
);