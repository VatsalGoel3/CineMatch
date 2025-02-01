const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Import routes
const authRouter = require('./routes/auth');
const moviesRouter = require('./routes/movies');
const genresRouter = require('./routes/genres');
const swipeRouter = require('./routes/swipe');
const recommendationsRouter = require('./routes/recommendations');
const userCollectionsRouter = require('./routes/userCollections');
const profileRouter = require('./routes/profile');

const app = express();

// Debug: Print all routes on startup
const printRoutes = (stack, basePath = '') => {
    stack.forEach(mw => {
        if (mw.route) { // routes registered directly
            const methods = Object.keys(mw.route.methods).join(',');
            console.log(`${methods.toUpperCase()}: ${basePath}${mw.route.path}`);
        } else if (mw.name === 'router') { // router middleware
            printRoutes(mw.handle.stack, basePath + (mw.regexp.source === "^\\/?(?=\\/|$)" ? "" : mw.regexp.source.replace(/\\\//g, '/').replace(/\(\?:\/\?\)/, '')));
        }
    });
};

// Move the logging middleware to the top
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
});

app.use(cors());
app.use(express.json());

// Static files
app.use('/assets', express.static('assets'));

// Routes - order matters!
app.use('/auth', authRouter);
app.use('/movies/recommendations', recommendationsRouter);
app.use('/movies', moviesRouter);
app.use('/genres', genresRouter);
app.use('/swipe', swipeRouter);
app.use('/user/profile', profileRouter);
app.use('/user/collections', userCollectionsRouter);

// Remove any debug logging middleware from userCollections router
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
});

// Print all registered routes
console.log('\nRegistered Routes:');
printRoutes(app._router.stack);

// Add a test endpoint directly in app.js
app.get('/test', (req, res) => {
    res.json({ msg: 'Server is working' });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profile-pictures');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404 handler should be last
app.use((req, res) => {
    console.log(`404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ msg: `Route ${req.method} ${req.originalUrl} not found` });
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