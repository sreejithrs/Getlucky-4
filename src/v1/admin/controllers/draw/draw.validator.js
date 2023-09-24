const Joi = require('joi');

module.exports = {

  validateCreateDraw: (input) => {
    const schema = Joi.object().keys({
      drawName: Joi.string().required(),
      date: Joi.date().required(),
    });
    return schema.validate(input);
  },

};
