import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AuthPages.css'

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { username, email, password });
            alert('Registration successful! You can log in.');
            navigate('/login');
        } catch (err) {
            console.error('Register Error:', err.response?.data || err.message);
            alert(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <div className="auth-container">
          <h2>Register</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username (min 3 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Sign Up</button>
          </form>
        </div>
      );
}