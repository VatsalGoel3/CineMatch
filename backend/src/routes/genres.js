const express = require('express');
const router = express.Router();
const axios = require('axios');
const { validationResult } = require('express-validator');

const Genre = require('../models/Genre');

const backendBaseURL = process.env.BACKEND_BASE_URL || 'http://localhost:3000';

const genreImageMap = {
    "Action": "action.jpg",
    "Adventure": "adventure.jpg",
    "Animation": "animation.jpg",
    "Comedy": "comedy.jpg",
    "Crime": "crime.jpg",
    "Documentary": "documentary.jpg",
    "Drama": "drama.jpg",
    "Family": "family.jpg",
    "Fantasy": "fantasy.jpg",
    "History": "history.jpg",
    "Horror": "horror.jpg",
    "Music": "music.jpg",
    "Mystery": "mystery.jpg",
    "Romance": "romance.jpg",
    "Science Fiction": "sci-fi.jpg",
    "TV Movie": "tv-movie.jpg",
    "Thriller": "thriller.jpg",
    "War": "war.jpg",
    "Western": "western.jpg"
  };

// GET /genres/populate
// Fetch genres from TMDB and store them along with their top movie data
router.get('/populate', async (req, res) => {
    try {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ msg: 'TMDB API Key not configured' });
        }

        // TMDB genre list endpoint
        const tmdbGenreUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`;

        const genreResponse = await axios.get(tmdbGenreUrl);
        const genres = genreResponse.data.genres;

        if (!genres || genres.length === 0) {
            return res.status(404).json({ msg: 'No genres found in TMDB response' });
        }

        let upsertCount = 0;

        // Use Promise.all to fetch top movies concurrently for better performance
        await Promise.all(genres.map(async (g) => {
            const filter = { tmdbId: g.id };
            let update = { name: g.name };

            // Check if genre already has top movie data
            const existingGenre = await Genre.findOne(filter);

            if (!existingGenre || !existingGenre.topMoviePoster) {
                // Assign image paths based on genreImageMap
                const imageFileName = genreImageMap[g.name];
                if (imageFileName) {
                    update.topMoviePoster = `${backendBaseURL}/assets/posters/${imageFileName}`;
                }
            } else {
                // Preserve existing top movie data
                update.topMoviePoster = existingGenre.topMoviePoster;
            }

            const options = { upsert: true, new: true };
            const upserted = await Genre.findOneAndUpdate(filter, update, options);
            if (upserted) upsertCount++;
        }));

        return res.status(200).json({
            msg: 'Genres fetched & stored successfully',
            totalFetched: genres.length,
            upserted: upsertCount
        });
    } catch (error) {
        console.error('Genre Populate Error:', error.response?.data || error.message);
        return res.status(500).json({ msg: 'Server error occurred' });
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