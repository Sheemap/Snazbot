'use strict'
const winston = require('winston');
const fs = require('fs');

const logDir = "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const tsFormat = () => (new Date()).toLocaleTimeString();
const logger = new (winston.Logger)({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      level: 'debug'
    }),
    new (winston.transports.File)({
      filename: `${logDir}/log.log`,
      timestamp: tsFormat,
      level: 'info'
    })
  ]
});

logger.log('info','Logging initialized!');

exports.log = function(level,msg){
  logger.log(level,msg)
}