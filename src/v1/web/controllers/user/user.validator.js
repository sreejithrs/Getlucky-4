const Joi = require('joi');
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
        then: Joi.forbidden(),
        otherwise: Joi.string().trim().min(15).max(34)
          .required(),
      }),
      bic: Joi.when('country', {
        is: ['India'],
        then: Joi.forbidden(),
        otherwise: Joi.string().trim().required(),
      }),
      accountNumber: Joi.when('country', {
        is: ['India'],
        then: Joi.string().min(9).max(18).trim()
          .required(),
        otherwise: Joi.forbidden(),
      }),
      ifsc: Joi.string().trim()
        .when('country', {
          is: ['India'],
          then: Joi.string().trim().required(),
          otherwise: Joi.forbidden(),
        }),
    });
    return schema.validate(input);
  },

};
