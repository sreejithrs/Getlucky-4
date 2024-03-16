const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {

  validateAccount: (input) => {
    const schema = Joi.object().keys({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
      password: Joi.string().min(8).required(),
    });
    return schema.validate(input);
  },

  validateWalletRecharge: (input) => {
    const schema = Joi.object().keys({
      amount: Joi.number().integer().positive().required(),
      userId: Joi.objectId().required(),
    });
    return schema.validate(input);
  },

};
