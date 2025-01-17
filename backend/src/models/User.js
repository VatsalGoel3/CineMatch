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
        }
    },
    { timestamps: true}
);

// Pre-save hookl to hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash if password field is modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Hash the password with a salt round of 10
        const hashed = await bcrypt.hash(this.password, 10);
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