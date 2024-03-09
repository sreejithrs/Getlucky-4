const Joi = require('joi');
const { mobileValidationMessage } = require('../auth/auth.validator');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {

  validateUpdateProfile: (input) => {
    const schema = Joi.object().keys({
      building: Joi.string().optional().allow(''),
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
      oldPassword: Joi.string().min(6).required(),
      password: Joi.string().min(6).required(),
    });
    return schema.validate(input);
  },

  validateUpdateEmail: (input) => {
    const schema = Joi.object().keys({
      otp: Joi.number().unsafe().required(),
    });
    return schema.validate(input);
  },

  validateAddBank: (input) => {
    const schema = Joi.object().keys({
      country: Joi.string().valid('United Arab Emirates', 'India', 'Philippines', 'Qatar', 'Saudi Arabia', 'Oman', 'Kuwait').required(),
      accountHolder: Joi.string().trim().required(),
      bankName: Joi.string().trim().required(),
      iBan: Joi.when('country', {
        is: ['India'],
        then: Joi.string().min(9).max(18).trim()
          .required(),
        otherwise: Joi.string().trim().min(15).max(34)
          .required(),
      }),
      bic: Joi.string().trim().required(),
    });
    return schema.validate(input);
  },

  validateUpdateBank: (input) => {
    const schema = Joi.object().keys({
      bankId: Joi.objectId().required(),
      country: Joi.string().valid('United Arab Emirates', 'India', 'Philippines', 'Qatar', 'Saudi Arabia', 'Oman', 'Kuwait').required(),
      accountHolder: Joi.string().trim().required(),
      bankName: Joi.string().trim().required(),
      iBan: Joi.when('country', {
        is: ['India'],
        then: Joi.string().min(9).max(18).trim()
          .required(),
        otherwise: Joi.string().trim().min(15).max(34)
          .required(),
      }),
      bic: Joi.string().trim().required(),
    });
    return schema.validate(input);
  },

  validateAddWesternUnion: (input) => {
    const schema = Joi.object().keys({
      fullName: Joi.string().pattern(/^[a-zA-Z\s]+$/).required().trim()
        .required()
        .messages({
          'string.pattern.base': 'Name should contain only alphabets',
        }),
      phoneNumber: Joi.string()
        .pattern(/^[+]?[0-9]+$/)
        .min(10)
        .max(15)
        .trim()
        .required()
        .messages({
          'any.required': mobileValidationMessage,
          'string.pattern.base': mobileValidationMessage,
          'string.min': 'Mobile number must be at least 10 digits long',
          'string.max': 'Mobile number must be less than 16 digits long',
        }),
    });
    return schema.validate(input);
  },

};
