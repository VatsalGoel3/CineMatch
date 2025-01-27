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

        // Advnaced apporach: Use Weights
        //      1) preferredGenres => +2 each
        //      2) likes => +3 each
        //      3) watched rating =>
        //          rating=1 or 2 => treat like a dislike
        //          rating=3 => +1
        //          rating=4 => +2
        //          rating=5 => +3
        //      4) dislikes => exclude
        // Using above sum up the user's genreScore for that movie's genreIds
        // Sort by highest final socre, return top 20

        const genreScore = {};

        // Stage 1: user.preferredGenres => +2 each
        user.preferredGenres.forEach((genreDoc) => {
            const gId = genreDoc.tmdbId;
            if (gId) {
                genreScore[gId] = (genreScore[gId] || 0) + 2;
            }
        });

        // Stage 2: user.likes => each like movie => get its genreIds => +3 for each
        user.likes.forEach((movieDoc) => {
            if (movieDoc.genreIds) {
                movieDoc.genreIds.forEach((gId) => {
                    genreScore[gId] = (genreScore[gId] || 0) + 3;
                });
            }
        });

        // Stage 3: user.watched => rating-based approach
        user.watched.forEach((w) => {
            const rating = w.rating || 0;
            const movieDoc = w.movieId;
            if (!movieDoc || !movieDoc.genreIds) return;

            if (rating >= 3) {
                // rating=3 => +1, rating=4 => +2, rating=5 => +3
                const addScore = rating - 2;
                movieDoc.genreIds.forEach((gId) => {
                    genreScore[gId] = (genreScore[gId] || 0) + addScore;
                });
            } else if (rating > 0) {
                // rating=1 or 2 => treat it as a "dislike" => for future could do -2 each
                movieDoc.genreIds.forEach((gId) => {
                    genreScore[gId] = (genreScore[gId] || 0) - 2;
                });
            }
        });

        // Stage 4: user.dislike => exclude
        const dislikedIdsSet = new Set(user.dislikes.map((m) => m._id.toString()));

        // Load a chunk of movies from db
        const allMovies = await Movie.find().sort({ popularity: -1 }).exec();
        // Change by .limit()

        const scoredMovies = allMovies
            .filter((movie) => !dislikedIdsSet.has(movie._id.toString()))
            .map((movie) => {
                let total = 0;
                if (movie.genreIds && movie.genreIds.length > 0) {
                    movie.genreIds.forEach((gId) => {
                        total += (genreScore[gId] || 0);
                    });
                }

                return {
                    id: movie._id,
                    title: movie.title,
                    poster: movie.posterPath
                        ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                        : '',
                    release_date: movie.releaseDate,
                    score: total
                };
            });

       // Stage 5: Sort by final 'score' descending
       scoredMovies.sort((a, b) => b.score - a.score);

       // Stage 6: Return top 20
       const finalRecs = scoredMovies.slice(0, 20);
       
       return res.status(200).json({ data: finalRecs });
    } catch (err) {
       console.error('Recommendation Error:', err);
       return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

module.exports = router;