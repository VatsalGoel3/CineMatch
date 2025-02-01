const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided');
        return res.status(401).json({ msg: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            console.log('User not found for token');
            return res.status(401).json({ msg: 'Unauthorized: User not found' });
        }
        
        req.user = {
            userId: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        console.log('Auth successful for user:', req.user.username);
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(401).json({ msg: 'Unauthorized: Invalid token' });
    }
};

module.exports = requireAuth;
