import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem("cultured_user");
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem("cultured_user", JSON.stringify(user));
        } else {
            localStorage.removeItem("cultured_user");
        }
    }, [user]);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("cultured_user");
    };

    const updateUser = (fields) => {
        setUser((prev) => (prev ? { ...prev, ...fields } : fields));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                updateUser,
                isAdmin: user?.role === "ADMIN",
                isTheater: user?.role === "THEATER",
                isNormalUser: user?.role === "USER" || (!user?.role && !!user)
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

