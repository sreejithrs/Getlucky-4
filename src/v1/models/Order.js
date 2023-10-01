// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderNo: { type: String },
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    drawId: { type: mongoose.Types.ObjectId, ref: 'Draw' },
    date: { type: Date, default: new Date() },
    totalCost: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Order', orderSchema);
