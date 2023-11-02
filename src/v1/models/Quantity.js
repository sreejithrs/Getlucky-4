// node modules
const mongoose = require('mongoose');
const Counter = require('./Counter');
const { generate6DigitId } = require('../../helpers/utils');

const { Schema } = mongoose;

const quantitySchema = new Schema(
  {
    raffleId: { type: String },
    orderId: { type: mongoose.Types.ObjectId, ref: 'Order' },
    productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number },
    cost: { type: Number },
    ticketNumbers: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

quantitySchema.pre('insertMany', async (_next, docs) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const doc of docs) {
    // eslint-disable-next-line no-await-in-loop
    const counter = await Counter.findOneAndUpdate({ _id: 'raffles' }, { $inc: { seq_value: 1 } }, { returnOriginal: false, upsert: true });
    doc.raffleId = generate6DigitId('#RF', counter.seq_value);
  }
});

module.exports = mongoose.model('Quantity', quantitySchema);
