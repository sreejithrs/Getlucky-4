const Joi = require('joi');

const mobileValidationMessage = 'You have entered an invalid phone number';
const emailOrMobile = 'email or phoneNumber is required';

module.exports = {

  validateSignIn: (input) => {
    const schema = Joi.object().keys({
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/),
      email: Joi.string().email({ minDomainSegments: 2 }).allow(''),
    }).xor('phoneNumber', 'email').messages({
      'object.xor': 'Either email or phoneNumber is required, not both',
    });
    return schema.validate(input);
  },

  validateVerifySignIn: (input) => {
    const schema = Joi.object().keys({
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/),
      email: Joi.string().email({ minDomainSegments: 2 }).allow(''),
      otp: Joi.number().unsafe().required(),
    }).xor('phoneNumber', 'email').messages({
      'object.xor': 'Either email or phoneNumber is required, not both',
    });
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
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
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
      }).messages({
        'any.required': emailOrMobile,
        'string.pattern.base': emailOrMobile,
      }),
    });
    return schema.validate(input);
  },

  validateResetPassword: (input) => {
    const schema = Joi.object().keys({
      phoneNumber: Joi.string().pattern(/^[+]?[0-9]+$/),
      email: Joi.string().email({ minDomainSegments: 2 }),
      temporaryPassword: Joi.string().required().messages({
        'string.empty': 'Please enter the OTP',
        'any.required': 'OTP is required',
      }),
      password: Joi.string().min(6).required(),
    }).xor('phoneNumber', 'email').messages({
      'object.xor': 'Either email or phoneNumber is required, not both',
    });
    return schema.validate(input);
  },

};
