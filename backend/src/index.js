require('dotenv').config();
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

// Import auth route
const authRoutes = require('./routes/auth');

// Import swiper route
const swipeRoutes = require('./routes/swipe');

// Import movies route
const movieRoutes = require('./routes/movies');

// Import genres route
const genresRoutes = require('./routes/genres');

// Import userGenres route
const userGenresRoutes = require('./routes/userGenres');

const app = express()

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/CineMatch';
mongoose.connect(dbUri)
    .then(() => console.log('Connected to DB'))
    .catch(err => console.error('DB connection error:', err));

// Basic route (test)
app.get('/', (req, res) => {
    res.send('Welcome to CineMatch API!');
});

// Auth routes
app.use('/auth', authRoutes);

// Swipe routes
app.use('/swipe', swipeRoutes);

// Movies routes
app.use('/movies', movieRoutes);

// Genres routes
app.use('/genres', genresRoutes);

// User <-> Genre preference
app.use('/user/genres', userGenresRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});