// modules
const csv = require('csv');

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

  // eslint-disable-next-line consistent-return
  downloadPurchaseReport: async (req, res, next) => {
    try {
      const { query } = req;
      const { startDate, endDate } = query;

      const { error } = validateStatistics(query);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const report = await getUserReports(query);
      const result = report.map((document, index) => ({
        number: index + 1,
        ...document,
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${startDate}-${endDate}.csv`);
      res.flushHeaders();

      const stream = csv.stringify({ header: true });
      stream.pipe(res);

      result.forEach((row) => stream.write(row));
      stream.end();
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
