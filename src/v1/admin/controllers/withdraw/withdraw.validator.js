const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {

  validateWithdrawList: (input) => {
    const schema = Joi.object().keys({
      skip: Joi.number().required(),
      limit: Joi.number().required(),
      status: Joi.number().valid('', 0, 1, 2, 3).optional(),
    });
    return schema.validate(input);
  },

  validateUpdateRequest: (input) => {
    const schema = Joi.object().keys({
      id: Joi.objectId().required(),
      status: Joi.number().valid(0, 1, 3).optional(),
    });
    return schema.validate(input);
  },

};
