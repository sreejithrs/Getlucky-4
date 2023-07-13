const logger = require('../config/winston.config');
const StatusCode = require('./statusCodes.json');

const respondSuccess = (res, message, statusCode, data) => {
  const codeStatus = (statusCode !== undefined) ? statusCode : StatusCode.OK;
  logger.log('info', `${message}`);
  return res.status(codeStatus).json({
    success: true,
    message: !message ? 'query was successfull' : message,
    data,
  });
};

const respondFailure = (res, message, statusCode, data) => {
  const codeStatus = (statusCode !== undefined) ? statusCode : StatusCode.NOT_FOUND;
  logger.log('info', `${message}`);
  if (!data) {
    return res.status(codeStatus).json({
      success: false,
      message: !message ? 'something went wrong' : message,
    });
  }
  return res.status(codeStatus).json({
    success: false,
    message: !message ? 'something went wrong' : message,
    data,
  });
};

const respondError = (message, statusCode = StatusCode.BAD_REQUEST) => {
  const error = new Error(`${message}`);
  error.status = statusCode;
  logger.log('error', message);
  return error;
};

const urlNotFound = () => {
  logger.log('warn', 'url not found, please check the documentation');
  const error = new Error('url not found, please check the documentation');
  error.status = StatusCode.NOT_FOUND;
  return error;
};

module.exports = {
  respondSuccess,
  respondFailure,
  respondError,
  urlNotFound,
};
