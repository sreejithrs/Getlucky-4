// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    drawId: { type: mongoose.Types.ObjectId, ref: 'Draw' },
    products: [
      {
        _id: false,
        productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number },
        stripeQuantity: { type: Number },
        ticketNumbers: [{ type: String }],
        cost: { type: Number },
        actualCost: { type: Number },
      },
    ],
    totalActualCost: { type: Number },
    totalCost: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Cart', cartSchema);
