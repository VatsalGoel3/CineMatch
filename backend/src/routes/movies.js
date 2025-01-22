const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query, validationResult } = require('express-validator');
const Movie = require('../models/Movie');

// ==============================
// Validation Rules for our Route
// ==============================
const fetchMoviesValidation = [
    query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('page must be an integer between 1 and 1000'),
    query('language')
        .optional()
        .isString()
        .withMessage('language must be a string (e.g., "en-US")')
];

// ===============================================
// GET /movies/populate
// Fetches "popular" movies from TMDB, stores them
// ===============================================
router.get('/populate', fetchMoviesValidation, async (req, res) => {
    try {
        // 1. Validate query params
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                msg: 'Validation failed',
                errors: errors.array()
            });
        }

        // 2. Grab query params (default values if not provided)
        const page = req.query.page || 1;       // page for TMDB's pagination
        const language = req.query.language || 'en-US';     // language code

        // 3. Prepare TMDB endpoint
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ msg: 'TMDB API Key not configured' });
        }

        const tmdbUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${language}&page=${page}`;

        // 4. Fetch data form TMDB
        const tmdbResponse = await axios.get(tmdbUrl);
        const results = tmdbResponse.data.results; // array of movies
        if (!results || results.length === 0) {
            return res.status(404).json({ msg: 'No movies found in TMDB response' });
        }

        // 5. Iterate through movies, upsert into DB
        let upsertCount = 0;
        for (const movie of results) {
            // Skip items that lack an 'id' field:
            if (!movie.id) {
                console.log('Skipping movie with no id:', movie);
                continue;
            }
            const filter = { tmdbId: movie.id };
            const update = {
                tmdbId: movie.id,
                title: movie.title,
                overview: movie.overview,
                posterPath: movie.poster_path,
                backdropPath: movie.backdrop_path,
                releaseDate: movie.release_date,
                popularity: movie.popularity,
                voteAverage: movie.vote_average,
                voteCount: movie.vote_count
            };
            const options = { upsert: true, new: true };
            // upsert = create if not found, otherwise update
            const upserted = await Movie.findOneAndUpdate(filter, update, options);
            if (upserted) upsertCount++;
        }

        // 6. Return summary
        return res.status(200).json({
            msg: 'Movies fetched & stored successfully',
            totalFetched: results.length,
            upserted: upsertCount
        });
    
    } catch (error) {
        console.error('TMDB Populate Error:', error);
        // if it's an axios error, you can handle details here
        return res.status(500).json({ msg: 'Server error occured' });
    }
});

// GET /movies/trending
// Returns top 6 trending movies sorted by popularity
router.get('/trending', async (req, res) => {
    try {
        const trendingMovies = await Movie.find()
            .sort({ popularity: -1 })
            .limit(6)
            .exec();

        const movies = trendingMovies.map(movie => ({
            id: movie._id,
            title: movie.title,
            poster: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '',
            release_date: movie.releaseDate
        }));

        return res.status(200).json({ data: movies });
    } catch (err) {
        console.error('Error fetching trending movies:', err);
        return res.status(500).json({ msg: 'Server erorr fetching trending movies.'})
    }
});

module.exports = router;