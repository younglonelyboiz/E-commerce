# Brainstorming & Design Document: Landing Page

## 1. Understanding Summary
*   **Cái gì đang được xây dựng:** Một trang Landing Page (`LandingPage.jsx`) mới hoàn toàn, hoạt động độc lập với trang chủ.
*   **Lý do tồn tại:** Giới thiệu độ uy tín và chất lượng của website thông qua việc trưng bày 1 "Sản phẩm tiêu biểu" (Hero Product) bằng hiệu ứng tương tác cao cấp.
*   **Dành cho ai:** Khách hàng mới từ các chiến dịch quảng cáo (Ads) hoặc truy cập trực tiếp.
*   **Mục tiêu chính (CTA):** Dẫn dắt người dùng bấm nút "Khám phá toàn bộ cửa hàng" để chuyển hướng về trang chủ (`/`).
*   **Ràng buộc chính:** Tối ưu hóa cho thiết bị di động (Mobile-first), trải nghiệm cuộn chuột mượt mà (smooth scroll).
*   **Mục tiêu không làm (Explicit non-goals):** Không làm chức năng giỏ hàng, thanh toán hay gọi API phức tạp; không có chức năng đăng ký thành viên trên trang này.

## 2. Assumptions (Giả định)
*   **Hiệu suất:** Trang tải cực nhanh. Dữ liệu (ảnh, text) của sản phẩm tiêu biểu sẽ được **khai báo cứng (hardcode)** thay vì gọi API để đảm bảo tốc độ và độ mượt của animation.
*   **Bảo trì:** Không cần trang admin riêng để quản lý nội dung của Landing Page này ngay lập tức.
*   **Hình ảnh:** Cần hình ảnh sản phẩm đã bóc tách nền (PNG/WebP) chất lượng tốt.

## 3. Decision Log
| Quyết định | Các lựa chọn đã cân nhắc | Lý do chọn |
| :--- | :--- | :--- |
| **Mục tiêu của Landing Page** | Tập trung bán 1 sản phẩm vs. Điều hướng về trang chủ | Chọn **Điều hướng về trang chủ** để Landing Page đóng vai trò như một phễu giới thiệu chung, khoe sự đẳng cấp của web. |
| **Phong cách Thiết kế & Animation** | 1. Apple-Style Scroll Storytelling (Framer Motion)<br>2. Section-by-Section Fade-in (CSS thuần) | Chọn **Apple-Style** để tạo hiệu ứng thị giác mạnh (wow-effect), mang lại cảm giác premium và giữ chân người dùng. |
| **Nguồn dữ liệu (Data Source)** | API động vs. Hardcode JSON | Chọn **Hardcode** để loại bỏ thời gian tải API, tránh lỗi sập server lúc chạy Ads, giúp scroll animation render mượt nhất. |

## 4. Final Design (Cấu trúc UI & Animation)
Sử dụng thư viện `framer-motion` cho React, trang sẽ có 4 phân cảnh (chiếm 100vh):

1.  **Hero Intro:** Sản phẩm (điện thoại) nằm giữa, nền tối. Headline lớn. Chỉ thị cuộn chuột nhấp nháy.
2.  **Scroll 1 (Tính năng 1):** Điện thoại trượt mượt sang góc trái, xoay trục. Văn bản giới thiệu Camera/Màn hình fade-in ở bên phải.
3.  **Scroll 2 (Tính năng 2):** Nền chuyển màu. Ảnh zoom cận cảnh vào một chi tiết (camera/viền). Văn bản giới thiệu Hiệu năng hiện ra.
4.  **CTA Destination:** Điện thoại thu nhỏ đặt trên bệ đỡ. Nút bấm khổng lồ có hiệu ứng glow: **"Khám phá gian hàng & Mua ngay"** -> Chuyển hướng về `/` (Home).
