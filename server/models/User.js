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
    //  FOR PROFILE 
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
    profileImage: {
        type: String,
        default: '/assets/images/profilepicture.jpg'
    },
    bannerImage: {
        type: String,
        default: '/assets/images/profileheader.jpg'
    },
    socialLinks: {
        instagram: {
            type: String,
            default: ''
        },
        twitter: {
            type: String,
            default: ''
        }
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
}, {timestamps: true })

export default mongoose.model('User',userSchema)