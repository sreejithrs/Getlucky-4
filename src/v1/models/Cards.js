// node modules
const mongoose = require('mongoose');

const { Schema } = mongoose;

const cardsSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    cardToken: { type: String, default: '' },
    cardholderName: { type: String, default: '' },
    expiry: { type: Date },
    maskedPan: { type: String, default: '' },
    scheme: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Cards', cardsSchema);
