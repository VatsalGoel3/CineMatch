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
router.post('/action', requireAuth, async (req, res) => {
    try {
        const { movieId, action } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update total swipes and last swipe time
        user.totalSwipes += 1;
        user.lastSwipeTime = new Date();

        // Handle the action (like/dislike)
        if (action === 'like') {
            user.likes.addToSet(movieId);
            user.dislikes.pull(movieId);
        } else if (action === 'dislike') {
            user.dislikes.addToSet(movieId);
            user.likes.pull(movieId);
        }

        await user.save();

        return res.status(200).json({ 
            msg: 'Action recorded',
            totalSwipes: user.totalSwipes
        });
    } catch (err) {
        console.error('Swipe Action Error:', err);
        return res.status(500).json({ msg: 'Server error' });
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

        // Check if movie is already in watched
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

router.post('/want-to-watch', requireAuth, async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.wantToWatch.includes(movieId)) {
            return res.status(400).json({ msg: 'Movie is already in your Want to Watch list' });
        }

        user.wantToWatch.push(movieId);
        await user.save();

        return res.status(200).json({ msg: 'Movie added to Want to Watch list' });
    } catch (err) {
        console.error('Want to Watch Error:', err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;