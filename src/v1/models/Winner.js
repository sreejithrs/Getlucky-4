// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const winnerSchema = new Schema(
  {
    drawId: { type: mongoose.Types.ObjectId, ref: 'Draw' },
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
    raffleId: { type: String, default: '' },
    date: { type: Date, default: new Date() },
    ticketNumbers: [{ type: String, default: '' }],
    matchOrder: { type: String, enum: ['straight', 'rumble', 'chance'] },
    priceAmount: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Winner', winnerSchema);
