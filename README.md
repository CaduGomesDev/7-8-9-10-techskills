# Exercícios 7 a 10 — Configuração de ambiente

Chave de API, módulo de configuração, `.env.example` e variáveis dinâmicas em Node.js e TypeScript.

## Rodar

```
npm install
cp .env.example .env
npm run dev
```

Preencha `API_KEY` no `.env` com um valor de teste. Antes de subir, o `check-env` confere se não falta nenhuma variável do `.env.example`.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | sobe em development |
| `npm run start:prod` | sobe em production |
| `npm run check-env` | compara `.env` com `.env.example` |
| `npm run try-mutate` | tenta alterar a config em execução |
| `npm run fake-api -- <chave> 4010` | API de clima falsa para testes |

O registro de cada exercício está em [REGISTRO.md](REGISTRO.md).
