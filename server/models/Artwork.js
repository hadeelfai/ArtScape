import mongoose from 'mongoose'

const artworkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: false
    },
    tags: String,
    artworkType: {
        type: String,
        enum: ['Explore', 'Marketplace'],
        default: 'Explore'
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: String,
    dimensions: String,
    year: String,
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    savedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    embedding: { type: [Number], default: [] } // AI vector
}, {timestamps: true})

export default mongoose.model('Artwork', artworkSchema)