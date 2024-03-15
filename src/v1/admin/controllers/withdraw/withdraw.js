// model
const { WalletHistory } = require('../../../models');

// helpers
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const { getWithdrawRequests } = require('./withdraw.service');

module.exports = {

  getWithdrawList: async (req, res, next) => {
    try {
      const withdrawData = await getWithdrawRequests();
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, withdrawData);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
