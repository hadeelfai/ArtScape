import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },
        price: Number,
        artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    totalAmount: Number,
    paymentMethod: {
      type: String,
      enum: ['PAYPAL', 'COD'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PAID', 'PENDING'],
      required: true,
    },
    paypalOrderId: String,
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
