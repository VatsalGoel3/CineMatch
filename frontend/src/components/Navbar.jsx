import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return (
        <nav className='navbar'>
            <div className='navbar-logo'>
                <Link to="/" className='navbar-logo-link'>
                    <span className='cine'>Cine</span>
                    <span className='match'>Match</span>
                </Link>
            </div>
            <div className='navbar-links'>
                {!user ? (
                    <>
                        <Link to="/login" className='navbar-link'>Login</Link>
                        <span className='divider'>|</span>
                        <Link to="/register" className='navbar-link'>Register</Link>
                    </>
                ) : (
                    <>
                        <Link to="/swipe" className='navbar-link'>Swipe</Link>
                        <span className='divider'>|</span>
                        <Link to="/tracker" className='navbar-link'>CineTracker</Link>
                        <span className='divider'>|</span>
                        <span className='navbar-user'>Hello, {user.username}</span>
                        <button onClick={handleLogout} className='navbar-logout-btn'>Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
}