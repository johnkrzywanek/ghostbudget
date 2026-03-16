import winston from 'winston';

const nullTransport = new winston.transports.Console({
    silent: true,
});

const normalTransports: winston.transport[] = [
    new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10485760,
        maxFiles: 5,
    }),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10485760,
        maxFiles: 5,
    }),
];

const transports = process.env.NODE_ENV === 'test' ? [nullTransport] : normalTransports;

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports,
});

export default logger;
