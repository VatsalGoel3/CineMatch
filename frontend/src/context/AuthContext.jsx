import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('cine_token');
        const storedUser = localStorage.getItem('cine_user');
        if (storedToken && storedUser) {
            storedToken(storedToken);
            storedUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData, tokenValue) => {
        setUser(userData);
        setToken(tokenValue);
        localStorage.setItem('cine_token', tokenValue)
        localStorage.setItem('cine_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('cine+token');
        localStorage.removeItem('cine_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}