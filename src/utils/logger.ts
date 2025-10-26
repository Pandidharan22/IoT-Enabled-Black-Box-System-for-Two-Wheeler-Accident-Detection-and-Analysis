import winston from 'winston';
import config from '../config';

const { format, transports } = winston;

export const createLogger = (module: string) => {
  return winston.createLogger({
    level: config.LOG_LEVEL,
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { module },
    transports: [
      // Console transport for all environments
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, module, ...meta }) => {
            return `${timestamp} [${level}] [${module}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          })
        ),
      }),
      // File transport for production
      ...(config.NODE_ENV === 'production'
        ? [
            new transports.File({
              filename: 'logs/error.log',
              level: 'error',
            }),
            new transports.File({
              filename: 'logs/combined.log',
            }),
          ]
        : []),
    ],
  });
};

// Export default logger for general use
export default createLogger('app');