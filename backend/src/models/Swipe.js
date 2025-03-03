const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    swipeType: {
        type: String,
        enum: ['like', 'dislike'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Swipe', swipeSchema);