// module
const moment = require('moment');
// model
const { Draw } = require('../../../models');

// helpers
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const { validateCreateDraw, validateUpdateDraw } = require('./draw.validator');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { getDrawResults } = require('./draw.service');
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

      body.date = drawDate.setUTCHours(17, 0, 0, 0);
      body.drawName = constValues.drawName;

      await commonService.save(Draw, body);
      return respondSuccess(res, req.__(localeKeys.global.ADDED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  updateDraw: async (req, res, next) => {
    try {
      const { body } = req;
      const { drawId, date, ticketNumber } = body;

      const { error } = validateUpdateDraw(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const getDraw = await commonService.findOneById(Draw, drawId);
      if (!getDraw) return respondFailure(res, req.__(localeKeys.product.DRAW_NOT_FOUND), StatusCode.NOT_FOUND);
      if (getDraw.isCompleted) return respondFailure(res, req.__(localeKeys.product.DRAW_COMPLETED), StatusCode.FORBIDDEN);

      const convertDate = moment(date).format('YYYY-MM-DD');
      const drawDate = convertDate.setUTCHours(17, 0, 0, 0);
      const dataToSet = {
        status: body.drawStatus,
        date: drawDate,
      };

      if (ticketNumber && ticketNumber !== '') {
        dataToSet.isCompleted = constValues.status.ACTIVE;
        await getDrawResults(ticketNumber, drawId);
      }

      await commonService.updateById(Draw, drawId, { $set: dataToSet });
      return respondSuccess(res, req.__(localeKeys.global.UPDATED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
