// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    totalPrice: { type: Number, default: 0 },
    creditDetected: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    userPaid: { type: Number, default: 0 },
    status: { type: Boolean, default: false },
    paymentStatus: { type: Number, default: 2 }, // 2- Pending, 1 - Success, 0 - Failed
    paymentIntent: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Booking', bookingSchema);
