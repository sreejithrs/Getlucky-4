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
const { calculateDrawResult } = require('./draw.service');
const { drawResult, getWinnersList } = require('../../../common/common.service');
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

      body.date = new Date(drawDate).setUTCHours(17, 0, 0, 0);
      body.drawName = constValues.drawDetails.drawName;

      await commonService.save(Draw, body);
      return respondSuccess(res, req.__(localeKeys.global.ADDED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getDrawList: async (req, res, next) => {
    try {
      const drawList = await commonService.findAllByFields(
        Draw,
        {},
        {
          _id: 1, drawName: 1, drawNo: 1, date: 1, status: 1, isCompleted: 1,
        },
        {
          date: -1,
        },
      );
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, drawList);
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
      const { drawId, status, ticketNumber } = body;

      const { error } = validateUpdateDraw(body);
      if (error) return next(respondError(getMessageFromValidationError(error)));

      const getDraw = await commonService.findOneById(Draw, drawId);
      if (!getDraw) return respondFailure(res, req.__(localeKeys.product.INVALID_DRAW_ID), StatusCode.NOT_FOUND);
      if (getDraw.isCompleted) return respondFailure(res, req.__(localeKeys.product.DRAW_COMPLETED), StatusCode.FORBIDDEN);

      const dataToSet = {
        status,
        link: body.link || '',
      };

      if (ticketNumber && ticketNumber !== '') {
        dataToSet.isTicketAdded = constValues.status.ACTIVE;
        dataToSet.wonTicket = ticketNumber;
        calculateDrawResult(ticketNumber, drawId);
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

  getDrawResult: async (req, res, next) => {
    try {
      const { params } = req;
      const { drawId } = params;

      const drawResults = await drawResult(drawId);
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, drawResults);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  publishDraw: async (req, res, next) => {
    try {
      const { params } = req;
      const { drawId } = params;

      const drawData = await commonService.findOneById(Draw, drawId);
      if (!drawData) return respondFailure(res, req.__(localeKeys.product.INVALID_DRAW_ID), StatusCode.NOT_FOUND);
      if (!drawData.status) return respondFailure(res, req.__(localeKeys.product.DRAW_INACTIVE), StatusCode.FORBIDDEN);
      if (!drawData.isTicketAdded) return respondFailure(res, req.__(localeKeys.product.WINNER_NOT_ANNOUNCED), StatusCode.FORBIDDEN);
      if (drawData.isCompleted) return respondFailure(res, req.__(localeKeys.product.DRAW_COMPLETED), StatusCode.FORBIDDEN);

      const drawDetails = await drawResult(drawId);
      const { totalWinners, totalWonPrice, result } = drawDetails;
      await commonService.updateById(Draw, drawId, {
        $set: {
          isCompleted: constValues.status.ACTIVE, totalWinners, totalWonPrice, result,
        },
      });
      return respondSuccess(res, req.__(localeKeys.global.UPDATED_SUCCESSFULLY), StatusCode.OK);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getWinners: async (req, res, next) => {
    try {
      const { params } = req;
      const { drawId } = params;

      const [winnersList] = await getWinnersList(drawId);
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, winnersList);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
