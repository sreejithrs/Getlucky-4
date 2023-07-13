const chalk = require('chalk');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const logger = require('../config/winston.config');

mongoose.Promise = bluebird;

mongoose.connection.on('connected', () => {
  logger.log('info', chalk.blue('MongoDB is connected'));
});

mongoose.connection.on('error', (err) => {
  logger.log('error', chalk.red(`Could not connect to MongoDB because of ${err}`));
  process.exit(-1);
});

const mongooseConnect = () => {
  if (!process.env.DB_URL) {
    logger.log('error', chalk.red('DB_URL is missing!'));
    process.exit(-1);
  }

  mongoose.connect(process.env.DB_URL, {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return mongoose.connection;
};

module.exports = mongooseConnect;
