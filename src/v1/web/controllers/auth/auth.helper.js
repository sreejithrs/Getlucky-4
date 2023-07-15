const { User } = require('../../../models/index');
const { sendMail } = require('../../../../helpers/notification');
const { forgotPasswordEmail, emailVerifcationTemplate } = require('../../../../templates/emailTemplate');
const commonService = require('../../../services/common.service');
const constValues = require('../../../../helpers/constants');

module.exports = {

  sendOtp: async (otp, userData, dateDiff, api) => {
    let emailData;
    let setData;
    let otpMax;
    let userExist = {};
    const emailOptions = { email: String(userData.email).toLowerCase(), password: otp };

    if (api === 'forgotPassword') {
      userExist = {
        $set: {
          forceChangePassword: constValues.status.ACTIVE,
          temporaryPassword: otp,
          passOtpMax: constValues.otpMax.FIRST,
          passwordOtpTime: Date.now(),
        },
      };
      otpMax = userData.passOtpMax;
      setData = { $set: { temporaryPassword: otp, forceChangePassword: constValues.status.ACTIVE }, $inc: { passOtpMax: 1 } };
      emailData = forgotPasswordEmail(emailOptions);
    } else {
      userExist = {
        $set: {
          verificationCode: otp,
          verifyOtpMax: constValues.otpMax.FIRST,
          verifyOtpTime: Date.now(),
        },
      };
      otpMax = userData.verifyOtpMax;
      setData = { $set: { verificationCode: otp }, $inc: { verifyOtpMax: 1 } };
      emailData = emailVerifcationTemplate(emailOptions);
    }

    if (Number(dateDiff) >= 1440) {
      await commonService.updateById(User, userData._id, userExist);
      if (process.env.NODE_ENV !== 'test') {
        await sendMail(emailData);
      }
    } else if (Number(otpMax) < 4) {
      if (process.env.NODE_ENV !== 'test') {
        await sendMail(emailData);
      }

      await commonService.updateById(User, userData._id, { ...setData });
    } else {
      return null;
    }
    return true;
  },
};
