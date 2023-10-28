const Joi = require('joi').extend(require('@joi/date'));

module.exports = {

  validateStatistics: (input) => {
    const schema = Joi.object().keys({
      startDate: Joi.date().format('YYYY-MM-DD').required(),
      endDate: Joi.date().format('YYYY-MM-DD').required(),
    });
    return schema.validate(input);
  },

};
