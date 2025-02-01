import { createContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

export const AuthContext = createContext(null);

// List of public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register'];

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const storedToken = localStorage.getItem('cine_token');
        const storedUser = localStorage.getItem('cine_user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        } else if (!PUBLIC_ROUTES.includes(location.pathname)) {
            // Only redirect to home if trying to access a protected route
            navigate('/');
        }
        setLoading(false);
    }, [navigate, location]);

    const login = (userData, tokenValue) => {
        setUser(userData);
        setToken(tokenValue);
        localStorage.setItem('cine_token', tokenValue);
        localStorage.setItem('cine_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('cine_token');
        localStorage.removeItem('cine_user');
        navigate('/');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}