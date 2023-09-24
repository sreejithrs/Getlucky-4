// module
const moment = require('moment');
// model
const { Draw } = require('../../../models');

// helpers
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const { validateCreateDraw } = require('./draw.validator');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const { getMessageFromValidationError } = require('../../../../helpers/utils');

module.exports = {

  createDraw: async (req, res, next) => {
    try {
      const { body } = req;
      const { date } = body;

      const { error } = validateCreateDraw(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const drawDate = moment(date).format('YYYY-MM-DD');
      const checkDraw = await commonService.findOneByFields(Draw, {
        $expr: {
          $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$date' } }, drawDate],
        },
      });
      if (checkDraw) return respondFailure(res, req.__(localeKeys.admin.DRAW_ALREADY_EXISTS), StatusCode.CONFLICT);

      await commonService.save(Draw, body);
      return respondSuccess(res, req.__(localeKeys.global.ADDED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
