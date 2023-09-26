// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const winnerSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
    ticketNumber: [{ type: String, default: '' }],
    matchOrder: { type: String, enum: ['reverse', 'straight', 'mix', 'chance'] },
    priceAmount: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Winner', winnerSchema);
