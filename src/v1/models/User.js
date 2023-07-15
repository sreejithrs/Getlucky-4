// node modules
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String },
    email: {
      type: String, unique: true, lowercase: true, trim: true,
    },
    profilePicture: { type: String },
    password: { type: String, min: 8, select: false },
    verificationCode: { type: Number, default: null },
    isVerified: { type: Boolean, default: false },
    temporaryPassword: { type: String },
    forceChangePassword: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    userType: { type: Number, default: 1 },
    socialId: { type: String },
    status: { type: Boolean, default: true },
    isNotificationEnabled: { type: Boolean, default: true },
    verifyOtpTime: { type: Date },
    verifyOtpMax: { type: Number, default: 0 },
    passwordOtpTime: { type: Date },
    passOtpMax: { type: Number, default: 0 },
    loginBy: { type: String },
    language: { type: String, enum: ['en', 'de'], default: 'en' },
  },
  {
    timestamps: true,
  },
);

// on save hook
userSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, (error, hash) => {
      if (error) return next(error);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

userSchema.methods.comparePasswordAwait = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
