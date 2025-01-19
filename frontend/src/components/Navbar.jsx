import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/" className="navbar-title">CineMatch</Link>
            </div>
            <div className="navbar-links">
                {user ? (
                    <>
                        <span className="navbar-welcome">Hello, {user.username}!</span>
                        <button className="navbar-logout" onClick={logout}>Logout</button>
                        <Link to="/swipe">Swipe</Link>
                        <Link to="/watchlist">Watchlist</Link>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}