const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {

  validateSendWithdrawRequest: (input) => {
    const schema = Joi.object().keys({
      amount: Joi.number().integer().min(100).positive()
        .required(),
      paymentMethod: Joi.string().valid('bank', 'westernUnion').required(),
      bankId: Joi.objectId().when('paymentMethod', {
        is: ['bank'],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    });
    return schema.validate(input);
  },

  validateUpdateSendWithdrawRequest: (input) => {
    const schema = Joi.object().keys({
      updateId: Joi.objectId().required(),
      amount: Joi.number().integer().min(100).positive()
        .required(),
      paymentMethod: Joi.string().valid('bank', 'westernUnion').required(),
      bankId: Joi.objectId().when('paymentMethod', {
        is: ['bank'],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    });
    return schema.validate(input);
  },

};
