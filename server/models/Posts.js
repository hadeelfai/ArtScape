import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    likes: [{type: mongoose.Schema.Types.ObjectId,ref: 'User'}]
}, {timestamps: true })

export default mongoose.model('Post',postSchema)