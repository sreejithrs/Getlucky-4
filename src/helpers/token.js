// node modules
const jwt = require('jsonwebtoken');
const { User } = require('../v1/models');
const commonService = require('../v1/services/common.service');

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

  updateUserData: async (req, user) => {
    const language = req.header('Accept-Language') ? String(req.header('Accept-Language')).toLowerCase() : 'en';
    await commonService.updateById(User, user._id, { $set: { language } });
  },

};
