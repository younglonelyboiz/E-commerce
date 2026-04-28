import React, { useEffect, useState } from 'react';
import { fetchAllUserByAdmin } from '../services/userService';
import ReactPaginate from 'react-paginate';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import ModalRole from '../components/ModalRole';

const AdminUsers = () => {
    const navigate = useNavigate(); // 2. Khởi tạo navigate
    const [listUsers, setListUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);  // ← Thêm dòng này
    const limit = 10;

    const [searchInput, setSearchInput] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("DESC");

    useEffect(() => {
        fetchData();
    }, [currentPage, sortBy, sortOrder]);

    const fetchData = async () => {
        try {
            setLoading(true);  // ← Thêm
            let res = await fetchAllUserByAdmin(currentPage, limit, searchInput, sortBy, sortOrder);
            if (res && res.EC === 0) {
                setListUsers(res.DT.users);
                setTotalPages(res.DT.totalPages);
            }
        } finally {
            setLoading(false);  // ← Thêm
        }
    };

    // 3. Hàm xử lý chuyển hướng
    const handleViewDetail = (userId) => {
        navigate(`/admin/user/${userId}`);
    };

    const handlePageClick = (event) => {
        setCurrentPage(+event.selected + 1);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchData();
    };

    // sửa role
    const [showModalRole, setShowModalRole] = useState(false);
    const [dataModal, setDataModal] = useState({});

    const handleEditRole = (user) => {
        const roles = user.roles?.map(r => ({
            ...r,
            id: Number(r.id)
        })) || [];

        setDataModal({
            ...user,
            roles
        });

        setShowModalRole(true);
    };

    return (
        <div className="container mt-5">
            <div className="card shadow border-0">
                <div className="card-header bg-primary text-white py-3">
                    <h5 className="mb-0">Quản lý Người dùng & Phân quyền</h5>
                </div>

                <div className="card-body bg-light border-bottom">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="small fw-bold">Tìm Tên / Email</label>
                            <div className="input-group input-group-sm">
                                <input type="text" className="form-control" placeholder="Nhập từ khóa..."
                                    value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button className="btn btn-primary" onClick={handleSearch}>Tìm</button>
                            </div>
                        </div>

                        <div className="col-md-3">
                            <label className="small fw-bold">Sắp xếp theo</label>
                            <select className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="id">Mới nhất (Mặc định)</option>
                                <option value="role">Vai trò (Role)</option>
                                <option value="totalSpent">Số tiền đã chi</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="small fw-bold">Thứ tự</label>
                            <select className="form-select form-select-sm" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="DESC">Giảm dần ↓</option>
                                <option value="ASC">Tăng dần ↑</option>
                            </select>
                        </div>

                        <div className="col-md-2 d-flex align-items-end">
                            <button className="btn btn-sm btn-outline-secondary w-100" onClick={() => {
                                setSearchInput(""); setSortBy("id"); setSortOrder("DESC"); setCurrentPage(1);
                            }}>Làm mới</button>
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Tên người dùng</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Tổng chi</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-2 small">Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : listUsers.length > 0 ? listUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td
                                        className="fw-bold text-primary"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleViewDetail(user.id)}
                                    >
                                        {user.user_name}
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map((role, index) => {
                                                let badgeClass = "bg-info";
                                                if (role.name === 'Quản trị viên') badgeClass = "bg-danger";
                                                if (role.name === 'Nhân viên') badgeClass = "bg-warning text-dark";
                                                if (role.name === 'Người dùng ') badgeClass = "";

                                                return (
                                                    <span key={`role-${user.id}-${index}`} className={`badge me-1 ${badgeClass}`}>
                                                        {role.name}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="badge me-1 bg-info">Người dùng</span>
                                        )}
                                    </td>
                                    <td className="text-success fw-bold">
                                        {Number(user.totalSpent).toLocaleString('vi-VN')}đ
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() => handleViewDetail(user.id)}
                                        >
                                            <i className="bi bi-eye"></i> Chi tiết
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-warning"
                                            onClick={() => handleEditRole(user)}
                                        >
                                            Sửa Role
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="text-center py-4 text-muted">Không tìm thấy dữ liệu phù hợp</td></tr>
                            )}
                        </tbody>
                    </table>

                    <div className="d-flex justify-content-center mt-4">
                        <ReactPaginate
                            nextLabel=">"
                            onPageChange={handlePageClick}
                            pageCount={totalPages}
                            previousLabel="<"
                            pageClassName="page-item"
                            pageLinkClassName="page-link"
                            previousClassName="page-item"
                            previousLinkClassName="page-link"
                            nextClassName="page-item"
                            nextLinkClassName="page-link"
                            containerClassName="pagination pagination-sm"
                            activeClassName="active"
                        />
                    </div>
                </div>
            </div>
            <ModalRole
                show={showModalRole}
                setShow={setShowModalRole}
                dataModal={dataModal}
                fetchData={fetchData} // Truyền hàm này để modal gọi lại sau khi lưu xong
            />
        </div>
    );
};

export default AdminUsers;