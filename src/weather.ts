import { config } from './config';
import { logger } from './logger';
import { mask } from './secrets';

export class WeatherApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`falha na API de clima: ${status}`);
    this.name = 'WeatherApiError';
  }
}

export async function getWeather(city: string): Promise<unknown> {
  const url = new URL(config.weather.baseUrl + '/weather');
  url.searchParams.set('city', city);

  logger.debug('chamando api de clima', { url: url.toString(), key: mask(config.weather.apiKey) });

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.weather.apiKey}` },
  });

  if (!response.ok) {
    const body = (await response.text()).split(config.weather.apiKey).join('[redacted]').slice(0, 500);
    logger.error('api de clima respondeu com erro', { status: response.status, city, body });
    throw new WeatherApiError(response.status, body);
  }

  return response.json();
}
