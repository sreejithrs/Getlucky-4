// helpers
const { respondSuccess, respondError } = require('../../../../helpers/response');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');

// services
const { homeStatistics, getUserReports } = require('./home.service');
const { validateStatistics } = require('./home.validator');
const { getMessageFromValidationError } = require('../../../../helpers/utils');

module.exports = {

  getHomeStatistics: async (req, res, next) => {
    try {
      const { query } = req;

      const { error } = validateStatistics(query);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const adminHome = await homeStatistics(query);
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, adminHome);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  downloadPurchaseReport: async (req, res, next) => {
    try {
      const { query } = req;

      const { error } = validateStatistics(query);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const adminHome = await getUserReports(query);
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, adminHome);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
