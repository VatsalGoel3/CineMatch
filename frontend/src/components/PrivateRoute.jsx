import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import UnauthorizedAccess from "./UnauthorizedAccess";

export default function PrivateRoute({ children, adminOnly = false }) {
    const { user, token } = useContext(AuthContext);
    const location = useLocation();

    // Check if the user is authenticated
    if (!token || !user) {
        // Redirect to login while saving the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Allow admin users to access any route
    if (user.role === 'admin') {
        return children;
    }

    // Restrict non-admin users from accessing admin-only routes
    if (adminOnly && user.role !== 'admin') {
        return <UnauthorizedAccess />;
    }

    // Allow access to non-admin protected routes for authenticated users
    return children;
}
