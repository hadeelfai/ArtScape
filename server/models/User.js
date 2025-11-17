import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    // ===== ADDED FIELDS FOR PROFILE =====
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    firstName: String,
    lastName: String,
    phoneNumber: String,
    address: String,
    state: String,
    country: String,
    city: String,
    zipCode: String,
    dateOfBirth: {
        month: String,
        day: String,
        year: String
    },
    gender: String,
    artisticSpecialization: String,
    bio: String,
    // In models/User.js
    profileImage: {
        type: String,
        default: 'https://res.cloudinary.com/dzedtbfld/image/upload/v1/artscape/defaults/default-profile.jpg'
    },
    bannerImage: {
        type: String,
        default: 'https://res.cloudinary.com/dzedtbfld/image/upload/v1/artscape/defaults/default-banner.jpg'
    },
    socialLinks: {
        instagram: String,
        twitter: String
    },
    followers: {
        type: Number,
        default: 0
    },
    following: {
        type: Number,
        default: 0
    },
    followersArray: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followingArray: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true })

export default mongoose.model('User', userSchema)