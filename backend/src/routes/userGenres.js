const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const requireAuth = require('../middleware/requireAuth');
const User = require('../models/User');
const Genre = require('../models/Genre');

// Validation: array of at least 5 and at most 10 genre IDs
const updateGenresValidation = [
    body('genreIds')
        .isArray({ min: 5, max: 10 })
        .withMessage('genreIds must be an array of 5 to 10 items'),
    body('genreIds.*')
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage('Each genreId must be a valid ObjectId')
];

// POST /user/genres
// Protected route to set the user's preferred genres
router.post('/', requireAuth, updateGenresValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
        }

        const { genreIds } = req.body;
        const userId = req.user.userId; // from JWT

        // 1. Verify all genreIds exist in the Genre collection
        const foundGenres = await Genre.find({ _id: { $in: genreIds } });
        if (foundGenres.length !== genreIds.length) {
            return res.status(400).json({ msg: 'One or more genreIds are invalid or not found' });
        }

        // 2. Update user's preferredGenres
        const updateUser = await User.findByIdAndUpdate(
            userId,
            { preferredGenres: genreIds },
            { new: true }
        ).populate('preferredGenres', 'tmdbId name');

        return res.status(200).json({
            msg: 'user genres updated',
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                preferredGenres: updatedUser.preferredGenres
            }
        });
    } catch (error) {
        console.error('Update Genres Error:', error);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

module.exports = router;