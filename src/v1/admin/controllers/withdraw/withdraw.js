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
      let userData = {
        wallet: 0,
      };

      const { error } = validateUpdateRequest(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const withdrawData = await commonService.findOneById(WalletHistory, id);
      if (!withdrawData || withdrawData.type !== constValues.paymentCategoryCode.WALLET_WITHDRAW) return respondFailure(res, req.__(localeKeys.global.NOT_FOUND), StatusCode.NOT_FOUND);
      const { paymentStatus, userId, amount } = withdrawData;
      if (paymentStatus === constValues.paymentStatus.PENDING && ![0, 1].includes(Number(status))) return respondFailure(res, req.__(localeKeys.global.UPDATE_FAILED), StatusCode.BAD_REQUEST);

      const alreadyResponse = {
        0: localeKeys.user.ALREADY_REJECTED,
        1: localeKeys.user.ALREADY_APPROVED,
        3: localeKeys.user.ALREADY_COMPLETED,
      };
      if (paymentStatus === Number(status)) {
        const responseType = alreadyResponse[withdrawData.paymentStatus];
        return respondFailure(res, req.__(responseType), StatusCode.BAD_REQUEST);
      }

      const responseObj = {
        3: localeKeys.user.REQUEST_COMPLETED,
        1: localeKeys.user.REQUEST_APPROVED,
        0: localeKeys.user.REQUEST_REJECTED,
      };
      const dataToSend = responseObj[status];

      const walletAmountQuery = {
        1: { amountOnHold: -amount },
        0: { wallet: amount, amountOnHold: -amount },
      };
      const amountToSet = walletAmountQuery[status];
      if (amountToSet) userData = await commonService.findOneAndUpdateFields(User, { _id: userId }, { $inc: amountToSet });

      const updateWalletQuery = {
        1: {},
        3: { approvedDate: new Date() },
        0: { balance: userData.wallet, date: new Date() },
      };
      const walletDataToSet = updateWalletQuery[status];

      await commonService.updateById(WalletHistory, id, { $set: { paymentStatus: status, ...walletDataToSet } });
      return respondSuccess(res, req.__(dataToSend), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
