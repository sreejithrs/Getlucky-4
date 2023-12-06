const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const passport = require('passport');
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

// cors options
const whitelist = ['http://localhost:7000', '157.241.71.196', 'https://api.getlucky4.com', 'https://getlucky4.com'];
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

expressApp.post('/stripe-webhooks', express.raw({ type: '*/*' }), homeController.webhooks);
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
