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
    isTicketAdded: { type: Boolean, default: false },
    date: { type: Date },
    link: { type: String, default: '' },
    totalWonPrice: { type: Number, default: 0 },
    totalWinners: { type: Number, default: 0 },
    wonTicket: { type: String, default: '' },
    result: [
      {
        category: { type: String, enum: ['straight', 'rumble', 'chance'] },
        tickets: [{ type: String }],
        totalPrices: { type: Number },
        winnersCount: { type: Number },
      },
    ],
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
