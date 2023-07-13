const Joi = require('joi');

module.exports = {

  validateAccount: (input) => {
    const schema = Joi.object().keys({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
      password: Joi.string().min(8).required(),
    });
    return schema.validate(input);
  },

};
