const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const requireAuth = require('../middleware/requireAuth');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: 'uploads/profile-pictures',
    filename: function(req, file, cb) {
        cb(null, `${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Debug middleware
router.use((req, res, next) => {
    console.log('Profile Route:', {
        method: req.method,
        originalUrl: req.originalUrl,
        path: req.path,
        baseUrl: req.baseUrl
    });
    next();
});

// GET /preferences
router.get('/preferences', requireAuth, async (req, res) => {
    console.log('Handling preferences request in profile router');
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!user.preferences) {
            user.preferences = {
                language: 'en',
                showMatureContent: false
            };
            await user.save();
        }

        console.log('Sending preferences:', user.preferences);
        return res.status(200).json(user.preferences);
    } catch (error) {
        console.error('Get Preferences Error:', error);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// PUT /profile/update
router.put('/update', requireAuth, [
    body('username').optional().trim().isLength({ min: 3 }),
    body('email').optional().isEmail(),
    body('currentPassword').optional().isLength({ min: 8 }),
    body('newPassword').optional().isLength({ min: 8 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Handle password change
        if (req.body.currentPassword && req.body.newPassword) {
            const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Current password is incorrect' });
            }
            user.password = req.body.newPassword;
        }

        // Update other fields
        if (req.body.username) user.username = req.body.username;
        if (req.body.email) user.email = req.body.email;

        await user.save();

        // Return updated user (excluding password)
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            role: user.role
        };

        // Generate new token with updated user info
        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            msg: 'Profile updated successfully',
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// POST /profile/picture
router.post('/picture', requireAuth, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Delete old profile picture if it exists
        if (user.profilePicture) {
            const oldPath = path.join(__dirname, '../../', user.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Update user's profile picture path
        user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
        await user.save();

        return res.status(200).json({ 
            msg: 'Profile picture updated',
            profilePicture: user.profilePicture
        });
    } catch (error) {
        console.error('Profile Picture Upload Error:', error);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE /profile/delete
router.delete('/delete', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Delete profile picture if exists
        if (user.profilePicture) {
            const picturePath = path.join(__dirname, '../../', user.profilePicture);
            if (fs.existsSync(picturePath)) {
                fs.unlinkSync(picturePath);
            }
        }

        await User.findByIdAndDelete(req.user.userId);
        return res.status(200).json({ msg: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete Account Error:', error);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// Add a test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ msg: 'Profile routes are working' });
});

// Add this at the top of your routes
router.get('/', (req, res) => {
    res.json({ msg: 'Profile router is working' });
});

module.exports = router; 