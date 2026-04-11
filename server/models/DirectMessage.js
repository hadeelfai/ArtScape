import mongoose from 'mongoose';
const directMessageSchema = new mongoose.Schema(
  {
sender: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
    },
recipient: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
    },
content: {
type: String,
required: true,
trim: true,
    },
read: {
type: Boolean,
default: false,
    },
  },
  {
timestamps: true,
  }
);
// Index for quick lookups
directMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
directMessageSchema.index({ recipient: 1, read: 1 });
const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);
export default DirectMessage;