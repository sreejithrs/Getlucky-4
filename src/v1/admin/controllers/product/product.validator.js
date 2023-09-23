const Joi = require('joi');

module.exports = {

  validateAddProduct: (input) => {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      price: Joi.number().required(),
    });
    return schema.validate(input);
  },

};
