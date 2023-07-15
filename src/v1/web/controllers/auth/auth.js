// modules
const _ = require('lodash');
const moment = require('moment');

// model
const { User } = require('../../../models');

// helpers
const { respondSuccess, respondFailure, respondError } = require('../../../../helpers/response');
const {
  validateSignIn, validateRegister, validateSendVerificationCode, validateVerificationCode, validateForgotPassword, validateResetPassword,
} = require('./auth.validator');
const { sendOtp } = require('./auth.helper');
const { getMessageFromValidationError } = require('../../../../helpers/utils');
const { getAuthTokens } = require('../../../../helpers/token');
const commonService = require('../../../services/common.service');
const constValues = require('../../../../helpers/constants');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');

module.exports = {

  validateAndCheckExists: async (error, req) => {
    const { body } = req;
    const { email } = body;

    if (error) throw respondError(getMessageFromValidationError(error));
    const userExist = await commonService.findOneByFields(User, { email });
    if (!userExist) throw respondError(req.__(localeKeys.auth.USER_NOT_FOUND), StatusCode.NOT_FOUND);
    if (!userExist.status) throw respondError(req.__(localeKeys.auth.USER_DEACTIVE), StatusCode.CONFLICT);

    return userExist;
  },

  register: async (req, _res, next) => {
    const { body } = req;
    const { email } = body;

    try {
      const { error } = validateRegister(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userExist = await commonService.findOneByFields(User, { email });
      if (userExist && userExist.isProfileCompleted) return respondFailure(_res, req.__(localeKeys.auth.EMAIL_ALREADY_EXISTS), StatusCode.CONFLICT);

      body.isProfileCompleted = constValues.status.ACTIVE;
      if (userExist && userExist.socialID !== null) {
        delete body.email;
        delete body.password;
        await commonService.updateOneByFields(User, { email: String(email) }, { $set: { ...body } });
      } else {
        body.userType = constValues.userType.USER;
        await commonService.save(User, { ...body });
      }

      const userDetails = await commonService.findOneByFields(User, { email });
      return respondSuccess(
        _res,
        req.__(localeKeys.user.USER_REGISTERED_SUCCESSFULLY),
        StatusCode.CREATED,
        {
          userData: _.pick(userDetails, ['_id', 'email', 'isProfileCompleted', 'isVerified']),
        },
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  login: async (req, _res, next) => {
    const { body } = req;
    const { email, password } = body;
    console.log('haii')

    try {
      const { error } = validateSignIn(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userExist = await commonService.includePasswordByEmail(User, email, constValues.userType.USER);
      if (!userExist) return respondFailure(_res, req.__(localeKeys.auth.PLEASE_REGISTER), StatusCode.NOT_FOUND);
      if (!userExist.status) return respondFailure(_res, req.__(localeKeys.auth.USER_DEACTIVE), StatusCode.CONFLICT);
      if (userExist.socialId) return respondFailure(_res, req.__(localeKeys.auth.ONLY_SOCIAL_LOGIN_ALLOWED), StatusCode.UNAUTHORIZED);

      const comparePassword = await userExist.comparePasswordAwait(password);
      if (!comparePassword) return respondFailure(_res, req.__(localeKeys.auth.WRONG_PASSWORD), StatusCode.UNAUTHORIZED);

      const { accessToken, refreshToken } = getAuthTokens(userExist._id);

      return respondSuccess(
        _res,
        req.__(localeKeys.auth.LOG_IN_SUCCESSFULLY),
        StatusCode.OK,
        {
          accessToken,
          refreshToken,
          userData: _.pick(userExist, ['_id', 'email', 'isProfileCompleted', 'isVerified']),
        },
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  sendVerificationCode: async (req, res, next) => {
    const { body } = req;

    try {
      const { error } = validateSendVerificationCode(body);
      const userExist = await module.exports.validateAndCheckExists(error, req);
      if (userExist.isVerified) return respondFailure(res, req.__(localeKeys.auth.USER_ALREADY_VERIFIED), StatusCode.FORBIDDEN);
      if (userExist.verifyOtpMax === 3) await commonService.updateById(User, userExist._id, { $set: { verifyOtpTime: Date.now() } });

      const dateDiff = moment().diff(userExist.verifyOtpTime, 'minutes');
      const fiveDigitCode = 12345;

      const status = await sendOtp(fiveDigitCode, userExist, dateDiff, 'verificationCode');
      if (!status) return respondFailure(res, req.__(localeKeys.auth.OTP_MAX_REACHED), StatusCode.FORBIDDEN);

      return respondSuccess(res, req.__(localeKeys.auth.VERIFICATION_CODE_SENT_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  verifyAccount: async (req, res, next) => {
    const { body } = req;
    const { email, verificationCode } = body;

    try {
      const { error } = validateVerificationCode(body);
      const userDetails = await module.exports.validateAndCheckExists(error, req);
      if (userDetails.isVerified) return respondFailure(res, req.__(localeKeys.auth.USER_ALREADY_VERIFIED), StatusCode.FORBIDDEN);

      if (Number(userDetails.verificationCode) !== Number(verificationCode)) {
        return respondFailure(res, req.__(localeKeys.auth.WRONG_OTP), StatusCode.UNAUTHORIZED);
      }

      await commonService.updateOneByFields(User, { _id: userDetails._id }, { $set: { verificationCode: null, isVerified: true } });
      const userData = await commonService.findOneByFields(User, { email });

      const { accessToken, refreshToken } = getAuthTokens(userDetails._id);
      return respondSuccess(res, req.__(localeKeys.auth.USER_VERIFIED_SUCCESSFULLY), StatusCode.OK, {
        accessToken,
        refreshToken,
        userData: _.pick(userData, ['_id', 'email', 'isVerified']),
      });
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  forgotPassword: async (req, res, next) => {
    const { body } = req;

    try {
      const { error } = validateForgotPassword(body);
      const userExist = await module.exports.validateAndCheckExists(error, req);
      if (userExist.passOtpMax === 3) await commonService.updateById(User, userExist._id, { $set: { passwordOtpTime: Date.now() } });

      const dateDiff = moment().diff(userExist.passwordOtpTime, 'minutes');
      const temporaryPassword = 12345678;
      const status = await sendOtp(temporaryPassword, userExist, dateDiff, 'forgotPassword');
      if (!status) return respondFailure(res, req.__(localeKeys.auth.OTP_MAX_REACHED), StatusCode.FORBIDDEN);

      return respondSuccess(res, req.__(localeKeys.auth.EMAIL_SENT_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  resetPassword: async (req, res, next) => {
    const { body } = req;
    const { password, temporaryPassword } = body;

    try {
      const { error } = validateResetPassword(body);
      const userData = await module.exports.validateAndCheckExists(error, req);
      if (!userData.forceChangePassword) return respondFailure(res, req.__(localeKeys.auth.CANNOT_CHANGE_PASSWORD), StatusCode.FORBIDDEN);
      if (userData.temporaryPassword !== temporaryPassword) {
        return respondFailure(res, req.__(localeKeys.auth.TEMPORARY_PASSWORD_NOT_MATCHED), StatusCode.UNAUTHORIZED);
      }

      userData.temporaryPassword = '';
      userData.password = password;
      userData.forceChangePassword = constValues.status.DEACTIVE;
      await userData.save();

      const { accessToken, refreshToken } = getAuthTokens(userData._id);
      return respondSuccess(res, req.__(localeKeys.auth.CHANGE_PASSWORD_SUCCESSFUL), StatusCode.OK, {
        accessToken,
        refreshToken,
        userData: _.pick(userData, ['_id', 'email', 'isVerified']),
      });
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  tokenRefresh: async(req, res) => {
    const { id } = req.user;
    const { accessToken } = getAuthTokens(id, true);
    return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFULL), StatusCode.OK, { accessToken });
  },

};
