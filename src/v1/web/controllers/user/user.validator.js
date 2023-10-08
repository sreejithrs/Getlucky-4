const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {

  validateUpdateProfile: (input) => {
    const schema = Joi.object().keys({
      building: Joi.string().optional(),
      country: Joi.string().optional(),
      district: Joi.string().optional(),
      state: Joi.string().optional(),
    });
    return schema.validate(input);
  },

  validateChangeEmail: (input) => {
    const schema = Joi.object().keys({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
    });
    return schema.validate(input);
  },

  validateUpdatePassword: (input) => {
    const schema = Joi.object().keys({
      oldPassword: Joi.string().min(8).required(),
      password: Joi.string().min(8).required(),
    });
    return schema.validate(input);
  },

  validateUpdateEmail: (input) => {
    const schema = Joi.object().keys({
      otp: Joi.number().unsafe().required(),
    });
    return schema.validate(input);
  },

};
