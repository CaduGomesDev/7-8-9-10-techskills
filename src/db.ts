import { config } from './config';

export interface Connection {
  address: string;
  connectedAt: Date;
}

function connect(address: string): Connection {
  return { address, connectedAt: new Date() };
}

export const connection = connect(`${config.db.host}:${config.db.port}`);
