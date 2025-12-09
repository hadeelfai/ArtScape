import mongoose from 'mongoose'

const normalizeTags = (tags) => {
    if (!tags) return []
    if (Array.isArray(tags)) {
        return tags
            .map(tag => typeof tag === 'string' ? tag.trim() : '')
            .filter(Boolean)
    }
    if (typeof tags === 'string') {
        return tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
    }
    return []
}

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
    tags: {
        type: [String],
        required: true,
        set: normalizeTags,
        validate: {
            validator: function (tags) {
                return Array.isArray(tags) && tags.filter(Boolean).length >= 3
            },
            message: 'Please provide at least three tags for the artwork.'
        },
        default: []
    },
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
    embedding: 
    { type: [Number], // store embedding in db
        default: [] 
    }, 
}, {timestamps: true})

export default mongoose.model('Artwork', artworkSchema)