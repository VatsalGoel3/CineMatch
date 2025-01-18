const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const requireAuth = require('../middleware/requireAuth');
const Movie = require('../models/Movie');
const Swipe = require('../models/Swipe');

// ============================
// Validation Rules for Swiping
// ============================
const swipeValidationRules = [
    body('tmdbId')
        .notEmpty().withMessage('tmdbId is required')
        .isNumeric().withMessage('tmdbId must be a number'),
    body('title')
        .trim()
        .notEmpty().withMessage('Movie title is required'),
    body('swipeType')
        .trim()
        .isIn(['like', 'dislike']).withMessage('swipeType must be "like" or "dislike" '),
    // Add more things to validate   
];

// ========================
// POST /swipe
// Protected by requireAuth
// ========================
router.post('/', requireAuth, swipeValidationRules, async (req, res) => {
    try {
        // 1. Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
        }

        const { tmdbId, title, posterUrl, releaseDate, swipeType } = req.body;
        const userId = req.user.userId;

        // 2. Ensure the Movie exists or create it
        let movie = await Movie.findOne({ tmbdId });
        if (!movie) {
            movie = new Movie({ tmbdId, title, posterUrl, releaseDate });
            await movie.save();
        }

        // 3. Upsert the Swipe doc for user+movie
        //    If a doc exists, update the swipeType. Otherwise, create a new doc.
        const swipe = await Swipe.findOneAndUpdate(
            { user: userId, movie: movie._id },
            { swipeType },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // 4. Return the new or updated swipe doc
        return res.status(200).json({
            msg: 'Swipe recorded successfully!',
            swipe: {
                _id: swipe._id,
                user: swipe.user,
                movie: swipe.movie,
                swipeType: swipe.swipeType
            }
        });
    } catch (error) {
        console.error('Swipe Error:', error);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

module.exports = router;