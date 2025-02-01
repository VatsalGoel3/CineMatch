const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true
        },
        email : {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        preferredGenres: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Genre'
            }
        ],
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie'
        }],
        dislikes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie'
        }],
        watched: [{
            movieId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Movie'
            },
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            watchedAt: {
                type: Date,
                default: Date.now
            }
        }],
        lastSwipeTime: {
            type: Date,
            default: null
        },
        totalSwipes: {
            type: Number,
            default: 0
        },
        profilePicture: {
            type: String,
            default: ''
        },
        preferences: {
            language: {
                type: String,
                default: 'en'
            },
            showMatureContent: {
                type: Boolean,
                default: false
            }
        }
    },
    { timestamps: true}
);

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Hash the password with a salt round of 10
        const hashed = await bcrypt.hash(this.password, 10)
        this.password = hashed;
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);