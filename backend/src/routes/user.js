const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const requireAuth = require('../middleware/requireAuth');
const User = require('../models/User');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: 'uploads/profile-pictures',
    filename: function(req, file, cb) {
        cb(null, `${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
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

// Debug middleware should be first
router.use((req, res, next) => {
    console.log('User Profile Route:', {
        method: req.method,
        originalUrl: req.originalUrl,
        path: req.path,
        baseUrl: req.baseUrl
    });
    next();
});

// GET /profile/preferences
router.get('/profile/preferences', requireAuth, async (req, res) => {
    console.log('Handling preferences request:', {
        userId: req.user.userId,
        path: req.path,
        fullPath: req.baseUrl + req.path
    });
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Make sure preferences exists
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

// PUT /user/profile/update
router.put('/profile/update', requireAuth, [
    body('username').optional().trim().isLength({ min: 3 }),
    body('email').optional().isEmail(),
    body('currentPassword').optional().isLength({ min: 8 }),
    body('newPassword').optional().isLength({ min: 8 }),
    body('language').optional().isIn(['en', 'es', 'fr']),
    body('showMatureContent').optional().isBoolean()
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
        if (req.body.language) user.preferences.language = req.body.language;
        if (typeof req.body.showMatureContent === 'boolean') {
            user.preferences.showMatureContent = req.body.showMatureContent;
        }

        await user.save();

        // Return updated user (excluding password)
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            preferences: user.preferences
        };

        return res.status(200).json({ msg: 'Profile updated', user: userResponse });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// POST /user/profile/picture
router.post('/profile/picture', requireAuth, upload.single('profilePicture'), async (req, res) => {
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

// DELETE /user/profile/delete
router.delete('/profile/delete', requireAuth, async (req, res) => {
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

// Test route
router.get('/test', (req, res) => {
    res.json({ msg: 'User routes are working' });
});

module.exports = router; 