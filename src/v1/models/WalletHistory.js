// node modules
const crypto = require('crypto');
const mongoose = require('mongoose');
const { generate6DigitId } = require('../../helpers/utils');

const { Schema } = mongoose;

const walletHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank' },
    transactionId: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['bank', 'westernUnion'] },
    amount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    date: { type: Date, default: new Date() },
    paymentStatus: { type: Number, default: 2 }, // 2- Pending, 1 - Success, 0 - Rejected
    type: { type: String, enum: ['WALLET_WITHDRAW', 'WINNING_AMOUNT', 'WALLET_CREDIT'] },
  },
  {
    timestamps: true,
  },
);

walletHistorySchema.pre('save', async function () {
  const booking = this;
  const uniqueId = crypto.randomUUID();
  booking.transactionId = generate6DigitId('WL_', uniqueId);
});

module.exports = mongoose.model('WalletHistory', walletHistorySchema);
