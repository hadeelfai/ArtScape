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
      enum: ['PAID', 'PENDING', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'PAYMENT_RECEIVED'],
      default: 'PENDING',
    },
    paypalOrderId: String,
    recipientName: String,
    phone: String,
    addressDetails: {
      streetName: String,
      additionalDetails: String,
      district: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    shipping: {
      recipientName: String,
      phone: String,
      streetName: String,
      additionalDetails: String,
      district: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    giftMessage: String,
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
