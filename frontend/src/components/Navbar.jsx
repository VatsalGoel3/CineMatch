import './Navbar.css';
import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className='navbar'>
            <div className='navbar-logo'>
                <Link to="/" className='navbar-logo-link'>
                    <span className='cine'>Cine</span>
                    <span className='match'>Match</span>
                </Link>
            </div>
            <div className='navbar-links'>
                <a href="/login" className='navbar-link'>Login</a>
                <span className='divider'>|</span>
                <a href="/register" className='navbar-link'>Register</a>
            </div>
        </nav>
    );
}