const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local');

// models
const { User } = require('../v1/models');

// helpers
const { respondError } = require('./response');
const localesKeys = require('../locales/keys.json');
const StatusCode = require('./statusCodes.json');
const constValues = require('./constants');

// Create local strategy
const localOptions = { usernameField: 'email', passReqToCallback: true };
const localLogin = new LocalStrategy(localOptions, (req, email, password, done) => {
  User.findOne({ email }, (err, user) => {
    if (err) {
      return done(respondError(req.__(localesKeys.global.TRY_AGAIN), StatusCode.FORBIDDEN), false);
    }
    if (!user) {
      return done(respondError(req.__(localesKeys.auth.PLEASE_REGISTER), StatusCode.NOT_FOUND), false);
    }

    user.comparePassword(password, (error, isMatch) => {
      if (error) {
        return done(respondError(req.__(localesKeys.global.TRY_AGAIN), StatusCode.FORBIDDEN), false);
      }
      if (!isMatch) {
        return done(respondError(req.__(localesKeys.auth.WRONG_PASSWORD), StatusCode.CONFLICT), false);
      }
      if (!user.status) {
        return done(respondError(req.__(localesKeys.auth.USER_DEACTIVE), StatusCode.CONFLICT), false);
      }
      if (user.userType === constValues.userType.ADMIN) {
        return done(respondError(req.__(localesKeys.auth.ACCESS_DENIED), StatusCode.FORBIDDEN), false);
      }
      return done(null, user);
    });
    return null;
  });
});

// Setup options for JWT Strategy
const accessTokenAuthOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
};

const refreshTokenAuthOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_REFRESH_SECRET,
  passReqToCallback: true,
};

// Create JWT strategy
const getJWTStrategy = (options) => new JwtStrategy(options, (req, payload, done) => {
  User.findById(payload.userId, async (err, user) => {
    if (err) {
      return done(respondError(req.__(localesKeys.global.TRY_AGAIN), StatusCode.INTERNAL_SERVER_ERROR), false);
    }
    if (user) {
      if (!user.status) {
        return done(respondError(req.__(localesKeys.auth.USER_DEACTIVE), StatusCode.CONFLICT), false);
      }
      return done(null, user);
    }
    return done(respondError(req.__(localesKeys.auth.PLEASE_LOGIN), StatusCode.UNAUTHORIZED), false);
  });
});

// Create JWT strategy
const accessTokenAuth = getJWTStrategy(accessTokenAuthOptions);
const refreshTokenAuth = getJWTStrategy(refreshTokenAuthOptions);

// Tell passport to use this strategy
passport.use(localLogin);
passport.use('accessTokenAuth', accessTokenAuth);
passport.use('refreshTokenAuth', refreshTokenAuth);
