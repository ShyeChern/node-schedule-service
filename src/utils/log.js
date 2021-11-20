const { createLogger, format, transports } = require('winston');
const { combine, timestamp, errors, colorize, align, printf } = format;

let logger;
/**
 * If not production just show it in console
 */
if (process.env.NODE_ENV !== 'production') {
	logger = createLogger({
		format: combine(
			colorize(),
			timestamp(),
			errors({ stack: true }),
			align(),
			printf((info) => `${info.timestamp} ${info.level} ${info.stack ? info.stack : info.message}`)
		),
		transports: [
			/**
			 * Write all logs in console
			 */
			new transports.Console(),
		],
	});
} else {
	logger = createLogger({
		format: combine(
			colorize(),
			timestamp(),
			errors({ stack: true }),
			align(),
			printf((info) => `${info.timestamp} ${info.stack ? info.stack : info.message}`)
		),
		transports: [
			/**
			 * Write all logs with level `error` to `error.log`
			 * Write all logs with level `info` and below to `info.log`
			 * Write all logs to `combined.log`
			 */
			new transports.File({ filename: './log/error.log', level: 'error' }),
			new transports.File({ filename: './log/info.log', level: 'info' }),
			new transports.File({ filename: './log/combined.log' }),
		],
	});
}

module.exports.errorLog = (error) => {
	logger.error({
		message: error,
	});
};

module.exports.infoLog = (info) => {
	logger.info({
		message: info,
	});
};
