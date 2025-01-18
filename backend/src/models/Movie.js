const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    tmdbId: {
        type: Number,
        required: true,
        unique: true
    },
    title: { type: String, required: true },
    overview: { type: String },
    posterPath: { type: String },
    backdropPath: { type: String },
    releaseDate: { type: String },
    popularity: { type: Number },
    voteAverage: { type: Number },
    voteCount: {type: Number },
    // add more fields in future as needed
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);