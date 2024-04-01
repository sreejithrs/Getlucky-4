// model
const { User, WalletHistory } = require('../../../models');

// helpers
const { respondSuccess, respondFailure, respondError } = require('../../../../helpers/response');
const { validateAccount, validateWalletRecharge } = require('./auth.validator');
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
    try {
      const { body } = req;
      const { email } = body;
      const { error } = validateAccount(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userExist = await commonService.findOneByFields(User, { email });
      if (userExist) return respondFailure(res, req.__(localeKeys.auth.EMAIL_ALREADY_EXISTS), StatusCode.CONFLICT);

      body.userType = constValues.userType.ADMIN;
      body.isVerified = constValues.status.ACTIVE;
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
    try {
      const { body } = req;
      const { email, password } = body;
      const { error } = validateAccount(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userExist = await commonService.includePasswordByEmail(User, { email, userType: constValues.userType.ADMIN });
      if (!userExist) return respondFailure(res, req.__(localeKeys.admin.INCORRECT_EMAIL), StatusCode.NOT_FOUND);

      const comparePassword = await userExist.comparePassword(password);
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

  usersList: async (req, res, next) => {
    try {
      const { params, query } = req;
      const { page, limit } = params;
      const { search } = query;
      const skipIndex = (Number(page)) * Number(limit);
      const condition = {};

      const filterData = [{ userType: constValues.userType.USER }, { isVerified: constValues.status.ACTIVE }];
      if (search && search !== '') {
        filterData.push({
          $or: [
            { name: { $regex: search.trim(), $options: 'i' } },
            { country: { $regex: search.trim(), $options: 'i' } },
            { email: { $regex: search.trim(), $options: 'i' } },
            { phoneNumber: search },
          ],
        });
      }
      condition.$and = filterData;

      const [result] = await User.aggregate([
        {
          $match: condition,
        },
        {
          $facet: {
            totalCount: [
              { $count: 'total' },
            ],
            usersList: [
              {
                $sort: {
                  _id: -1,
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  phoneNumber: 1,
                  country: 1,
                },
              },
              {
                $skip: skipIndex,
              },
              {
                $limit: Number(limit),
              },
            ],
          },
        },
      ]);

      const totalUsers = result.totalCount[0] ? result.totalCount[0].total : 0;
      const { usersList } = result;
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        { totalUsers, usersList },
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  addMoneyToWallet: async (req, res, next) => {
    try {
      const { body } = req;
      const { amount, userId } = body;

      const { error } = validateWalletRecharge(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const userData = await commonService.findOneAndUpdateFields(User, { _id: userId }, { $inc: { wallet: amount } });
      if (!userData) return respondFailure(res, req.__(localeKeys.auth.USER_NOT_FOUND), StatusCode.NOT_FOUND);

      const bookingData = {
        userId: userId,
        amount,
        balance: userData.wallet,
        date: new Date(),
        paymentStatus: constValues.paymentStatus.SUCCESS,
        type: constValues.paymentCategoryCode.WALLET_CREDIT,
      };
      await new WalletHistory(bookingData).save();
      return respondSuccess(res, req.__(localeKeys.user.TRANSFERRED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
