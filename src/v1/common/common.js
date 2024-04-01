// model
const { Country } = require('../models');

// helpers
const { respondSuccess, respondError } = require('../../helpers/response');
const commonService = require('../services/common.service');
const localeKeys = require('../../locales/keys.json');
const StatusCode = require('../../helpers/statusCodes.json');

module.exports = {

  getStates: async (req, res, next) => {
    try {
      const { country } = req.params;

      const states = await commonService.findAllByFields(Country, { name: country }, { _id: 0, 'states.id': 1, 'states.name': 1 });
      const dataToSend = states[0].states;
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        dataToSend,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

  getCountries: async (req, res, next) => {
    try {
      const data = await commonService.findAllByFields(Country, {}, { _id: 0, name: 1, iso2: 1 });
      return respondSuccess(
        res,
        req.__(localeKeys.global.REQUEST_WAS_SUCCESSFUL),
        StatusCode.OK,
        data,
      );
    } catch (error) {
      return next(respondError(
        error,
        StatusCode.INTERNAL_SERVER_ERROR,
      ));
    }
  },

};
