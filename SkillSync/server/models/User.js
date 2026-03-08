import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const portfolioItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    link: { type: String }, // External link or internal asset
    image: { type: String }, // URL to image
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Multi-tenant Org Reference
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },

    role: {
        type: String,
        enum: ['student', 'organizer', 'admin'],
        default: 'student',
        required: true
    },
    userType: {
        type: String,
        enum: ['freelancer', 'volunteer', 'organizer'],
        default: 'freelancer'
    },
    // Enhanced Profile Fields
    headline: { type: String, default: '' }, // e.g., "Computer Science Sophomore | React Developer"
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    avatar: { type: String }, // URL to profile picture

    // Reputation System
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },

    portfolio: [portfolioItemSchema],

    // Social Links
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    portfolioWebsite: { type: String, default: '' },

    // Verification
    isVerified: { type: Boolean, default: false }, // For "Institutional" trust

    createdAt: { type: Date, default: Date.now }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
