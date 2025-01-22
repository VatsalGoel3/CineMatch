const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query, validationResult } = require('express-validator');

const Genre = require('../models/Genre');

// GET /genres/populate
// Fetch from TMDB -> store in our DB
router.get('/populate', async (req, res) => {
    try {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ msg: 'TMDB API Key not configured' });
        }

        // TMDB genre list endpoint
        const tmdbUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`;

        const response = await axios.get(tmdbUrl);
        const genres = response.data.genres;

        if (!genres || genres.length === 0) {
            return res.status(404).json({ msg: 'No genres found in TMDB response' });
        }

        let upsertCount = 0;

        for (const g of genres) {
            // Upsert each genre by tmdbId
            const filter = { tmdbId: g.id };
            let update = { name: g.name };

            const existingGenre = await Genre.findOne(filter);

            if (!existingGenre || !existingGenre.topMoviePoster) {
                const tmdbTopMovieUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${g.id}&sort_by=popularity.desc&language=en-US&page=1`;
                const topMovieResponse = await axios.get(tmdbTopMovieUrl);
                const topMovie = topMovieResponse.data.results[0];
                
                if (topMovie) {
                    update.topMoviePoster = topMovie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${topMovie.poster_path}`
                        : '';
                    update.topMovieTitle = topMovie.title || '';
                    update.topMovieReleaseDate = topMovie.release_date || '';
                }
            } else {
                update.topMoviePoster = existingGenre.topMoviePoster;
                update.topMovieTitle = existingGenre.topMovieTitle;
                update.topMovieReleaseDate = existingGenre.topMovieReleaseDate;
            }

            const options = { upsert: true, new: true };
            const upserted = await Genre.findOneAndUpdate(filter, update, options);
            if (upserted) upsertCount++;
        }

        return res.status(200).json({
            msg : 'Genres fetched & stored successfully',
            totalFetched: genres.length,
            upserted: upsertCount
        });
    } catch (error) {
        console.error('Genre Populate Error:', error);
        return res.status(500).json({ msg: 'Server error occured' });
    }
});

// GET /genres
// Returns list of all genres in DB (sorted by name)
router.get('/', async (req, res) => {
    try {
        const allGenres = await Genre.find().sort({ name: 1 }); // Alphabetical
        return res.status(200).json({ msg: 'Genres retrieved', data: allGenres });
    } catch (error) {
        console.error('Fetch Genres Error:', error);
        return res.status(500).json({ msg: 'Server error retrieving genres' });
    }
});

module.exports = router;