const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRouter = require('./routes/auth');
const moviesRouter = require('./routes/movies');
const genresRouter = require('./routes/genres');
const swipeRouter = require('./routes/swipe');
const recommendationsRouter = require('./routes/recommendations');
const userCollectionsRouter = require('./routes/userCollections');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Static files
app.use('/assets', express.static('assets'));

// Routes
app.use('/auth', authRouter);
app.use('/movies', moviesRouter);
app.use('/genres', genresRouter);
app.use('/swipe', swipeRouter);
app.use('/movies/recommendations', recommendationsRouter);
app.use('/user', userCollectionsRouter);

// 404 handler
app.use((req, res) => {
    console.log(`404: ${req.method} ${req.url}`);
    res.status(404).json({ msg: `Route ${req.method} ${req.url} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ msg: 'Something broke!', error: err.message });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = app; 