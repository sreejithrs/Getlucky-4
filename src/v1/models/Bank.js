// node modules
const mongoose = require('mongoose');
const encryption = require('mongoose-encryption');

const { Schema } = mongoose;

const bankSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    accountHolder: { type: String, default: '' },
    country: { type: String, default: '' },
    bankName: { type: String, default: '' },
    iBan: { type: String, unique: true },
    bic: { type: String },
  },
  {
    timestamps: true,
  },
);

bankSchema.index({ userId: 1 });

// Set up encryption configuration
const encryptionKey = process.env.ENCRYPTION_KEY;
const signingKey = process.env.ENCRYPTION_SIGN;

bankSchema.plugin((encryption), {
  encryptionKey: encryptionKey,
  signingKey: signingKey,
  encryptedFields: ['iBan', 'bic'],
});

module.exports = mongoose.model('BankAccount', bankSchema);
