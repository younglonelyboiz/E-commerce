import React, { useState, useEffect, useContext } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { UserContext } from '../context/UserContext';
import { getAdminDashboardApi } from '../services/dashboardService';
import './AdminDashboard.scss';

// ─── CONSTANTS ───────────────────────────────────────────
const COLORS = ['#1a6fd4', '#17a864', '#d48a09', '#dc3545', '#3d8ef0', '#8e44ad', '#e67e22', '#2980b9'];

// ─── TOOLTIP COMPONENTS ──────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    return (
        <div className="adm-tooltip">
            <div className="adm-tooltip__label">{label}</div>
            <div className="adm-tooltip__value">{fmt(payload[0].value)}</div>
        </div>
    );
};

const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
    return (
        <div className="adm-tooltip">
            <div className="adm-tooltip__name">{payload[0].name}</div>
            <div className="adm-tooltip__value adm-tooltip__value--green">{fmt(payload[0].value)}</div>
        </div>
    );
};

// ─── RANK BADGE ──────────────────────────────────────────
const RankBadge = ({ index }) => {
    const cls = index === 0 ? 'adm-rank--1' : index === 1 ? 'adm-rank--2' : index === 2 ? 'adm-rank--3' : '';
    return <span className={`adm-rank ${cls}`} style={{ fontWeight: 700 }}>#{index + 1}</span>;
};

