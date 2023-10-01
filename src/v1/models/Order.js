// node modules
const mongoose = require('mongoose');
const Counter = require('./Counter');
const { generate6DigitId } = require('../../helpers/utils');

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    ticketId: { type: String },
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    drawId: { type: mongoose.Types.ObjectId, ref: 'Draw' },
    date: { type: Date, default: new Date() },
    totalCost: { type: Number },
  },
  {
    timestamps: true,
  },
);

orderSchema.pre('save', async function () {
  const draw = this;
  const counter = await Counter.findOneAndUpdate({ _id: 'orders' }, { $inc: { seq_value: 1 } }, { returnOriginal: false, upsert: true });
  const value = 'TK';
  draw.ticketId = generate6DigitId(value, counter.seq_value);
});

module.exports = mongoose.model('Order', orderSchema);
