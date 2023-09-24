// node modules
const mongoose = require('mongoose');
const Counter = require('./Counter');
const { generate3DigitId } = require('../../helpers/utils');

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    productNo: { type: String, default: '' },
    name: { type: String, default: '' },
    cost: { type: Number },
    image: { type: String, default: '' },
    priceAmount: { type: Number },
  },
  {
    timestamps: true,
  },
);

productSchema.pre('save', async function () {
  const draw = this;
  const counter = await Counter.findOneAndUpdate({ _id: 'products' }, { $inc: { seq_value: 1 } }, { returnOriginal: false, upsert: true });
  draw.productNo = generate3DigitId(counter.seq_value);
});

module.exports = mongoose.model('Product', productSchema);
