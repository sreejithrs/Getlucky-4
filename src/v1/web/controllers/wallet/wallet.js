// models
const { User, WalletHistory, Bank } = require('../../../models');

// helpers
const { validateSendWithdrawRequest, validateUpdateSendWithdrawRequest } = require('./wallet.validator');
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getMessageFromValidationError } = require('../../../../helpers/utils');

module.exports = {

  getUserWallet: async (req, res, next) => {
    try {
      const { user } = req;
      const { wallet } = user;

      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        { wallet },
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  sendWithdrawRequest: async (req, res, next) => {
    try {
      const { user, body } = req;
      const { amount, paymentMethod, bankId } = body;
      const { id, wallet, isWesternUnionAdded } = user;

      const { error } = validateSendWithdrawRequest(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      if (wallet < amount) return respondFailure(res, req.__(localeKeys.user.INSUFFICIENT_BALANCE), StatusCode.PAYMENT_REQUIRED);
      if (paymentMethod === 'westernUnion' && !isWesternUnionAdded) return respondFailure(res, req.__(localeKeys.user.WESTERN_UNION_NOT_ADDED), StatusCode.NOT_FOUND);

      const bankCheck = await commonService.findOneByFields(Bank, { _id: bankId, userId: id });
      if (paymentMethod === 'bank' && !bankCheck) return respondFailure(res, req.__(localeKeys.user.BANK_NOT_FOUND), StatusCode.NOT_FOUND);

      const withdrawData = {
        userId: id,
        amount,
        paymentMethod,
        date: new Date(),
        paymentStatus: constValues.paymentStatus.PENDING,
        type: constValues.paymentCategoryCode.WALLET_WITHDRAW,
      };

      if (bankId) withdrawData.bankId = bankId;
      await new WalletHistory(withdrawData).save();
      await commonService.updateById(User, id, { $inc: { wallet: -amount, amountOnHold: amount } });
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  updateWalletRequest: async (req, res, next) => {
    try {
      const { user, body } = req;
      const {
        updateId, amount, paymentMethod, bankId,
      } = body;
      const { id, wallet } = user;
      let dataToSet = {};

      const { error } = validateUpdateSendWithdrawRequest(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const walletData = await commonService.findOneById(WalletHistory, { _id: updateId, userId: id });
      if (!walletData) return respondFailure(res, req.__(localeKeys.global.NOT_FOUND), StatusCode.NOT_FOUND);

      const amountCheck = walletData.amount + wallet;
      if (amountCheck < amount) return respondFailure(res, req.__(localeKeys.user.INSUFFICIENT_BALANCE), StatusCode.PAYMENT_REQUIRED);

      dataToSet = {
        paymentMethod,
        amount,
      };
      if (bankId) dataToSet.bankId = bankId;
      await commonService.updateById(WalletHistory, updateId, { $set: dataToSet });
      if (walletData.amount === amount) return respondSuccess(res, req.__(localeKeys.global.UPDATED_SUCCESSFULLY), StatusCode.OK);

      const setAmount = amount - walletData.amount;
      await commonService.updateById(User, id, { $inc: { wallet: -setAmount, amountOnHold: setAmount } });
      return respondSuccess(
        res,
        req.__(localeKeys.global.UPDATED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },
};
