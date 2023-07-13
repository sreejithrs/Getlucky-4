// model
const { User } = require('../../../models');

// helpers
const { respondSuccess, respondFailure, respondError } = require('../../../../helpers/response');
const { validateAccount } = require('./auth.validator');
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

    return userExist;
  },

  adminSignUp: async (req, res, next) => {
    const { body } = req;
    const { email } = body;

    try {
      const { error } = validateAccount(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userExist = await commonService.findOneByFields(User, { email });
      if (userExist) return respondFailure(res, req.__(localeKeys.auth.EMAIL_ALREADY_EXISTS), StatusCode.CONFLICT);

      body.userType = constValues.userType.ADMIN;
      await commonService.save(User, { ...body });
      return respondSuccess(res, req.__(localeKeys.admin.ADMIN_REGISTERED_SUCCESSFULLY), StatusCode.CREATED);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  adminSignIn: async (req, res, next) => {
    const { body } = req;
    const { email, password } = body;

    try {
      const { error } = validateAccount(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userExist = await commonService.includePasswordByEmail(User, email, constValues.userType.ADMIN);
      if (!userExist) return respondFailure(res, req.__(localeKeys.admin.INCORRECT_EMAIL), StatusCode.NOT_FOUND);

      const comparePassword = await userExist.comparePasswordAwait(password);
      if (!comparePassword) return respondFailure(res, req.__(localeKeys.auth.WRONG_PASSWORD), StatusCode.UNAUTHORIZED);

      const { accessToken, refreshToken } = getAuthTokens(userExist._id);
      return respondSuccess(
        res,
        req.__(localeKeys.auth.LOG_IN_SUCCESSFULLY),
        StatusCode.OK,
        { accessToken, refreshToken },
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
