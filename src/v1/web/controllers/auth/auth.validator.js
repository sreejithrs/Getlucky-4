const Joi = require('joi');

module.exports = {

  validateSignIn: (input) => {
    const schema = Joi.object().keys({
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/),
      email: Joi.string().email({ minDomainSegments: 2 }),
      password: Joi.string().min(8).required(),
    }).or('phoneNumber', 'email');
    return schema.validate(input);
  },

  validateRegister: (input) => {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/).required(),
      building: Joi.string().optional(),
      country: Joi.string().required(),
      state: Joi.string().required(),
      district: Joi.string().optional(),
      email: Joi.string().email({ minDomainSegments: 2 }).optional(),
      password: Joi.string().min(8).required(),
    });
    return schema.validate(input);
  },

  validateResendOtpCode: (input) => {
    const schema = Joi.object().keys({
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/).required(),
    });
    return schema.validate(input);
  },

  validateVerificationCode: (input) => {
    const schema = Joi.object().keys({
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/).required(),
      verificationCode: Joi.number().unsafe().required(),
    });
    return schema.validate(input);
  },

  validateForgotPassword: (input) => {
    const schema = Joi.object().keys({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
    });
    return schema.validate(input);
  },

  validateResetPassword: (input) => {
    const schema = Joi.object().keys({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
      password: Joi.string().min(8).required(),
      temporaryPassword: Joi.string().required(),
    });
    return schema.validate(input);
  },

};
