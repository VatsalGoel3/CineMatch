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
            .populate('watched.movieId')
            .populate({
                path: 'preferredGenres',
                select: 'tmdbId',
            });
        if(!user) {
            return res.status(404).json ({ msg: 'User not found'});
        }

        // Basic approach: Check user's liked movies -> find similar
        // Intermediate approach: Add weights
        //      1) likes => +3
        //      2) dislikes => exclude
        //      3) watched => exclude (Upgrade to a weighting approach based on stars)
        //      4) preferredGenres => +2

        // For user's preferredGenres, filter movies that match those genres

        const allMovies = await Movie.find().sort({ popularity: -1 }).exec();
        // Loading large chunk of movies | Change by .limit()

        const dislikedIds = user.dislikes.map((m) => m._id.toString());
        const watchedIds = user.watched.map((w) => w.movieId._id.toString());
        const preferredGenresTmdbIds = user.preferredGenres.map((g) => g.tmdbId);

        // Implementing Filtering
        // Stage 1: exclude disliked or watched
        let filtered = allMovies.filter((movie) => {
            const idStr = movie._id.toString();
            if (dislikedIds.includes(idStr)) return false;
            if (watchedIds.includes(idStr)) return false;
            return true;
        })

        
        // Stage 2: Keep movies that match at least one of the user 
        // preferred genres
        if (preferredGenresTmdbIds.length > 0) {
            filtered = filtered.filter((movie) => {
                const overlap = movie.genreIds?.some((gid) =>
                    preferredGenresTmdbIds.includes(gid)
            );
                return overlap;
            });
        }
        

        // Return top 20
        const finalRecs = filtered.slice(0, 20).map((movie) => ({
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