// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const quantitySchema = new Schema(
  {
    orderId: { type: mongoose.Types.ObjectId, ref: 'Order' },
    productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number },
    cost: { type: Number },
    ticketNumber: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Quantity', quantitySchema);
