const winston = require('winston');

// Create a null transport that does nothing
const nullTransport = new winston.transports.Console({
  silent: true,
});

// Create normal transports for non-test environment
const normalTransports = [
  // Write all logs to console
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
  // Write all logs with level 'info' and below to combined.log
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  // Write all errors to error.log
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

// Choose transports based on environment
const transports = process.env.NODE_ENV === 'test' ? [nullTransport] : normalTransports;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: transports,
});

module.exports = logger;
