const { User } = require('../../../models/index');
const { sendSMS } = require('../../../../helpers/notification');
const commonService = require('../../../services/common.service');
const constValues = require('../../../../helpers/constants');

module.exports = {

  sendOtp: async (otp, userData, dateDiff, api) => {
    let setData;
    let otpMax;
    let userExist = {};
    const { phoneNumber } = userData;
    const otpTimeLimit = new Date();

    if (api === 'forgotPassword') {
      userExist = {
        $set: {
          forceChangePassword: constValues.status.ACTIVE,
          otpTimeLimit,
          temporaryPassword: otp,
          passOtpMax: constValues.otpMax.FIRST,
          passwordOtpTime: Date.now(),
        },
      };
      otpMax = userData.passOtpMax;
      setData = { $set: { temporaryPassword: otp, otpTimeLimit, forceChangePassword: constValues.status.ACTIVE }, $inc: { passOtpMax: 1 } };
    } else {
      userExist = {
        $set: {
          verificationCode: otp,
          otpTimeLimit,
          verifyOtpMax: constValues.otpMax.FIRST,
          verifyOtpTime: Date.now(),
        },
      };
      otpMax = userData.verifyOtpMax;
      setData = { $set: { verificationCode: otp, otpTimeLimit }, $inc: { verifyOtpMax: 1 } };
    }

    if (Number(dateDiff) >= 5) {
      await commonService.updateById(User, userData._id, userExist);
      if (process.env.NODE_ENV !== 'test') {
        sendSMS(otp, phoneNumber);
      }
    } else if (Number(otpMax) < 5) {
      if (process.env.NODE_ENV !== 'test') {
        sendSMS(otp, phoneNumber);
      }
      await commonService.updateById(User, userData._id, { ...setData });
    } else {
      return null;
    }
    return true;
  },
};
