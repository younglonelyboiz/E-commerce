import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="container">
                {/* --- PHẦN TRÊN: LIÊN KẾT & THÔNG TIN --- */}
                <div className="row g-4 footer-top">
                    {/* Cột 1: Tổng đài hỗ trợ */}
                    <div className="col-12 col-md-6 col-lg-3">
                        <h5 className="footer-heading">Tổng đài hỗ trợ</h5>
                        <ul className="footer-list">
                            <li>
                                <span>Gọi mua:</span>
                                <a href="tel:18001060" className="hotline">1800.1060</a> (7:30 - 22:00)
                            </li>
                            <li>
                                <span>Kỹ thuật:</span>
                                <a href="tel:18001763" className="hotline">1800.1763</a> (7:30 - 22:00)
                            </li>
                            <li>
                                <span>Khiếu nại:</span>
                                <a href="tel:18001062" className="hotline">1800.1062</a> (8:00 - 21:30)
                            </li>
                            <li>
                                <span>Bảo hành:</span>
                                <a href="tel:18001064" className="hotline">1800.1064</a> (8:00 - 21:00)
                            </li>
                        </ul>
                    </div>

                    {/* Cột 2: Thông tin công ty & Chính sách */}
                    <div className="col-12 col-md-6 col-lg-3">
                        <h5 className="footer-heading">Về công ty</h5>
                        <ul className="footer-list">
                            <li><Link to="/about">Giới thiệu công ty</Link></li>
                            <li><Link to="/recruitment">Tuyển dụng</Link></li>
                            <li><Link to="/contact">Gửi góp ý, khiếu nại</Link></li>
                            <li><Link to="/stores">Tìm siêu thị (3.000 shop)</Link></li>
                            <li><Link to="/policy">Chính sách bảo hành</Link></li>
                        </ul>
                    </div>

                    {/* Cột 3: Thanh toán & Chứng nhận */}
                    <div className="col-12 col-md-6 col-lg-3">
                        <h5 className="footer-heading">Hỗ trợ thanh toán</h5>
                        <div className="payment-icons">
                            <i className="bi bi-credit-card-2-front" title="Visa/Mastercard"></i>
                            <i className="bi bi-cash-coin" title="Tiền mặt"></i>
                            <i className="bi bi-qr-code" title="QR Code"></i>
                            <i className="bi bi-bank" title="Chuyển khoản"></i>
                        </div>

                        <h5 className="footer-heading mt-3">Chứng nhận</h5>
                        <div className="certs">
                            {/* Ảnh minh họa Bộ Công Thương */}
                            <img src="https://cdn.tgdd.vn/mwgcart/mwg-site/ContentMwg/images/logo-bct.png" alt="Đã thông báo bộ công thương" width="130" />
                        </div>
                    </div>

                    {/* Cột 4: Kết nối & Tải App */}
                    <div className="col-12 col-md-6 col-lg-3">
                        <h5 className="footer-heading">Kết nối với chúng tôi</h5>
                        <div className="social-links">
                            <a href="https://www.facebook.com/hoang.uc.243325" target="_blank" rel="noreferrer" className="fb"><i className="bi bi-facebook"></i></a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="yt"><i className="bi bi-youtube"></i></a>
                            <a href="https://zalo.me" target="_blank" rel="noreferrer" className="zl">Zalo</a>
                        </div>

                        <h5 className="footer-heading mt-3">Website cùng tập đoàn</h5>
                        <ul className="footer-list small-text">
                            <li><a href="#">Thế Giới Di Động</a></li>
                            <li><a href="#">Bách Hóa Xanh</a></li>
                            <li><a href="#">Nhà Thuốc An Khang</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- PHẦN DƯỚI: COPYRIGHT --- */}
            <div className="footer-bottom">
                <div className="container text-center">
                    <p className="mb-1"> Code Web Alo Bé Đức</p>
                    <p className="small text-secondary mb-0">
                        Địa chỉ: Ngõ 127, Phố Phùng Khoang, Thành Phố Hà Nội
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;