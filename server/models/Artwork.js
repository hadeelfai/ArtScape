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
    views: // view data for each artwork
    [{ user: 
        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        duration: Number, timestamp: Date }],
    embedding: 
    { type: [Number], // store embedding in db
        default: [] 
    }, 
}, {timestamps: true})

export default mongoose.model('Artwork', artworkSchema)