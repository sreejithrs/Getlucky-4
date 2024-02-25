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
    iBan: { type: String },
    bic: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
  },
  {
    timestamps: true,
  },
);

// Set up encryption configuration
const encryptionKey = process.env.ENCRYPTION_KEY;
const signingKey = process.env.ENCRYPTION_SIGN;

bankSchema.plugin((encryption), {
  encryptionKey: encryptionKey,
  signingKey: signingKey,
  encryptedFields: ['accountNumber', 'ifsc', 'iBan', 'bic'],
});

function maskAccountNumber(accountNumber) {
  // Mask all but the last four digits
  return 'x'.repeat(Math.max(0, accountNumber.length - 4)) + accountNumber.slice(-4);
}

bankSchema.post(['find', 'findOne'], (doc, next) => {
  if (doc.length) {
    const array = doc.forEach((elem) => {
      elem.accountNumber = maskAccountNumber(elem.accountNumber);
    });
    doc.accountNumber = array;
  }
  if (!Array.isArray(doc)) {
    doc.accountNumber = maskAccountNumber(doc.accountNumber);
  }
  next();
});

module.exports = mongoose.model('BankAccount', bankSchema);
