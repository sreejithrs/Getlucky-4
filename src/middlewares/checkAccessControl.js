const passport = require('passport');

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

  checkAccessToken: (req, res, next) => {
    passport.authenticate('accessTokenAuth', { session: false }, (_err, user) => {
      if (user) {
        req.user = user;
        req.isAuthenticatedRoute = true;
      } else {
        req.isAuthenticatedRoute = false;
      }
      next();
    })(req, res, next);
  },

};
