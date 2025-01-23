const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ========================
// Registration Validations
// ========================
const registerValidationRules = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email is invalid'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

// =================
// Login Validations
// =================
const loginValidationRules = [
    body('identifier')
        .trim()
        .notEmpty().withMessage('Email or Username is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

// ==================
// Registration Route
// ==================
router.post('/register', registerValidationRules, async (req, res) => {
    try {
        // Check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
        }

        const { username, email, password } = req.body;

        // Check if user or email already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        if (existingUser) {
            return res.status(400).json({ msg: 'Username or email already in use.' });
        }

        // Create and save the new user
        const newUser = new User({ username, email, password });
        await newUser.save();

        return res.status(201).json({
            msg: 'User registered successfully!',
            userId: newUser._id,
            username: newUser.username,
            preferredGenres: newUser.preferredgenres
        });
    } catch (error) {
        console.error('Register Error:', error);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

// ===========
// Login Route
// ===========
router.post('/login', loginValidationRules, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
        }

        const { identifier, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ 
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        }).populate('preferredGenres');
        if (!user) {
            return res.status(401).json({ msg: 'Invalid email/username or password.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid email or password.' });
        }

        // Generate token
        const payload = { userId: user._id, username: user.username, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({
            msg: 'Login successful!',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                preferredGenres: user.preferredGenres,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login Error:', err.message, err.stack);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

module.exports = router;