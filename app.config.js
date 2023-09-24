const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
require('./src/config/env.config');
const fileUpload = require('express-fileupload');
const winston = require('./src/config/winston.config');
const routes = require('./src/routes');
const i18n = require('./src/config/i18n.config');

// cors options
const corsOptions = {
  origin: '*',
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
expressApp.use(helmet());
expressApp.use(mongoSanitize());
expressApp.use(hpp());
expressApp.use(morgan('combined', { stream: winston.stream }));
expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(bodyParser.json());
expressApp.use(limiter);
expressApp.use(cors(corsOptions));
expressApp.use(i18n.init);
expressApp.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));

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

module.exports = expressApp;
