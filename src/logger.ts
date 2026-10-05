import fs from 'node:fs';
import path from 'node:path';
import { config, LogLevel } from './config';

const WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

type Fields = Record<string, unknown>;

const formatters = {
  pretty: (time: string, level: LogLevel, message: string, fields: Fields) => {
    const extra = Object.keys(fields).length > 0 ? ' ' + JSON.stringify(fields) : '';
    return `${time} [${level.toUpperCase()}] ${message}${extra}`;
  },
  json: (time: string, level: LogLevel, message: string, fields: Fields) =>
    JSON.stringify({ time, level, message, ...fields }),
};

fs.mkdirSync(path.dirname(config.log.path), { recursive: true });

function write(level: LogLevel, message: string, fields: Fields = {}): void {
  if (WEIGHT[level] < WEIGHT[config.log.level]) {
    return;
  }
  const line = formatters[config.log.format](new Date().toISOString(), level, message, fields);
  fs.appendFileSync(config.log.path, line + '\n');
  console.log(line);
}

export const logger = {
  debug: (message: string, fields?: Fields) => write('debug', message, fields),
  info: (message: string, fields?: Fields) => write('info', message, fields),
  warn: (message: string, fields?: Fields) => write('warn', message, fields),
  error: (message: string, fields?: Fields) => write('error', message, fields),
};
