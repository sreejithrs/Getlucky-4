// node modules
const mongoose = require('mongoose');
const Counter = require('./Counter');
const { generate3DigitId } = require('../../helpers/utils');

const { Schema } = mongoose;

const drawSchema = new Schema(
  {
    drawNo: { type: String },
    drawName: { type: String, default: '' },
    status: { type: Boolean, default: true },
    isCompleted: { type: Boolean, default: false },
    date: { type: Date },
    link: { type: String, default: '' },
    straight: { type: String },
    reverse: { type: String },
    mix: [{ type: String }],
    chance: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

drawSchema.pre('save', async function () {
  const draw = this;
  const counter = await Counter.findOneAndUpdate({ _id: 'draws' }, { $inc: { seq_value: 1 } }, { returnOriginal: false, upsert: true });
  draw.drawNo = generate3DigitId(counter.seq_value);
});

module.exports = mongoose.model('Draw', drawSchema);
