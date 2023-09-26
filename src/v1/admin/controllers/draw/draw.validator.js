const Joi = require('joi');

module.exports = {

  validateCreateDraw: (input) => {
    const schema = Joi.object().keys({
      drawName: Joi.string().required(),
      date: Joi.date().required(),
    });
    return schema.validate(input);
  },

  validateUpdateDraw: (input) => {
    const schema = Joi.object().keys({
      drawId: Joi.string().required(),
      drawStatus: Joi.boolean().required(),
      ticketNumber: Joi.string().optional().allow(''),
    });
    return schema.validate(input);
  },

};
