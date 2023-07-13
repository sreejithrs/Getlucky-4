const { respondError } = require('../helpers/response');
const logger = require('../config/winston.config');
const statusCode = require('../helpers/statusCodes.json');
const { allowedLanguages } = require('../helpers/constants');

module.exports = {

  requireApiKey: (req, _res, next) => {
    const apiKey = req.header('x-api-key');

    if (!apiKey) return next(respondError('x-api-key is required in header', statusCode.FORBIDDEN));
    if (apiKey !== process.env.API_KEY) return next(respondError('invalid api-key', statusCode.FORBIDDEN));

    logger.log('info', JSON.stringify(req.headers));
    logger.log('info', JSON.stringify(req.body));

    if (req.header('Accept-Language')) {
      const language = String(req.header('Accept-Language')).toLowerCase();
      if (allowedLanguages.includes(language)) {
        req.language = language;
      } else {
        req.language = 'en';
      }
    }
    return next();
  },
};
