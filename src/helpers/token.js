// node modules
const jwt = require('jsonwebtoken');

const getJWTToken = (userId, expireInSeconds, secret) => {
  const options = expireInSeconds ? { expiresIn: expireInSeconds } : {};
  return jwt.sign({ userId }, secret, options);
};

module.exports = {

  getAuthTokens: (userId, isRefresh) => ({
    // eslint-disable-next-line radix
    accessToken: getJWTToken(userId, parseInt(process.env.JWT_EXPIRE_SECONDS), process.env.JWT_SECRET),
    refreshToken: isRefresh ? null : getJWTToken(userId, null, process.env.JWT_REFRESH_SECRET),
  }),

};
