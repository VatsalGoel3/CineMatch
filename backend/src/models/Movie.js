const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    tmbdId: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    posterUrl: {
        type: String
    }
    // Add more fiels in future
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);