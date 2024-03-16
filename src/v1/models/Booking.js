// node modules
const crypto = require('crypto');
const moment = require('moment');
const mongoose = require('mongoose');
const { generate6DigitId } = require('../../helpers/utils');

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    transactionId: { type: String, default: '' },
    invoiceId: { type: String, default: '' },
    totalPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    userPaid: { type: Number, default: 0 },
    date: { type: Date, default: new Date() },
    paymentStatus: { type: Number, default: 2 }, // 2- Pending, 1 - Success, 0 - Failed
    paymentIntent: { type: String, default: '' },
    type: { type: String, enum: ['ORDER', 'WALLET_ORDER'], default: 'ORDER' },
  },
  {
    timestamps: true,
  },
);

bookingSchema.pre('save', async function () {
  const booking = this;
  const uniqueId = crypto.randomUUID();
  booking.transactionId = generate6DigitId('TS_', uniqueId);
  const currentDate = moment().format('DDMMYYYY');
  booking.invoiceId = `OD${currentDate}${Date.now()}`;
});

module.exports = mongoose.model('Booking', bookingSchema);
