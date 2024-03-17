// helpers
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getWithdrawRequests, getWithdrawRequest } = require('./withdraw.service');
const { getMessageFromValidationError } = require('../../../../helpers/utils');
const { validateWithdrawList, validateUpdateRequest } = require('./withdraw.validator');
const commonService = require('../../../services/common.service');
// models
const { WalletHistory, User } = require('../../../models');

module.exports = {

  getWithdrawList: async (req, res, next) => {
    try {
      const { query } = req;

      const { error } = validateWithdrawList(query);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const response = await getWithdrawRequests(query);
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, response);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  viewWithdrawRequest: async (req, res, next) => {
    try {
      const response = await getWithdrawRequest(req);
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, response);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  approveOrRejectRequest: async (req, res, next) => {
    try {
      const { body } = req;
      const { id, status } = body;

      const { error } = validateUpdateRequest(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const withdrawData = await commonService.findOneById(WalletHistory, id);
      if (!withdrawData) return respondFailure(res, req.__(localeKeys.global.NOT_FOUND), StatusCode.NOT_FOUND);
      const { paymentStatus, userId, amount } = withdrawData;

      const alreadyResponse = {
        1: localeKeys.user.ALREADY_APPROVED,
        0: localeKeys.user.ALREADY_REJECTED,
      };
      if (paymentStatus !== constValues.paymentStatus.PENDING) {
        const responseType = alreadyResponse[withdrawData.paymentStatus];
        return respondFailure(res, req.__(responseType), StatusCode.BAD_REQUEST);
      }

      const responseObj = {
        1: localeKeys.user.REQUEST_APPROVED,
        0: localeKeys.user.REQUEST_REJECTED,
      };
      const dataToSend = responseObj[status];

      const walletAmountQuery = {
        1: { amountOnHold: -amount },
        0: { wallet: amount, amountOnHold: -amount },
      };
      const amountToSet = walletAmountQuery[status];

      const userData = await commonService.findOneAndUpdateFields(User, { _id: userId }, { $inc: amountToSet });
      await commonService.updateById(WalletHistory, { _id: id }, { $set: { paymentStatus: status, balance: userData.wallet } });
      return respondSuccess(res, req.__(dataToSend), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
