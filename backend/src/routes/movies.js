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
        const startPage = 1;       
        const endPage = 50;        // Increased to fetch 1000 movies (20 movies per page * 50 pages)
        const language = req.query.language || 'en-US';

        // 3. Prepare TMDB endpoint
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ msg: 'TMDB API Key not configured' });
        }

        // 4. Fetch data from TMDB
        let totalFetched = 0;
        let totalUpserted = 0;

        for (let page = startPage; page <= endPage; page++) {
            const tmdbUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=${language}&page=${page}`;

            const tmdbResponse = await axios.get(tmdbUrl);
            const results = tmdbResponse.data.results; // array of movies
            if (!results || results.length === 0) {
                console.log(`No movies found from TMDB on page ${page}`);
                continue;
            }

            totalFetched += results.length;

            // 5. Iterate through movies, upsert into DB
            for (const movie of results) {
                // Skip items that lack an 'id' field:
                if (!movie.id) continue;
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
                    voteCount: movie.vote_count,
                    genreIds: movie.genre_ids
                };
                const options = { upsert: true, new: true };
                const upserted = await Movie.findOneAndUpdate(filter, update, options);
                if (upserted) totalUpserted++;
            }
        }

        // 6. Return summary
        return res.status(200).json({
            msg: 'Movies fetched & stored successfully',
            totalFetched,
            upserted: totalUpserted
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