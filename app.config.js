const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const passport = require('passport');
const tooBusy = require('toobusy-js');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
require('./src/config/env.config');
const fileUpload = require('express-fileupload');
const winston = require('./src/config/winston.config');
const routes = require('./src/routes');
const i18n = require('./src/config/i18n.config');
const userController = require('./src/v1/web/controllers/user/user');
const homeController = require('./src/v1/web/controllers/home/home');
const { urlNotFound } = require('./src/helpers/response');

// cors options
const whitelist = ['http://localhost:7000', 'http://localhost:3000', 'http://localhost:5173', 'https://getlucky4.com', 'https://admin.getlucky4.com'];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  exposedHeaders: 'Content-Type, X-Auth-Token',
  methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
  preflightContinue: false,
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1800,
  standardHeaders: true,
  legacyHeaders: false,
});

// express instance
const expressApp = express();

// eslint-disable-next-line consistent-return
expressApp.use((req, res, next) => {
  if (tooBusy()) {
    return res.status(503).json({
      success: false,
      message: 'Server is too busy, please try again',
    });
  }
  next();
});

// middlewares
expressApp.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'https: data:'],
    },
  }),
);
expressApp.use(mongoSanitize());
expressApp.use(hpp());
expressApp.use(morgan('combined', { stream: winston.stream }));
expressApp.use(cors(corsOptions));
expressApp.use(i18n.init);

// expressApp.post('/stripe-webhooks', express.raw({ type: '*/*' }), homeController.stripeWebhooks);
expressApp.post('/network-webhooks', express.raw({ type: '*/*' }), homeController.networkWebhooks);
expressApp.get('/ticket-view/:id', userController.getTicketView);
expressApp.get('/download-ticket/:id', userController.downloadTicket);
expressApp.get('/invoice/:id', userController.generateInvoice);

expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(bodyParser.json());
expressApp.use(limiter);
expressApp.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
expressApp.use(passport.initialize());

// routes
expressApp.use('/api/v1', routes);

expressApp.use((_req, _res, next) => next(urlNotFound()));

expressApp.use((err, req, res, _next) => {
  const error = err;
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: error.message ? req.__(error.message.replace('Error: ', '')) : err,
  });
});

require('./src/v1/cron');

module.exports = expressApp;
