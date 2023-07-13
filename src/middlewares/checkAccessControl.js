const { respondFailure } = require('../helpers/response');
const statusCode = require('../helpers/statusCodes.json');
const localeKeys = require('../locales/keys.json');
const constValues = require('../helpers/constants');

module.exports = {

  adminAllowed: (req, res, next) => {
    if (req.user.userType !== constValues.userType.ADMIN) {
      return respondFailure(res, req.__(localeKeys.auth.ACCESS_DENIED), statusCode.FORBIDDEN);
    }
    return next();
  },

  userAllowed: (req, res, next) => {
    if (req.user.userType !== constValues.userType.USER) {
      return respondFailure(res, req.__(localeKeys.auth.ACCESS_DENIED), statusCode.FORBIDDEN);
    }
    return next();
  },

};
