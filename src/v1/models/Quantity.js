// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const quantitySchema = new Schema(
  {
    orderId: { type: mongoose.Types.ObjectId },
    name: { type: String, default: '' },
    quantity: { type: Number },
    pin: { type: Number },
    price: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Quantity', quantitySchema);
