// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, default: '' },
    price: { type: Number },
    image: { type: String, default: '' },
    sub: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Product', productSchema);
