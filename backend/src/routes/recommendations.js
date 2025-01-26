const express = require('express');
const router = express.Router();
const axios = require('axios');

const requireAuth = require('../middleware/requireAuth');
const User = require('../models/User');
const Movie = require('../models/Movie');

// GET /movies/recommendations
// Protected route to get recommended movies based on user prefrences
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch user info (including likes/dislikes/watched)
        const user = await User.findById(userId)
            .populate('likes')
            .populate('dislikes')
            .populate('watched.movieId');
        if(!user) {
            return res.status(404).json ({ msg: 'User not found'});
        }

        // Basic approach: Check user's liked movies -> find similar

        const likedMovieIds = user.likes.map((m) => m._id.toString());
        const dislikedMovieIds = user.dislikes.map((m) => m._id.toString());
        const watchedMovieIds = user.watched.map((w) => w.movieId._id.toString());

        // For test: Only recommend "popular" or "trending" movies and 
        // exclude watched or disliked
        const allMovies = await Movie.find().sort({ popularity: -1 }).limit(30).exec();

        const recommend = allMovies.filter((movie) => {
            const idStr = movie._id.toString();
            if (dislikedMovieIds.includes(idStr)) return false;
            if (watchedMovieIds.includes(idStr)) return false;
            return true;
        });

        // Return top 10 recommended for test
        const finalRecs = recommend.slice(0, 10).map((movie) => ({
            id: movie._id,
            title: movie.title,
            poster: movie.posterPath
                ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                : '',
            release_date: movie.releaseDate,
        }));

        return res.status(200).json({ data: finalRecs });
    } catch (err) {
        console.error('Recommendation Error:', err);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

module.exports = router;