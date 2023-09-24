// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId },
    drawId: { type: mongoose.Types.ObjectId },
    totalCost: { type: Number },
    status: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Order', orderSchema);
