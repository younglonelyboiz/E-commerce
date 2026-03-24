import React, { createContext, useState, useEffect } from "react";
import { getUserAccount } from "../services/userService";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        id: "",
        email: "",
        userName: "",
        roles: [],
        auth: false,
        isLoading: true // Mặc định là true khi bắt đầu load app
    });

    const [cartCount, setCartCount] = useState(0); // State lưu số lượng giỏ hàng

    const loginContext = (userData) => {
        setUser({
            id: userData?.id,
            email: userData?.email,
            userName: userData?.userName,
            roles: userData?.roles || [],
            auth: true,
            isLoading: false
        });
    };

    const logoutContext = () => {
        setUser({ id: "", email: "", userName: "", roles: [], auth: false, isLoading: false });
        setCartCount(0); // Reset số lượng về 0 khi đăng xuất
    };

    // Hàm này giúp ProductDetail gọi để cộng dồn số lượng mà không cần F5
    const updateCartCount = (quantity) => {
        setCartCount(prev => prev + quantity);
    }

    // Hàm nạp lại dữ liệu từ phiên đăng nhập cũ (khi F5)
    const fetchUser = async () => {
        try {
            let res = await getUserAccount();
            if (res && res.EC === 0) {
                loginContext(res.DT);
            } else {
                setUser(prev => ({ ...prev, isLoading: false }));
            }
        } catch (error) {
            setUser(prev => ({ ...prev, isLoading: false }));
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loginContext, logoutContext, cartCount, setCartCount, updateCartCount }}>
            {children}
        </UserContext.Provider>
    );
};