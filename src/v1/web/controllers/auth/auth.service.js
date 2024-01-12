const { User } = require('../../../models/index');
const { sendSMS, sendMail } = require('../../../../helpers/notification');
const commonService = require('../../../services/common.service');
const constValues = require('../../../../helpers/constants');
const { forgotPasswordEmail, emailLogin } = require('../../../../templates/emailTemplate');

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
          message: constValues.smsVerifyContent(otp),
        };
        process.nextTick(() => sendSMS(smsContent));
      }
    }
  },

  loginOtp: async (userData, data) => {
    let setData;
    let otpMax;
    let userExist = {};
    const {
      otp, dateDiff, secondsDiff, key,
    } = data;
    const otpTimeLimit = new Date();

    if (key === 'phoneNumber') {
      userExist = {
        $set: {
          phoneOtpTimeLimit: otpTimeLimit,
          phoneOtp: otp,
          phoneOtpMax: constValues.otpMax.FIRST,
        },
      };
      otpMax = userData.phoneOtpMax;
      setData = { $set: { phoneOtp: otp, phoneOtpTimeLimit: otpTimeLimit }, $inc: { phoneOtpMax: 1 } };
    } else {
      userExist = {
        $set: {
          emailOtpTimeLimit: otpTimeLimit,
          emailOtp: otp,
          emailOtpMax: constValues.otpMax.FIRST,
        },
      };
      otpMax = userData.emailOtpMax;
      setData = { $set: { emailOtp: otp, emailOtpTimeLimit: otpTimeLimit }, $inc: { emailOtpMax: 1 } };
    }

    if (dateDiff >= 1440) {
      module.exports.loginEmailOrSms(otp, key, userData);
      await commonService.updateById(User, userData._id, userExist);
    } else if (otpMax < 10 && dateDiff >= 1) { // 3 and 15
      module.exports.loginEmailOrSms(otp, key, userData);
      await commonService.updateById(User, userData._id, { ...setData });
    } else {
      const minuteDiff = (1440 - dateDiff) % 60;
      const hourDiff = Math.trunc((1440 - dateDiff) / 60);

      let hourMsg = `Maximum OTP reached, try resend after ${hourDiff} hours`;
      if (hourDiff < 1) hourMsg = `Maximum OTP reached, try resend after ${minuteDiff} minutes`;
      let minuteMsg = `OTP already sent, try resend after ${1 - dateDiff} minutes`; // 15
      if ((1 - dateDiff) === 1) minuteMsg = `OTP already sent, try resend after ${60 - secondsDiff} seconds`; // 15 and 900
      return { status: false, message: otpMax === 10 ? hourMsg : minuteMsg };
    }
    return { status: true };
  },

  loginEmailOrSms: (otp, key, userData) => {
    const {
      phoneNumber, email, name,
    } = userData;
    const otpMethod = {
      phoneNumber: sendSMS,
      email: sendMail,
    };
    const sendObj = {
      phoneNumber: { phoneNumber, message: constValues.smsLoginContent(otp) },
      email: emailLogin({ email, otp, name }),
    };
    process.nextTick(() => otpMethod[key](sendObj[key]));
  },
};
