import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useContext, useEffect } from "react";
import { UserContext } from "./context/UserContext";
import { getUserAccount } from "./services/userService";
import OrderHistory from './pages/OrderHistory';
import CustomerChat from "./components/CustomerChat";

function App() {
  // Lấy thêm setUser để tắt trạng thái loading khi API xong
  const { loginContext, setUser } = useContext(UserContext);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        // 1. Gọi đúng hàm getUserAccount
        let res = await getUserAccount();

        if (res && +res.EC === 0) {
          // 2. Nếu có phiên (Cookie hợp lệ), nạp vào Context
          console.log(">>> res.DT:", res.DT);
          loginContext(res.DT);
        } else {
          // 3. Nếu không có phiên, tắt Loading để các Route khác hiển thị
          setUser(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error(">>> Fetch Account Error:", error);
        setUser(prev => ({ ...prev, isLoading: false }));
      }
    }
    fetchAccount();
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Header />
      {/* Nội dung các trang sẽ thay đổi ở đây */}
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
      <CustomerChat />
    </div>
  );
}

export default App;