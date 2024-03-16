// models
const { WalletHistory } = require('../../../models/index');

// helpers
const winston = require('../../../../config/winston.config');
const constValues = require('../../../../helpers/constants');

module.exports = {

  // eslint-disable-next-line consistent-return
  getWithdrawRequests: async () => {
    try {
      const data = await WalletHistory.aggregate([
        {
          $match: {
            type: constValues.paymentCategoryCode.WALLET_WITHDRAW,
          },
        },
      ]);
      console.log(data);
    } catch (err) {
      winston.log('error', err);
      return [];
    }
  },
};
