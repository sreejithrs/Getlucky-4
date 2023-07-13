const http = require('http');
const chalk = require('chalk');
const mongooseConnect = require('./src/database/mongoose');
const expressApp = require('./app.config');
const winston = require('./src/config/winston.config');

global.logger = winston.log;

// server setup
const port = process.env.PORT || 7000;
const server = http.createServer(expressApp);

server.listen(port, (err) => {
  if (err) {
    winston.log('error', chalk.red(`Error : ${err}`));
    process.exit(-1);
  }
  // connecting only if the app was success
  mongooseConnect();
  winston.log('info', chalk.blue(`${process.env.APP} is running on ${port}`));
});

module.exports = server;
