import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import './AuthPages.css';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { identifier, password });
            const { token, user } = res.data;
            login(user, token);

            // Redirect to the page they tried to visit or default route
            const from = location.state?.from?.pathname || '/';
            navigate(from);
        } catch (err) {
            console.error('Login Error:', err.response?.data || err.message);
            alert(err.response?.data?.msg || 'Login failed');
        }
    };
    
    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className="auth-container">
          <div className="auth-form-wrapper">
            <h2>Login</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <i
                  className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} password-icon`}
                  onClick={togglePasswordVisibility}
                ></i>
              </div>
              <button type="submit">Login</button>
            </form>
          </div>
        </div>
      );
}
