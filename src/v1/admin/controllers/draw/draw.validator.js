const Joi = require('joi');

module.exports = {

  validateCreateDraw: (input) => {
    const schema = Joi.object().keys({
      date: Joi.date().required(),
    });
    return schema.validate(input);
  },

  validateUpdateDraw: (input) => {
    const schema = Joi.object().keys({
      drawId: Joi.string().required(),
      status: Joi.boolean().required(),
      ticketNumber: Joi.string().optional().allow(''),
      link: Joi.string().optional().allow(''),
    });
    return schema.validate(input);
  },

};
