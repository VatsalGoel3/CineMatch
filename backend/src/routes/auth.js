const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /auth/register
// This route creates a new user (with hashed password from the model hook).
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

    // Check if all fields are provided
    if (!username || !email || !password) {
        return res.status(400).json({ msg: 'All fields are required.' });    
    }

    // Check if user or email alreadu exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existingUser) {
        return res.status(400).json({ msg: 'Username or email already in use.' });
    }

    // Create and save the new user
    const newUser = new User({ username, email, password });
    await newUser.save();

    // Return success response
    return res.status(201).json({
        msg: 'User registered succesfully!',
        userId: newUser._id,
        username: newUser.username
    });

    } catch (error) {
        console.error('Register Error:', error);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }

});

module.exports = router;

