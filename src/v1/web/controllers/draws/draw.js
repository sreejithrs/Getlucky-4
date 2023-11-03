// models
const { Draw } = require('../../../models');

// helpers
const { respondSuccess, respondError, respondFailure } = require('../../../../helpers/response');
const commonService = require('../../../services/common.service');
const localeKeys = require('../../../../locales/keys.json');
const StatusCode = require('../../../../helpers/statusCodes.json');
const constValues = require('../../../../helpers/constants');
const { drawResult, getWinnersList } = require('../../../common/common.service');

module.exports = {

  getDrawList: async (req, res, next) => {
    try {
      const drawList = await Draw.aggregate([
        {
          $match: { isCompleted: constValues.status.ACTIVE },
        },
        {
          $sort: { date: -1 },
        },
        {
          $project: {
            _id: 1,
            name: { $concat: ['$drawName', ' ', '$drawNo'] },
            date: { $dateToString: { format: '%d-%m-%Y', date: '$date' } },
          },
        },
      ]);
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        drawList,
      );
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

      const getDraw = await commonService.findOneById(Draw, drawId);
      if (!getDraw) return respondFailure(res, req.__(localeKeys.product.DRAW_NOT_FOUND), StatusCode.NOT_FOUND);
      if (!getDraw.isCompleted) return respondFailure(res, req.__(localeKeys.product.WINNER_NOT_ANNOUNCED), StatusCode.FORBIDDEN);

      const drawResults = await drawResult(drawId);
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, drawResults);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  pastDrawShows: async (req, res, next) => {
    try {
      let { skip, limit } = req.query;

      if (!skip || !limit) {
        skip = 0;
        limit = 0;
      }

      const showsList = await commonService.findAllBySkipLimit(Draw, { isCompleted: constValues.status.ACTIVE }, { date: -1 }, Number(skip), Number(limit), { _id: 0, name: { $concat: ['$drawName', ' ', '$drawNo'] }, link: 1 });
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, showsList);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getWinnersList: async (req, res, next) => {
    try {
      const { params } = req;
      const { drawId } = params;

      const winnersList = await getWinnersList(drawId);
      return respondSuccess(res, req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL), StatusCode.OK, winnersList);
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
