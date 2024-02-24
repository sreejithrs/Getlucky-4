// modules
const _ = require('lodash');
const moment = require('moment');

// model
const { User } = require('../../../models');

// helpers
const { respondSuccess, respondFailure, respondError } = require('../../../../helpers/response');
const {
  validateSignIn, validateRegister, validateVerifySignIn, validateResendOtpCode, validateVerificationCode, validateForgotPassword, validateResetPassword,
} = require('./auth.validator');
const { sendOtp, loginOtp } = require('./auth.service');
const { getMessageFromValidationError, generate4DigitOTP } = require('../../../../helpers/utils');
const { getAuthTokens } = require('../../../../helpers/token');
const commonService = require('../../../services/common.service');
const constValues = require('../../../../helpers/constants');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const { sendSMS, sendMail } = require('../../../../helpers/notification');
const { sendRegisterEmail } = require('../../../../templates/emailTemplate');

module.exports = {

  validateAndCheckExists: async (error, req) => {
    const { body } = req;
    const { email, phoneNumber } = body;

    if (error) throw respondError(getMessageFromValidationError(error));
    const userExist = await commonService.findOneByFields(User, { $or: [{ email }, { phoneNumber }] });
    if (!userExist) throw respondError(req.__(localeKeys.auth.USER_NOT_FOUND), StatusCode.NOT_FOUND);
    if (!userExist.status) throw respondError(req.__(localeKeys.auth.USER_DEACTIVE), StatusCode.CONFLICT);

    return userExist;
  },

  register: async (req, _res, next) => {
    try {
      const { body } = req;
      const { email, phoneNumber } = body;

      const { error } = validateRegister(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      if (email && email !== '') {
        const userEmailExists = await commonService.findOneByFields(User, { email: email.toLowerCase() });
        if (userEmailExists) return respondFailure(_res, req.__(localeKeys.auth.EMAIL_ALREADY_EXISTS), StatusCode.CONFLICT);
      }

      const userPhoneExists = await commonService.findOneByFields(User, { phoneNumber });
      if (userPhoneExists) return respondFailure(_res, req.__(localeKeys.auth.MOBILE_ALREADY_EXISTS), StatusCode.CONFLICT);

      const verificationCode = generate4DigitOTP();
      body.verificationCode = verificationCode;
      body.userType = constValues.userType.USER;
      const userData = await commonService.save(User, body);

      const smsContent = {
        phoneNumber,
        message: constValues.smsVerifyContent(verificationCode),
      };
      sendSMS(smsContent);

      const emailOptions = {
        email, otp: verificationCode,
      };

      if (email !== '') sendMail(sendRegisterEmail(emailOptions));
      return respondSuccess(
        _res,
        req.__(localeKeys.user.USER_REGISTERED_SUCCESSFULLY),
        StatusCode.CREATED,
        {
          userData: _.pick(userData, ['_id', 'email', 'name', 'phoneNumber', 'isVerified']),
        },
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  login: async (req, res, next) => {
    try {
      const { body } = req;
      const { phoneNumber } = body;

      const { error } = validateSignIn(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const key = phoneNumber ? 'phoneNumber' : 'email';
      const value = body[key];
      const searchData = {};
      searchData[key] = value;
      const errMsg = key === 'email' ? localeKeys.auth.INVALID_EMAIL : localeKeys.auth.INVALID_PHONE;
      let successMessage = key === 'email' ? localeKeys.auth.EMAIL_SENT_SUCCESSFULLY : localeKeys.auth.OTP_SENT_SUCCESSFULLY;

      const userExist = await commonService.findOneByFields(User, searchData, constValues.userType.USER);
      if (!userExist) return respondFailure(res, req.__(errMsg), StatusCode.NOT_FOUND);
      if (!userExist.status) return respondFailure(res, req.__(localeKeys.auth.USER_DEACTIVE), StatusCode.CONFLICT);

      const otpTIme = {
        phoneNumber: userExist.phoneOtpTimeLimit,
        email: userExist.emailOtpTimeLimit,
      };
      const otpTime = otpTIme[key] || 5;
      const dateDiff = Number(moment().diff(otpTime, 'minutes'));
      const secondsDiff = Number(moment().diff(otpTime, 'seconds'));
      const dataToSend = {
        otp: generate4DigitOTP(), dateDiff, secondsDiff, key,
      };

      const response = await loginOtp(userExist, dataToSend);
      if (!response.status) successMessage = response.message;
      return respondSuccess(res, req.__(successMessage), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  verifyLogin: async (req, _res, next) => {
    try {
      const { body } = req;
      const { email, phoneNumber } = body;
      let { otp } = body;

      otp = Number(otp);
      const { error } = validateVerifySignIn(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userExist = await commonService.findOneByFields(User, { $or: [{ email }, { phoneNumber }] }, constValues.userType.USER);
      if (!userExist) return respondFailure(_res, req.__(localeKeys.auth.INVALID_EMAIL_OR_PHONE), StatusCode.NOT_FOUND);
      if (!userExist.status) return respondFailure(_res, req.__(localeKeys.auth.USER_DEACTIVE), StatusCode.CONFLICT);

      const otpData = userExist.phoneOtp || userExist.emailOtp || userExist.verificationCode;
      if (!otpData) return respondFailure(_res, req.__(localeKeys.auth.OTP_EXPIRED), StatusCode.FORBIDDEN);
      if (otp !== userExist.emailOtp && otp !== userExist.phoneOtp && otp !== userExist.verificationCode) return respondFailure(_res, req.__(localeKeys.auth.TEMPORARY_PASSWORD_NOT_MATCHED), StatusCode.CONFLICT);

      if (!userExist.isVerified) {
        userExist.isVerified = constValues.status.ACTIVE;
        userExist.verificationCode = null;
      }

      userExist.phoneOtp = null;
      userExist.emailOtp = null;
      await userExist.save();

      const { accessToken, refreshToken } = getAuthTokens(userExist._id);
      return respondSuccess(
        _res,
        req.__(localeKeys.auth.LOG_IN_SUCCESSFULLY),
        StatusCode.OK,
        {
          accessToken,
          refreshToken,
          userData: _.pick(userExist, ['_id', 'email', 'name', 'phoneNumber', 'isVerified']),
        },
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  sendVerifyCode: async (req, res, next) => {
    try {
      const { body } = req;
      const { error } = validateResendOtpCode(body);

      const userExist = await module.exports.validateAndCheckExists(error, req);
      // if (userExist.isVerified) return respondFailure(res, req.__(localeKeys.auth.USER_ALREADY_VERIFIED), StatusCode.CONFLICT);
      if (userExist.verifyOtpMax === 4) await commonService.updateById(User, userExist._id, { $set: { verifyOtpTime: Date.now() } });

      const dateDiff = moment().diff(userExist.verifyOtpTime, 'minutes');
      const dataToSend = { otp: generate4DigitOTP(), dateDiff, api: 'verificationCode' };

      const status = await sendOtp(userExist, dataToSend);
      if (!status) return respondFailure(res, req.__(localeKeys.auth.OTP_MAX_REACHED), StatusCode.TOO_MANY_REQUESTS);

      return respondSuccess(res, req.__(localeKeys.auth.OTP_SENT_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  verifyAccount: async (req, res, next) => {
    try {
      const { body } = req;
      const { verificationCode } = body;

      const { error } = validateVerificationCode(body);
      const userDetails = await module.exports.validateAndCheckExists(error, req);

      if (userDetails.isVerified) return respondFailure(res, req.__(localeKeys.auth.USER_ALREADY_VERIFIED), StatusCode.CONFLICT);
      if (Number(userDetails.verificationCode) !== Number(verificationCode)) return respondFailure(res, req.__(localeKeys.auth.WRONG_OTP), StatusCode.BAD_REQUEST);

      const dateDiff = moment().diff(userDetails.otpTimeLimit, 'minutes');
      if (dateDiff > 3) return respondFailure(res, req.__(localeKeys.auth.OTP_TIME_LIMIT), StatusCode.FORBIDDEN);

      const userData = await commonService.findOneAndUpdateFields(User, { _id: userDetails._id }, { $set: { verificationCode: null, otpTimeLimit: null, isVerified: true } });
      const { accessToken, refreshToken } = getAuthTokens(userDetails._id);
      return respondSuccess(res, req.__(localeKeys.auth.USER_VERIFIED_SUCCESSFULLY), StatusCode.OK, {
        accessToken,
        refreshToken,
        userData: _.pick(userData, ['_id', 'email', 'name', 'isVerified']),
      });
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { body } = req;
      const { email } = body;

      const { error } = validateForgotPassword(body);
      const userExist = await module.exports.validateAndCheckExists(error, req);
      if (userExist.passOtpMax === 4) await commonService.updateById(User, userExist._id, { $set: { passwordOtpTime: Date.now() } });

      const key = email ? 'email' : 'phoneNumber';
      const value = body[key];
      const searchData = {};
      searchData[key] = value;

      const passwordTime = userExist.passwordOtpTime || 5;
      const dateDiff = moment().diff(passwordTime, 'minutes');
      const dataToSend = {
        otp: generate4DigitOTP(), dateDiff, api: 'forgotPassword', key,
      };

      const status = await sendOtp(userExist, dataToSend);
      if (!status) return respondFailure(res, req.__(localeKeys.auth.OTP_MAX_REACHED), StatusCode.TOO_MANY_REQUESTS);

      return respondSuccess(res, req.__(localeKeys.auth.TEMP_PASSWORD_SENT), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { body } = req;
      const { password, temporaryPassword } = body;

      const { error } = validateResetPassword(body);
      const userData = await module.exports.validateAndCheckExists(error, req);
      if (!userData.forceChangePassword) return respondFailure(res, req.__(localeKeys.auth.CANNOT_CHANGE_PASSWORD), StatusCode.FORBIDDEN);

      const dateDiff = moment().diff(userData.otpTimeLimit, 'minutes');
      if (dateDiff > 3) return respondFailure(res, req.__(localeKeys.auth.OTP_TIME_LIMIT), StatusCode.FORBIDDEN);
      if (userData.temporaryPassword !== temporaryPassword) return respondFailure(res, req.__(localeKeys.auth.OTP_NOT_MATCHED), StatusCode.BAD_REQUEST);

      userData.temporaryPassword = '';
      userData.password = password;
      userData.otpTimeLimit = null;
      userData.passwordOtpTime = null;
      userData.forceChangePassword = constValues.status.DEACTIVE;
      await userData.save();

      return respondSuccess(res, req.__(localeKeys.auth.CHANGE_PASSWORD_SUCCESSFUL), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  tokenRefresh: async (req, res) => {
    const { id } = req.user;
    const { accessToken } = getAuthTokens(id, true);
    return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, { accessToken });
  },

};
