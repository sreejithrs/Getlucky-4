const Joi = require('joi');

const mobileValidationMessage = 'You have entered an invalid phone number';

module.exports = {

  validateSignIn: (input) => {
    const schema = Joi.object().keys({
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/),
      email: Joi.string().email({ minDomainSegments: 2 }),
      password: Joi.string().min(6).required(),
    }).or('phoneNumber', 'email');
    return schema.validate(input);
  },

  validateRegister: (input) => {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/).required().messages({
        'any.required': mobileValidationMessage,
        'string.pattern.base': mobileValidationMessage,
      }),
      building: Joi.string().allow('').optional(),
      country: Joi.string().required(),
      state: Joi.string().required(),
      district: Joi.string().allow('').optional(),
      email: Joi.string().email({ minDomainSegments: 2 }).allow('').optional(),
      password: Joi.string().min(6).required(),
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
      email: Joi.string().email({ minDomainSegments: 2 }),
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/).when('email', {
        is: Joi.exist(),
        then: Joi.forbidden(),
        otherwise: Joi.required(),
      }),
    });
    return schema.validate(input);
  },

  validateResetPassword: (input) => {
    const schema = Joi.object().keys({
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/),
      email: Joi.string().email({ minDomainSegments: 2 }),
      temporaryPassword: Joi.string().required(),
      password: Joi.string().min(6).required(),
    }).or('phoneNumber', 'email');
    return schema.validate(input);
  },

};
