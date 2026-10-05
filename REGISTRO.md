# Registro — Exercícios 7 a 10

Chave usada nos testes: `sk_test_f4k3c4f3b4b3c0d3` (inventada, tratada como real).

## Exercício 7 — Chaves de API

**Sintoma:** a chave apareceu em três lugares depois do incidente.

**Onde a chave ficava exposta:**

1. No código, como valor padrão (`|| 'sk_live_...'`): quem acessa o repositório lê a chave.
2. Na URL (`&key=...`), que ainda era impressa no `console.log`: ia para o log da aplicação e para os logs de servidor e proxy.
3. Na mensagem de erro, que costuma ir para o monitoramento.

**Hipótese:** o problema é o lugar do valor.

**Correção:** `API_KEY` passou a ser obrigatória e sem valor padrão. A chave vai no header `Authorization: Bearer`. O log e o erro mostram status, cidade e corpo da resposta, e a chave só aparece mascarada com `mask()` (`****c0d3`).

**Por que o padrão é pior que a ausência:** ele funciona e esconde que a configuração está errada. Sem padrão, a falta aparece na subida.

**Validação:**

```
[DEBUG] chamando api de clima {"url":"http://localhost:4010/v1/weather?city=Recife","key":"****c0d3"}
Error: variavel API_KEY ausente ou vazia (veja o .env.example)
{"level":"error","message":"api de clima respondeu com erro","status":401,"city":"Recife","body":"{\"error\":\"invalid credentials\"}"}
```

Um `grep` pela chave nos logs e na saída da API falsa retornou 0 ocorrências.

| Pergunta | Chave no código | Chave no ambiente |
| --- | --- | --- |
| Trocar a chave exige o quê? | Commit, build e deploy, e a antiga fica no histórico | Trocar o valor e reiniciar |
| Quem consegue lê-la? | Quem acessa o repositório | Só quem acessa o servidor |
| Dois ambientes, duas chaves? | Precisa de `if` ou branch | Um `.env` por ambiente |
| O que acontece se vazar? | Fica no histórico para sempre | Revoga e troca o valor |

**Se a chave vazar:** revogar no provedor, gerar outra, atualizar o ambiente e verificar se houve uso indevido.

- *URL x cabeçalho:* URLs são registradas em quase todo log, e o cabeçalho de autorização normalmente não é.
- *Padrão perigoso por funcionar:* ninguém percebe o erro.
- *Mascarar x esconder:* mascarar permite identificar qual chave está em uso sem conseguir usá-la.

## Exercício 8 — Estrutura de projeto

**Sintoma:** `config.port` chegava `undefined` ou como texto, e a config podia ser alterada em execução.

**Hipótese:** o `config.ts` era avaliado antes do `dotenv.config()`.

**Causa:** o import roda antes da primeira linha do `server.ts`, então o `.env` ainda não estava carregado. Além disso, `process.env` é sempre `string | undefined` e cada arquivo convertia o valor de um jeito.

**Correção:** o [src/config.ts](src/config.ts) carrega o `.env`, converte e valida tudo uma vez e exporta um objeto congelado (`Object.freeze` em cada grupo). O tipo `Config` sai do próprio objeto, sem `undefined`. O `db.ts` passou a usar o config.

**Validação:**

```
$ npm run try-mutate
alteracao recusada: Cannot assign to read only property 'host' of object '#<Object>'
typeof config.server.port: number

$ grep -rn "process.env" src scripts
src/config.ts:20, 21 e 46

Error: variavel DB_HOST ausente ou vazia (veja o .env.example)
```

- *`const` x `freeze`:* `const` só impede reatribuir a variável, e `freeze` impede alterar as propriedades.
- *Converter na borda:* um lugar só converte e falha cedo, e o resto do código confia no tipo.

## Exercício 9 — Boas práticas em equipe

**Sintoma:** depois do pull, a aplicação não subia por falta de `PAYMENT_URL`.

**Causa:** a variável foi criada no `.env` de uma pessoa e não entrou no `.env.example`.

**Correção:**

- Remover o `.env` do repositório com `git rm --cached .env` e incluir no `.gitignore`. A chave que foi commitada continua no histórico, então tem que ser revogada.
- Resolver o conflito do `.env.example` mantendo as chaves dos dois lados.
- O [scripts/check-env.ts](scripts/check-env.ts) compara os nomes das chaves e roda antes de subir.
- Toda variável nova entra no `.env.example` no mesmo commit, só com o nome e sem valor real.

**Validação:**

```
$ npm run check-env
variaveis do .env.example que faltam no seu .env:
  - PAYMENT_URL
```

Variável extra só no `.env` local não quebra, e o `.env` não aparece no `git status`.

- *Por que versionar só o exemplo:* o `.env` tem segredo e muda de máquina para máquina.
- *Por que remover o commit não basta:* quem clonou o repositório ainda tem a chave.

## Exercício 10 — Variáveis dinâmicas

**Sintoma:** o log foi criado como `${NODE_ENV}.log` e deu `ENOENT` em produção.

**Causa:** o `dotenv` não expande referências a outras variáveis, e a pasta `logs` não existia.

```
$ node -e "require('dotenv').config();console.log(process.env.LOG_PATH)"
./logs/${NODE_ENV:-development}.log
```

**Correção:** `expand(dotenv.config())` com `dotenv-expand`, padrão `development` para `NODE_ENV` e `mkdirSync` com `recursive`. O caminho é resolvido a partir da raiz do projeto e recusado se sair dela. Nível de log, formato e stack vêm de uma tabela de perfis, sem `if` espalhado.

**Validação:**

```
development: logs/development.log, nível debug, stack na resposta
production:  logs/production.log, nível info, log em JSON, sem stack
sem NODE_ENV: logs/development.log
Error: variavel LOG_PATH aponta para fora do projeto: "../../etc/app.log"
```

- *Por que a expansão não é padrão:* valores com `$` de verdade quebrariam.
- *Ancorar na raiz:* um caminho relativo depende de onde o comando foi rodado.
- *Risco de caminho externo:* gravar arquivos fora do projeto.
