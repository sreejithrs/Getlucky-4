// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const drawSchema = new Schema(
  {
    drawNo: { type: String, default: '' },
    date: { type: Date },
    pin: { type: Number },
    link: { type: String, default: '' },
    quantity: { type: Number },
    firstPrice: { type: Number },
    secondPrice: { type: Number },
    thirdPrice: { type: Number },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Draw', drawSchema);