// ─── METRIC CARD ─────────────────────────────────────────
const MetricCard = ({ label, value, icon, variant, sub }) => (
    <div className="adm-card">
        <div className={`adm-metric adm-metric--${variant}`}>
            <div className="adm-metric__strip" />
            <div className="adm-metric__inner">
                <div className="adm-metric__icon-wrap">
                    <i className={`bi ${icon}`} />
                </div>
                <div className="adm-metric__label" style={{ fontWeight: 500 }}>{label}</div>
                <div className="adm-metric__value" style={{ fontWeight: 800 }}>{value}</div>
                <div className="adm-metric__sub" style={{ fontWeight: 400 }}>{sub}</div>
                <div className="adm-metric__orb" />
            </div>
        </div>
    </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────
const AdminDashboard = () => {
    const { user } = useContext(UserContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await getAdminDashboardApi();
            if (res?.EC === 0) setData(res.DT);
        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.isLoading === false && user.auth === true && user.roles?.includes('ADMIN')) {
            fetchDashboardData();
        }
    }, [user.isLoading, user.auth]);

    if (user.isLoading) return (
        <div className="adm-center">
            <div className="adm-spinner" />
            <span style={{ fontWeight: 500 }}>Đang kiểm tra quyền truy cập…</span>
        </div>
    );

    if (!user.auth || !user.roles?.includes('ADMIN')) return (
        <div className="adm-center">
            <div className="adm-error-box">
                <div className="adm-error-box__icon">⛔</div>
                <div className="adm-error-box__title" style={{ fontWeight: 800 }}>Truy cập bị từ chối</div>
                <div className="adm-error-box__desc">Bạn không có quyền quản trị để truy cập tài nguyên này.</div>
                <button className="adm-error-box__btn" onClick={() => window.location.href = '/'}>
                    Quay lại trang chủ
                </button>
            </div>
        </div>
    );

    if (loading) return (
        <div className="adm-center"><div className="adm-spinner" /></div>
    );

    if (!data) return (
        <div className="adm-center">Không thể tải dữ liệu Dashboard.</div>
    );

    const { cards, charts, lists } = data;

    return (
        <div className="adm">

            {/* ── HEADER ─────────────────────────────────── */}
            <div className="adm-header">
                <div className="adm-header__top">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="adm-live" style={{ fontWeight: 600 }}>
                                <span className="adm-live__dot" />
                                Live
                            </span>
                            <button
                                className="adm-btn-refresh"
                                onClick={fetchDashboardData}
                                disabled={loading}
                                style={{ fontWeight: 600 }}
                            >
                                <i className="bi bi-arrow-clockwise" />
                                Cập nhật
                            </button>
                        </div>
                        <h1 className="adm-header__title">Tổng quan hệ thống</h1>
                        <p className="adm-header__sub">Dashboard quản trị · Dữ liệu cập nhật theo thời gian thực</p>
                    </div>
                    <div className="adm-header__date" style={{ fontWeight: 500 }}>
                        <i className="bi bi-calendar3" style={{ marginRight: 8 }} />
                        {new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </div>
                </div>
            </div>

            {/* ── ROW 1: METRIC CARDS ────────────────────── */}
            <div className="adm-grid adm-grid--4 adm-section">
                <MetricCard
                    label="Doanh thu 12 tháng"
                    value={fmt(cards.totalRevenue12Months)}
                    icon="bi-currency-exchange"
                    variant="blue"
                    sub="Tổng doanh thu năm qua"
                />
                <MetricCard
                    label="Tổng đơn hàng"
                    value={cards.totalOrders}
                    icon="bi-cart-check-fill"
                    variant="green"
                    sub="Tất cả đơn đã ghi nhận"
                />
                <MetricCard
                    label="Tổng khách hàng"
                    value={cards.totalCustomers}
                    icon="bi-people-fill"
                    variant="amber"
                    sub="Tài khoản đã đăng ký"
                />
                <MetricCard
                    label="Sản phẩm sắp hết"
                    value={cards.lowStockCount}
                    icon="bi-exclamation-triangle-fill"
                    variant="red"
                    sub="Cần nhập thêm hàng"
                />
            </div>

            {/* ── ROW 2: CHARTS ──────────────────────────── */}
            <div className="adm-grid adm-grid--3-1 adm-section">

                {/* Bar chart */}
                <div className="adm-card">
                    <div className="adm-card__head">
                        <span className="adm-card__title" style={{ fontWeight: 700 }}>
                            <i className="bi bi-graph-up-arrow" style={{ color: '#1a6fd4' }} /> Doanh thu 12 tháng gần nhất
                        </span>
                    </div>
                    <div className="adm-card__body" style={{ height: 310 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={charts.revenueByMonth}
                                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3d8ef0" />
                                        <stop offset="100%" stopColor="#a8cef8" stopOpacity={0.5} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#dce8f7"
                                />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#a0b4ce', fontSize: 11, fontWeight: 500 }}
                                />
                                <YAxis
                                    tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#a0b4ce', fontSize: 11, fontWeight: 500 }}
                                    width={42}
                                />
                                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(26,111,212,.05)' }} />
                                <Bar dataKey="revenue" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie chart */}
                <div className="adm-card">
                    <div className="adm-card__head">
                        <span className="adm-card__title" style={{ fontWeight: 700 }}>
                            <i className="bi bi-pie-chart-fill" style={{ color: '#17a864' }} /> Tỉ trọng danh mục
                        </span>
                    </div>
                    <div className="adm-card__body" style={{ height: 310 }}>
                        {charts.revenueByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.revenueByCategory}
                                        cx="50%" cy="44%"
                                        innerRadius={58} outerRadius={92}
                                        paddingAngle={3}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {charts.revenueByCategory.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="adm-no-data" style={{ fontWeight: 500 }}>Chưa có dữ liệu</div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── ROW 3: TABLES ──────────────────────────── */}
            <div className="adm-grid adm-grid--2">

                {/* Top selling products */}
                <div className="adm-card">
                    <div className="adm-card__head">
                        <span className="adm-card__title" style={{ fontWeight: 700 }}>
                            <i className="bi bi-trophy-fill" style={{ color: '#d48a09' }} /> Top 10 sản phẩm bán chạy
                        </span>
                    </div>
                    <hr className="adm-divider" />
                    <div style={{ overflowX: 'auto' }}>
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th style={{ fontWeight: 600 }}>Hạng</th>
                                    <th style={{ fontWeight: 600 }}>Sản phẩm</th>
                                    <th style={{ textAlign: 'right', fontWeight: 600 }}>Đã bán</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lists.topSellingProducts.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td><RankBadge index={idx} /></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img
                                                    src={item.image || 'https://via.placeholder.com/40'}
                                                    alt={item.name}
                                                    className="adm-product-img"
                                                />
                                                <div>
                                                    <div className="adm-product-name" style={{ fontWeight: 600 }}>{item.name}</div>
                                                    <div className="adm-sku" style={{ fontWeight: 400 }}>{item.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className="adm-sold" style={{ fontWeight: 700 }}>{item.total_sold}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low stock products */}
                <div className="adm-card">
                    <div className="adm-card__head">
                        <span className="adm-card__title" style={{ color: '#dc3545', fontWeight: 700 }}>
                            <i className="bi bi-exclamation-octagon-fill" /> Cảnh báo hết hàng
                        </span>
                    </div>
                    <hr className="adm-divider" />
                    <div style={{ overflowX: 'auto' }}>
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th style={{ fontWeight: 600 }}>Sản phẩm</th>
                                    <th style={{ fontWeight: 600 }}>Thương hiệu</th>
                                    <th style={{ textAlign: 'right', fontWeight: 600 }}>Tồn kho</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lists.lowStockProducts.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img
                                                    src={item.image || 'https://via.placeholder.com/40'}
                                                    alt={item.name}
                                                    className="adm-product-img"
                                                />
                                                <div>
                                                    <div className="adm-product-name" style={{ fontWeight: 600 }}>{item.name}</div>
                                                    <div className="adm-sku" style={{ fontWeight: 400 }}>{item.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="adm-brand" style={{ fontWeight: 500 }}>{item.brand_name}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className="adm-stock-badge" style={{ fontWeight: 700 }}>{item.quantity}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;