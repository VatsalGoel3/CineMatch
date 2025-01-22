const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
    tmdbId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    topMoviePoster: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Genre', genreSchema);
