require('dotenv').config();
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const authRoutes = require('./routes/auth');
const swipeRoutes = require('./routes/swipe');

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});