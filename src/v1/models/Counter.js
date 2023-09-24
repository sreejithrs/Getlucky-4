// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const counterSchema = new Schema(
  {
    _id: { type: String, default: '' },
    seq_value: { type: Number },
  },
);

module.exports = mongoose.model('Counter', counterSchema);
