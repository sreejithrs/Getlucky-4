// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId },
    drawId: { type: mongoose.Types.ObjectId },
    name: { type: String, default: '' },
    date: { type: Number },
    price: { type: Number },
    quantity: { type: String, default: '' },
    status: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Order', orderSchema);
