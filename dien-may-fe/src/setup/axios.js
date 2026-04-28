import axios from "axios";
import { toast } from "react-toastify";

// inertceptors
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

instance.defaults.withCredentials = true;

// Replace AUTH_TOKEN with a valid token or define it above
// const AUTH_TOKEN = "your-valid-token-here";
// instance.defaults.headers.post["Authorization"] = AUTH_TOKEN;

// instance.interceptors.request.use(
//   (config) =>
//     new Promise((resolve, reject) => {
//       const token = localStorage.getItem("accessToken");
//       if (token) {
//         config.headers.Authorization = `bearer ${token}`;
//       }
//       resolve(config);
//     }),
//   (error) => {
//     return Promise.reject(error);
//   },
// );

instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data;

    if (status === 401 && data?.EC) {
      switch (data.EC) {
        case -1:
          // Chưa login → KHÔNG spam toast
          console.log("Chưa đăng nhập");
          break;

        case -2:
          toast.error("Phiên đăng nhập đã hết hạn");
          localStorage.clear();
          window.location.href = "/login";
          break;

        case -3:
          toast.error("Token không hợp lệ");
          localStorage.clear();
          window.location.href = "/login";
          break;

        default:
          toast.error("Lỗi xác thực");
      }
    } else {
      switch (status) {
        case 403:
          console.error(
            "Forbidden error:",
            error.response?.data || error.message,
          );
          toast.error("Bạn không có quyền thực hiện chức năng này.");
          break;
        case 404:
          toast.error("Không tìm thấy dữ liệu yêu cầu.");
          break;
        case 500:
          console.error(
            "Backend 500 error:",
            error.response?.data || error.message,
          ); // Log error details for debugging
          toast.error("Hệ thống đang khởi động ");
          break;
        default:
          toast.error("Đã có lỗi xảy ra.");
      }
    }

    return Promise.reject(error);
  },
);

export default instance;
