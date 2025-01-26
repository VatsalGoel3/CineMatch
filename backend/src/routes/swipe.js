const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const requireAuth = require('../middleware/requireAuth');
const User = require('../models/User');
const Movie = require('../models/Movie');

// Validation rules
const swipeValidation = [
    body('movieId')
        .notEmpty().withMessage('movieId is required')
        .custom((val) => mongoose.Types.ObjectId.isValid(val))
        .withMessage('Invalid movieId'),
    body('action')
        .notEmpty().withMessage('action is required')
        .isIn(['like', 'dislike']).withMessage('action must be either like or dislike')
];

// POST /swipe/action
// Record like or dislike
router.post('/action', requireAuth, swipeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
        }

        const { movieId, action } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (action === 'like') {
            if (!user.likes.includes(movieId)) {
                user.likes.push(movieId);
            }

            user.dislikes = user.dislikes.filter(id => !id.equals(movieId));
        } else {
            // action == 'dislike'
            // Add to dislikes if not present
            if (!user.dislikes.includes(movieId)) {
                user.dislikes.push(movieId);
            }
            // Remove from likes if present
            user.likes = user.likes.filter(id => !id.equals(movieId));
        }

        await user.save();
        return res.status(200).json({ msg: `Movie ${action}d successfully.` });
    } catch (err) {
        console.error('Swipe Error:', err);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

const watchedValidation = [
    body('movieId')
        .notEmpty().withMessage('movieId is required')
        .custom((val) => mongoose.Types.ObjectId.isValid(val))
        .withMessage('Invalid movieId'),
    body('rating')
        .notEmpty().withMessage('rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5')
];

// POST /swipe/watched
// Record that user watched a movie
router.post('/watched', requireAuth, watchedValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
        }

        const { movieId, rating } = req.body;
        const userId = req.user.userId;

        // Check if movie exists
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ msg: 'Movie not found' });
        }

        const user = await User.findById(userId);

        // Check if movie is already in watcged
        const existing = user.watched.find((w) => w.movieId.equals(movieId));
        if (existing) {
            // Update rating and timestamp
            existing.rating = rating;
            existing.watchedAt = Date.now();
        } else {
            // Add new watched entry
            user.watched.push({ movieId, rating });
        }

        await user.save();
        return res.status(200).json({ msg: 'Watched movie recorded successfully.' });
    } catch (err) {
        console.error('Watched Error:', err);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

module.exports = router;