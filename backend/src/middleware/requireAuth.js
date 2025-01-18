const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ msg: 'No authorization header found '});
        }

        // Typically "Bearer <token>"
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ msg: 'Token not found in authorization header '});
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach user data to req
        req.user = decoded;

        next();
    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({ msg: 'Invalid or expired token' });
    }
};