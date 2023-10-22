// helpers
const { respondSuccess, respondError } = require('../../../../helpers/response');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');

// services
const homeStatistics = require('./home.service');

module.exports = {

  getHomeStatistics: async (req, res, next) => {
    try {
      const adminHome = await homeStatistics();
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, adminHome);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
