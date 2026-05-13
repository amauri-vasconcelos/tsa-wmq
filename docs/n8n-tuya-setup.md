# n8n + Tuya

Este caminho usa n8n local/self-hosted para ficar sem custo recorrente no n8n.

## Opcao recomendada: Docker

Use a configuracao pronta em `n8n/docker-compose.yml`.

```powershell
cd C:\VSC\TSA_WMQ\n8n
copy .env.example .env
docker compose up -d
```

Depois abra:

```txt
http://localhost:5678
```

## Opcao alternativa: npx

### 1. Rodar n8n local

No PowerShell:

```powershell
$env:NODE_FUNCTION_ALLOW_BUILTIN="crypto"
npx n8n
```

Abra:

```txt
http://localhost:5678
```

## 2. Variaveis do n8n

Antes de abrir o n8n, configure as variaveis no mesmo PowerShell:

```powershell
$env:NODE_FUNCTION_ALLOW_BUILTIN="crypto"
$env:TUYA_ENDPOINT="https://openapi.tuyaus.com"
$env:TUYA_CLIENT_ID="SEU_ACCESS_ID"
$env:TUYA_CLIENT_SECRET="SEU_ACCESS_SECRET"
$env:TUYA_DEVICE_ID="SEU_DEVICE_ID"
$env:INGEST_URL="https://SEU_SITE.vercel.app/api/ingest"
$env:INGEST_SECRET="O_MESMO_SEGREDO_DA_VERCEL"
npx n8n
```

Troque `TUYA_ENDPOINT` conforme o data center do seu projeto Tuya:

```txt
America: https://openapi.tuyaus.com
Europe: https://openapi.tuyaeu.com
China: https://openapi.tuyacn.com
India: https://openapi.tuyain.com
```

## 3. Criar workflow

Gere o workflow importavel:

```powershell
cd C:\VSC\TSA_WMQ\n8n
node .\build-tuya-workflow.mjs
```

No n8n, importe:

```txt
C:\VSC\TSA_WMQ\n8n\tuya-workflow.json
```

Se preferir criar manualmente, no n8n:

1. Crie um novo workflow.
2. Adicione um node **Schedule Trigger**.
3. Configure para rodar a cada 5 minutos.
4. Adicione um node **Code**.
5. Em **Mode**, use **Run Once for All Items**.
6. Cole o conteudo de `docs/n8n-tuya-code-node.js`.
7. Conecte Schedule Trigger -> Code.
8. Clique em **Test workflow**.

## 4. Primeiro erro esperado

Na primeira execucao, pode aparecer:

```txt
Missing mapped metrics
```

Isso e normal se os codigos que a Tuya retorna para o YINMIK forem diferentes dos nomes esperados.

O erro vai mostrar algo como:

```json
[
  { "code": "ph_value", "value": 72 },
  { "code": "tds_value", "value": 120 }
]
```

Depois ajuste o objeto `statusCodeMap` no Code node:

```js
const statusCodeMap = {
  ph_value: "ph",
  tds_value: "tds",
  // ...
};
```

## 5. Sobre escala dos valores

Alguns sensores Tuya enviam valores multiplicados, por exemplo:

```txt
pH 7.2 pode vir como 72 ou 720
temperatura 25.4 pode vir como 254
```

Se isso acontecer, ajuste dentro do `normalizeStatus`, por exemplo:

```js
if (targetKey === "ph") reading[targetKey] = Number(item.value) / 10;
else reading[targetKey] = Number(item.value);
```

## 6. Referencias Tuya

- Token: `GET /v1.0/token?grant_type=1`
- Status do device: `GET /v1.0/iot-03/devices/{device_id}/status`
- Assinatura: HMAC-SHA256 com `client_id`, timestamp, `access_token` quando existir, e string da requisicao.
