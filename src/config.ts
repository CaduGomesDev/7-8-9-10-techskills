import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';

function findProjectRoot(start: string): string {
  let dir = start;
  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error('package.json nao encontrado a partir de ' + start);
    }
    dir = parent;
  }
  return dir;
}

const projectRoot = findProjectRoot(__dirname);

if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === '') {
  process.env.NODE_ENV = 'development';
}

expand(dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true }));

const ENVIRONMENTS = ['development', 'production'] as const;
type Environment = (typeof ENVIRONMENTS)[number];

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

type LogFormat = 'pretty' | 'json';

interface EnvironmentProfile {
  logLevel: LogLevel;
  logFormat: LogFormat;
  exposeErrorStack: boolean;
}

const PROFILES: Record<Environment, EnvironmentProfile> = {
  development: { logLevel: 'debug', logFormat: 'pretty', exposeErrorStack: true },
  production: { logLevel: 'info', logFormat: 'json', exposeErrorStack: false },
};

function readOptional(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

function requiredString(name: string): string {
  const value = readOptional(name);
  if (value === undefined) {
    throw new Error(`variavel ${name} ausente ou vazia (veja o .env.example)`);
  }
  return value;
}

function requiredPort(name: string, fallback: number): number {
  const raw = readOptional(name);
  if (raw === undefined) {
    return fallback;
  }
  if (!/^\d+$/.test(raw)) {
    throw new Error(`variavel ${name} invalida: "${raw}" nao e um numero inteiro`);
  }
  const port = Number(raw);
  if (port < 1 || port > 65535) {
    throw new Error(`variavel ${name} fora da faixa 1-65535: ${port}`);
  }
  return port;
}

function requiredUrl(name: string): string {
  const value = requiredString(name);
  try {
    new URL(value);
  } catch {
    throw new Error(`variavel ${name} nao e uma URL valida: "${value}"`);
  }
  return value.replace(/\/+$/, '');
}

function oneOf<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = readOptional(name) ?? fallback;
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`variavel ${name} invalida: "${value}" (aceitos: ${allowed.join(', ')})`);
  }
  return value as T;
}

function logFilePath(name: string, env: Environment): string {
  const raw = readOptional(name) ?? `./logs/${env}.log`;
  if (raw.includes('${')) {
    throw new Error(`variavel ${name} nao foi expandida: "${raw}"`);
  }
  const resolved = path.resolve(projectRoot, raw);
  const relative = path.relative(projectRoot, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`variavel ${name} aponta para fora do projeto: "${raw}"`);
  }
  return resolved;
}

const env = oneOf('NODE_ENV', ENVIRONMENTS, 'development');
const profile = PROFILES[env];

export const config = Object.freeze({
  env,
  projectRoot,
  server: Object.freeze({
    port: requiredPort('PORT', 3000),
    exposeErrorStack: profile.exposeErrorStack,
  }),
  db: Object.freeze({
    host: requiredString('DB_HOST'),
    port: requiredPort('DB_PORT', 5432),
  }),
  weather: Object.freeze({
    baseUrl: requiredUrl('WEATHER_API_URL'),
    apiKey: requiredString('API_KEY'),
  }),
  payment: Object.freeze({
    url: requiredUrl('PAYMENT_URL'),
  }),
  log: Object.freeze({
    path: logFilePath('LOG_PATH', env),
    level: oneOf('LOG_LEVEL', LOG_LEVELS, profile.logLevel),
    format: profile.logFormat,
  }),
});

export type Config = typeof config;
export type { Environment, LogLevel, LogFormat };
