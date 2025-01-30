const express = require('express');
const router = express.Router();
const axios = require('axios');

const requireAuth = require('../middleware/requireAuth');
const User = require('../models/User');
const Movie = require('../models/Movie');

const RECOMMENDER_SERVICE_URL = process.env.RECOMMENDER_SERVICE_URL || 'http://localhost:8000';
const SWITCH_TO_AI_AFTER = 20; // Switch to AI recommendations after 20 swipes

// GET /movies/recommendations
// Protected route to get recommended movies based on user prefrences
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch user info
        const user = await User.findById(userId)
            .populate('likes')
            .populate('dislikes')
            .populate('watched.movieId')
            .populate('preferredGenres');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Count total interactions (likes + dislikes + watched)
        const totalInteractions = user.likes.length + user.dislikes.length + user.watched.length;

        // If user has less than SWITCH_TO_AI_AFTER interactions, use weight-based system
        if (totalInteractions < SWITCH_TO_AI_AFTER) {
            return await getWeightBasedRecommendations(user, res);
        }

        // Otherwise, use AI recommendations
        return await getAIRecommendations(user, res);
    } catch (err) {
        console.error('Recommendation Error:', err);
        return res.status(500).json({ msg: 'Server error, please try again.' });
    }
});

async function getWeightBasedRecommendations(user, res) {
    // Existing weight-based logic
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
    
    return res.status(200).json({ 
        data: finalRecs,
        source: 'weight-based'
    });
}

async function getAIRecommendations(user, res) {
    try {
        // Prepare training data
        const userInteractions = [];
        
        // Add likes (rating 5)
        user.likes.forEach(movie => {
            userInteractions.push({
                userId: user._id.toString(),
                itemId: movie._id.toString(),
                rating: 5
            });
        });

        // Add dislikes (rating 1)
        user.dislikes.forEach(movie => {
            userInteractions.push({
                userId: user._id.toString(),
                itemId: movie._id.toString(),
                rating: 1
            });
        });

        // Add watched with their ratings
        user.watched.forEach(watch => {
            userInteractions.push({
                userId: user._id.toString(),
                itemId: watch.movieId._id.toString(),
                rating: watch.rating
            });
        });

        // Fetch all movies for item features
        const movies = await Movie.find();
        const itemFeatures = movies.map(movie => ({
            itemId: movie._id.toString(),
            genres: movie.genreIds,
            release_date: movie.releaseDate,
            popularity: movie.popularity
        }));

        // Train the model with current user data
        await axios.post(`${RECOMMENDER_SERVICE_URL}/train`, {
            userInteractions,
            itemFeatures
        });

        // Get recommendations
        const response = await axios.get(
            `${RECOMMENDER_SERVICE_URL}/recommend/${user._id.toString()}?num=20`
        );

        // Fetch full movie details for recommended IDs
        const recommendedMovies = await Movie.find({
            '_id': { $in: response.data.recommendations }
        });

        const formattedRecs = recommendedMovies.map(movie => ({
            id: movie._id,
            title: movie.title,
            poster: movie.posterPath 
                ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                : '',
            release_date: movie.releaseDate
        }));

        return res.status(200).json({ 
            data: formattedRecs,
            source: 'ai-based'
        });

    } catch (error) {
        console.error('AI Recommendation Error:', error);
        // Fallback to weight-based if AI fails
        return await getWeightBasedRecommendations(user, res);
    }
}

module.exports = router;