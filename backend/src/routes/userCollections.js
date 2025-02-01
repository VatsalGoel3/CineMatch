const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const User = require('../models/User');
const Movie = require('../models/Movie');

// GET /user/collections
// Returns all movie collections for the user
router.get('/collections', requireAuth, async (req, res) => {
    console.log('Fetching collections for user:', req.user.userId);
    try {
        const user = await User.findById(req.user.userId)
            .populate('likes', '_id title posterPath releaseDate')
            .populate('dislikes', '_id title posterPath releaseDate')
            .populate({
                path: 'watched.movieId',
                select: '_id title posterPath releaseDate'
            });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Format the response data
        const collections = {
            liked: user.likes.map(movie => ({
                id: movie._id,
                title: movie.title,
                poster: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '',
                release_date: movie.releaseDate
            })),
            notInterested: user.dislikes.map(movie => ({
                id: movie._id,
                title: movie.title,
                poster: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '',
                release_date: movie.releaseDate
            })),
            watched: user.watched.map(watch => ({
                id: watch.movieId._id,
                title: watch.movieId.title,
                poster: watch.movieId.posterPath ? `https://image.tmdb.org/t/p/w500${watch.movieId.posterPath}` : '',
                release_date: watch.movieId.releaseDate,
                rating: watch.rating,
                watchedAt: watch.watchedAt
            }))
        };

        return res.json(collections);
    } catch (err) {
        console.error('Fetch Collections Error:', err);
        return res.status(500).json({ msg: 'Server error fetching collections' });
    }
});

// GET /user/stats
// Returns user's movie statistics
router.get('/stats', requireAuth, async (req, res) => {
    console.log('Fetching stats for user:', req.user.userId);
    try {
        const user = await User.findById(req.user.userId)
            .populate('watched.movieId')
            .populate('likes')
            .populate('dislikes');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Calculate statistics
        const totalRated = user.watched.length;
        const averageRating = totalRated > 0 
            ? user.watched.reduce((acc, curr) => acc + curr.rating, 0) / totalRated 
            : 0;

        // Get genre counts from watched movies
        const genreCounts = {};
        user.watched.forEach(watch => {
            if (watch.movieId && watch.movieId.genreIds) {
                watch.movieId.genreIds.forEach(genreId => {
                    genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
                });
            }
        });

        // Sort genres by count and get top 3
        const topGenres = Object.entries(genreCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([genreId, count]) => ({
                genreId: parseInt(genreId),
                count
            }));

        const stats = {
            totalRated,
            averageRating,
            topGenres,
            totalSwipes: user.totalSwipes || 0,
            totalLiked: user.likes.length,
            totalDisliked: user.dislikes.length
        };

        return res.json(stats);
    } catch (err) {
        console.error('Fetch Stats Error:', err);
        return res.status(500).json({ msg: 'Server error fetching stats' });
    }
});

// DELETE /user/collections/:collection/:movieId
// Remove a movie from a collection
router.delete('/collections/:collection/:movieId', requireAuth, async (req, res) => {
    try {
        const { collection, movieId } = req.params;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        switch (collection) {
            case 'liked':
                user.likes.pull(movieId);
                break;
            case 'notInterested':
                user.dislikes.pull(movieId);
                break;
            case 'watched':
                user.watched = user.watched.filter(w => !w.movieId.equals(movieId));
                break;
            default:
                return res.status(400).json({ msg: 'Invalid collection' });
        }

        await user.save();
        return res.json({ msg: 'Movie removed from collection' });
    } catch (err) {
        console.error('Remove Movie Error:', err);
        return res.status(500).json({ msg: 'Server error removing movie' });
    }
});

// PUT /user/collections/watched/:movieId
// Update rating for a watched movie
router.put('/collections/watched/:movieId', requireAuth, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { rating } = req.body;
        const userId = req.user.userId;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Invalid rating' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const watchedMovie = user.watched.find(w => w.movieId.equals(movieId));
        if (!watchedMovie) {
            return res.status(404).json({ msg: 'Movie not found in watched list' });
        }

        watchedMovie.rating = rating;
        await user.save();

        return res.json({ msg: 'Rating updated successfully' });
    } catch (err) {
        console.error('Update Rating Error:', err);
        return res.status(500).json({ msg: 'Server error updating rating' });
    }
});

// GET /user/collections/watched
// Returns all watched movies for the user
router.get('/watched', requireAuth, async (req, res) => {
    console.log('Fetching watched movies for user:', req.user.userId);
    try {
        const user = await User.findById(req.user.userId)
            .populate('watched.movieId', '_id title posterPath releaseDate');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const watchedMovies = user.watched.map(watch => ({
            id: watch.movieId._id,
            title: watch.movieId.title,
            poster: watch.movieId.posterPath ? `https://image.tmdb.org/t/p/w500${watch.movieId.posterPath}` : '',
            release_date: watch.movieId.releaseDate,
            rating: watch.rating,
            watchedAt: watch.watchedAt
        }));

        return res.json(watchedMovies);
    } catch (err) {
        console.error('Fetch Watched Movies Error:', err);
        return res.status(500).json({ msg: 'Server error fetching watched movies' });
    }
});

// GET /user/collections/likes
// Returns all liked movies for the user
router.get('/likes', requireAuth, async (req, res) => {
    console.log('Fetching liked movies for user:', req.user.userId);
    try {
        const user = await User.findById(req.user.userId)
            .populate('likes', '_id title posterPath releaseDate');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const likedMovies = user.likes.map(movie => ({
            id: movie._id,
            title: movie.title,
            poster: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '',
            release_date: movie.releaseDate
        }));

        return res.json(likedMovies);
    } catch (err) {
        console.error('Fetch Liked Movies Error:', err);
        return res.status(500).json({ msg: 'Server error fetching liked movies' });
    }
});

module.exports = router; 