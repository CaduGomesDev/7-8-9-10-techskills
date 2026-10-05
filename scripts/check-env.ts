import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const examplePath = path.join(root, '.env.example');
const envPath = path.join(root, '.env');

function keys(file: string): string[] {
  return fs
    .readFileSync(file, 'utf-8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => line.replace(/^export\s+/, '').split('=')[0].trim())
    .filter((key) => key !== '');
}

if (!fs.existsSync(envPath)) {
  console.error('arquivo .env nao encontrado.');
  console.error('rode: cp .env.example .env  e preencha os valores.');
  process.exit(1);
}

const local = new Set(keys(envPath));
const missing = keys(examplePath).filter((key) => !local.has(key));

if (missing.length > 0) {
  console.error('variaveis do .env.example que faltam no seu .env:');
  for (const key of missing) {
    console.error(`  - ${key}`);
  }
  console.error('copie as linhas do .env.example e preencha antes de subir a aplicacao.');
  process.exit(1);
}

console.log(`.env ok: ${local.size} variaveis, nenhuma faltando em relacao ao .env.example`);
