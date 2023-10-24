// node modules
const mongoose = require('mongoose');
const moment = require('moment');
const Counter = require('./Counter');
const { generate6DigitId } = require('../../helpers/utils');

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    transactionId: { type: String, default: '' },
    invoiceId: { type: String, default: '' },
    totalPrice: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    userPaid: { type: Number, default: 0 },
    date: { type: Date, default: new Date() },
    paymentStatus: { type: Number, default: 2 }, // 2- Pending, 1 - Success, 0 - Failed
    paymentIntent: { type: String, default: '' },
    type: { type: String, enum: ['ORDER'], default: 'ORDER' },
  },
  {
    timestamps: true,
  },
);

bookingSchema.pre('save', async function () {
  const booking = this;
  const counter = await Counter.findOneAndUpdate({ _id: 'bookings' }, { $inc: { seq_value: 1 } }, { returnOriginal: false, upsert: true });
  booking.transactionId = generate6DigitId('TS', counter.seq_value);
  const currentDate = moment().format('DDMMYYYY');
  booking.invoiceId = `OD${currentDate}${Date.now()}`;
});

module.exports = mongoose.model('Booking', bookingSchema);
