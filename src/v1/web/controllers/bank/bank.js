// models
const { User, Bank, WalletHistory } = require('../../../models');

// helpers
const {
  validateAddBank, validateUpdateBank, validateAddWesternUnion, validateSendWithdrawRequest, validateUpdateSendWithdrawRequest,
} = require('./bank.validator');
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getMessageFromValidationError } = require('../../../../helpers/utils');

module.exports = {

  addBankAccount: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { iBan } = body;
      const { id } = user;

      const { error } = validateAddBank(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const bankData = await commonService.findAllByFields(Bank, { userId: id });
      if (bankData.length === 3) return respondFailure(res, req.__(localeKeys.user.MAXIMUM_BANKS_ADDED), StatusCode.NOT_FOUND);

      const bankFilter = bankData.filter((elem) => elem.iBan === iBan.trim());
      if (bankFilter.length) return respondFailure(res, req.__(localeKeys.user.BANK_ALREADY_ADDED), StatusCode.BAD_REQUEST);

      body.userId = id;
      console.log(body);
      await commonService.save(Bank, body);
      return respondSuccess(
        res,
        req.__(localeKeys.user.BANK_ADDED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  updateBankAccount: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { bankId, ...dataToSet } = body;
      const { id } = user;

      const { error } = validateUpdateBank(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const bankData = await commonService.findOneByFields(Bank, { _id: bankId, userId: id });
      if (!bankData) return respondFailure(res, req.__(localeKeys.user.BANK_NOT_FOUND), StatusCode.NOT_FOUND);

      const checkExists = await commonService.findOneByFields(Bank, { userId: id, iBan: body.iBan });
      if (checkExists) return respondFailure(res, req.__(localeKeys.user.BANK_ALREADY_ADDED), StatusCode.BAD_REQUEST);

      await commonService.deleteOneByFields(Bank, { _id: bankId });
      dataToSet._id = bankId;
      dataToSet.userId = id;
      await commonService.save(Bank, dataToSet);
      return respondSuccess(
        res,
        req.__(localeKeys.user.BANK_UPDATED_SUCCESSFULLY),
        StatusCode.OK,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getBankAccounts: async (req, res, next) => {
    try {
      const { user } = req;
      const { id, westernUnion } = user;

      const unionBank = { fullName: '', phoneNumber: '' };
      const banks = await commonService.findAllByFields(Bank, { userId: id });
      const dataToSend = {
        banks,
        westernUnion: westernUnion || unionBank,
      };
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        dataToSend,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getABankAccount: async (req, res, next) => {
    try {
      const { user, params } = req;
      const { bankId } = params;
      const { id } = user;

      const bankData = await commonService.findOneByFields(Bank, { _id: bankId, userId: id });
      if (!bankData) return respondFailure(res, req.__(localeKeys.user.BANK_NOT_FOUND), StatusCode.NOT_FOUND);

      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        bankData,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  addWesternUnion: async (req, res, next) => {
    try {
      const { user, body } = req;
      const { id } = user;

      const { error } = validateAddWesternUnion(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      await commonService.updateById(User, id, { $set: { westernUnion: body } });
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

  sendWithdrawRequest: async (req, res, next) => {
    try {
      const { user, body } = req;
      const { amount, paymentMethod, bankId } = body;
      const { id, wallet } = user;

      const { error } = validateSendWithdrawRequest(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      if (wallet < amount) return respondFailure(res, req.__(localeKeys.user.INSUFFICIENT_BALANCE), StatusCode.PAYMENT_REQUIRED);
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
