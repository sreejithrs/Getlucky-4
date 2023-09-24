// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const quantitySchema = new Schema(
  {
    orderId: { type: mongoose.Types.ObjectId },
    productId: { type: mongoose.Types.ObjectId },
    quantity: { type: Number },
    cost: { type: Number },
    pin: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Quantity', quantitySchema);
