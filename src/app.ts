import express, { NextFunction, Request, Response } from 'express';
import { config } from './config';
import { connection } from './db';
import { logger } from './logger';
import { getWeather, WeatherApiError } from './weather';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.env, db: connection.address });
});

app.get('/weather', async (req, res, next) => {
  try {
    const city = String(req.query.city ?? '');
    if (city === '') {
      res.status(400).json({ error: 'informe ?city=' });
      return;
    }
    res.json(await getWeather(city));
  } catch (err) {
    next(err);
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof WeatherApiError ? 502 : 500;
  logger.error('erro na requisicao', { message: err.message });
  res.status(status).json({
    error: err.message,
    ...(config.server.exposeErrorStack ? { stack: err.stack } : {}),
  });
});

app.listen(config.server.port, () => {
  logger.info('aplicacao iniciada', {
    env: config.env,
    port: config.server.port,
    logLevel: config.log.level,
    logPath: config.log.path,
  });
});
