import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children, adminOnly = false }) {
    const { user, token } = useContext(AuthContext);

    // Check if the user is authenticated
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Allow admin users to access any route
    if (user.role === 'admin') {
        return children;
    }

    // Restrict non-admin users from accessing admin-only routes
    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // Allow access to non-admin protected routes for authenticated users
    return children;
}
