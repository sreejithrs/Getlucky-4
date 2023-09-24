const Joi = require('joi');

module.exports = {

  validateAddProduct: (input) => {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      cost: Joi.number().required(),
      priceAmount: Joi.number().required(),
    });
    return schema.validate(input);
  },

  validateUpdateProduct: (input) => {
    const schema = Joi.object().keys({
      name: Joi.string().optional(),
      cost: Joi.number().optional(),
      priceAmount: Joi.number().optional(),
    });
    return schema.validate(input);
  },

};
