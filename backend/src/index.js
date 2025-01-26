require('dotenv').config();
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const swipeRoutes = require('./routes/swipe');
const movieRoutes = require('./routes/movies');
const genresRoutes = require('./routes/genres');
const userGenresRoutes = require('./routes/userGenres');

const app = express()

// Middleware
app.use(cors());
app.use(express.json());

// Server static assets
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Connect to MongoDB
const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/CineMatch';
mongoose.connect(dbUri)
    .then(() => console.log('Connected to DB'))
    .catch(err => console.error('DB connection error:', err));

// Basic route (test)
app.get('/', (req, res) => {
    res.send('Welcome to CineMatch API!');
});

// App routes
app.use('/auth', authRoutes);
app.use('/swipe', swipeRoutes);
app.use('/movies', movieRoutes);
app.use('/genres', genresRoutes);
app.use('/user/genres', userGenresRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});