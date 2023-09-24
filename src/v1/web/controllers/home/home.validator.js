const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {

  validateCreateOrder: (input) => {
    const schema = Joi.object().keys({
      drawId: Joi.objectId().required(),
      data: Joi.array().items(
        Joi.object({
          productId: Joi.objectId().required(),
          quantity: Joi.number().required(),
          items: Joi.array().items(Joi.string()).min(1).required(),
        }),
      ).min(1).required(),
    });

    return schema.validate(input);
  },

};
