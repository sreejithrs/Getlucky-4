const { User } = require('../../../models/index');
const { sendSMS, sendMail } = require('../../../../helpers/notification');
const commonService = require('../../../services/common.service');
const constValues = require('../../../../helpers/constants');
const { forgotPasswordEmail } = require('../../../../templates/emailTemplate');

module.exports = {

  sendOtp: async (userData, data) => {
    let setData;
    let otpMax;
    let userExist = {};
    const {
      otp, dateDiff, api, key,
    } = data;
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
      module.exports.sendEmailOrSms(otp, key, userData);
      await commonService.updateById(User, userData._id, userExist);
    } else if (Number(otpMax) < 5) {
      module.exports.sendEmailOrSms(otp, key, userData);
      await commonService.updateById(User, userData._id, { ...setData });
    } else {
      return null;
    }
    return true;
  },

  sendEmailOrSms: (otp, key, userData) => {
    const {
      phoneNumber, email, name,
    } = userData;
    if (process.env.NODE_ENV !== 'test') {
      if (key === 'email') {
        const emailOptions = {
          email, password: otp, name,
        };
        process.nextTick(() => sendMail(forgotPasswordEmail(emailOptions)));
      } else {
        const smsContent = {
          phoneNumber,
          message: constValues.smsContent(otp),
        };
        process.nextTick(() => sendSMS(smsContent));
      }
    }
  },
};
