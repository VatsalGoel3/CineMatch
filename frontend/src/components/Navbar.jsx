import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav style={{ padding: '1rem', backgroundColor: '#eee' }}>
            <Link to="/">CineMatch</Link> | {' '}
            {user ? (
                <>
                    <span>Welcome, {user.username}!</span> | {' '}
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <>
                    <Link to="/login">Login</Link> | {' '}
                    <Link to="/register">Register</Link>
                </>
            )}
        </nav>
    );
}