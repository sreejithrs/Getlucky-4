const Joi = require('joi');

const accountDetails = {
  email: Joi.string().email({ minDomainSegments: 2 }).required(),
  password: Joi.string().min(8).required(),
};

module.exports = {

  validateSignIn: (input) => {
    const schema = Joi.object().keys({
      ...accountDetails,
    });
    return schema.validate(input);
  },

  validateRegister: (input) => {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      ...accountDetails,
    });
    return schema.validate(input);
  },

  validateSendVerificationCode: (input) => {
    const schema = Joi.object().keys({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
    });
    return schema.validate(input);
  },

  validateVerificationCode: (input) => {
    const schema = Joi.object().keys({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
      verificationCode: Joi.number().required(),
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
      ...accountDetails,
      temporaryPassword: Joi.string().required(),
    });
    return schema.validate(input);
  },

};
