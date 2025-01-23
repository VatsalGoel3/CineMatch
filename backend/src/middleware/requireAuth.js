const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ msg: 'Unauthorized: User not found' });
        }
        req.user = {
            userId: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(401).json({ msg: 'Unauthorized: Invalid token' });
    }
};

module.exports = requireAuth;
