// modules
const moment = require('moment');
const XLSX = require('xlsx');

// helpers
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
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
      let { startDate, endDate } = query;

      const { error } = validateStatistics(query);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const report = await getUserReports(query);
      if (!report.length) return respondFailure(res, req.__(localeKeys.product.NO_REPORT_AVAILABLE), StatusCode.NOT_FOUND);

      const result = report.map((document, index) => ({
        'no.': index + 1,
        ...document,
      }));

      startDate = moment(startDate).format('DD-MM-YYYY');
      endDate = moment(endDate).format('DD-MM-YYYY');

      const ws = XLSX.utils.json_to_sheet(result);
      const wsCols = [
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
      ];

      ws['!cols'] = wsCols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Report_${startDate}_${endDate}.xlsx`);

      res.end(xlsxBuffer);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
