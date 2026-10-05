import { config } from '../src/config';

const before = config.db.host;

try {
  (config.db as { host: string }).host = 'localhost-alterado';
  console.log('alteracao aceita, isso nao deveria acontecer');
} catch (err) {
  console.log('alteracao recusada:', (err as Error).message);
}

console.log('config.db.host antes:', before, '| depois:', config.db.host);
console.log('config congelado:', Object.isFrozen(config), '| config.db congelado:', Object.isFrozen(config.db));
console.log('typeof config.server.port:', typeof config.server.port);
