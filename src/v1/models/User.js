// node modules
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, default: '' },
    tempEmail: { type: String, lowercase: true, trim: true },
    email: {
      type: String, lowercase: true, trim: true,
    },
    phoneNumber: { type: String, default: '' },
    password: { type: String, min: 8, select: false },
    verificationCode: { type: Number, default: null },
    otpTimeLimit: { type: Date },
    isVerified: { type: Boolean, default: false },
    temporaryPassword: { type: String },
    forceChangePassword: { type: Boolean, default: false },
    userType: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
    isNotificationEnabled: { type: Boolean, default: true },
    verifyOtpTime: { type: Date },
    verifyOtpMax: { type: Number, default: 0 },
    passwordOtpTime: { type: Date },
    passOtpMax: { type: Number, default: 0 },
    isChangeEmail: { type: Boolean, default: false },
    emailChangeOtp: { type: Number },
    building: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    country: { type: String, default: '' },
    language: { type: String, enum: ['en', 'de'], default: 'en' },
  },
  {
    timestamps: true,
  },
);

// on save hook
userSchema.pre('save', function (next) {
  const user = this;
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (error, hash) => {
      if (error) {
        return next(error);
      }
      user.password = hash;
      return next();
    });
    return false;
  });
  return false;
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
