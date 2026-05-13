# Integracao Tuya gratuita

Objetivo: manter tudo sem custo recorrente enquanto o volume for pequeno.

## O que fica free

- Site: Vercel Hobby.
- Banco historico: Firebase Spark/Firestore, dentro das cotas gratuitas.
- Automacao: n8n self-hosted no seu computador ou em uma maquina sua.

## Atencao sobre Tuya

A parte Tuya Cloud pode ter trial/cota limitada conforme a conta e o projeto. Para comecar sem custo, use o projeto Cloud Development da Tuya. Para uso permanente totalmente free, a alternativa e tentar leitura local com Home Assistant/LocalTuya ou TuyaLocal, mas depende do dispositivo expor os dados localmente.

## Fluxo recomendado

```txt
YINMIK/Tuya
  -> n8n local consulta Tuya Cloud API
  -> n8n normaliza os valores
  -> POST https://SEU_SITE.vercel.app/api/ingest
  -> Firebase Firestore
  -> Site exibe historico
```

## Variaveis na Vercel

Configure em Vercel > Project Settings > Environment Variables:

```txt
INGEST_SECRET=um-segredo-grande
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Tambem pode usar em vez do JSON completo:

```txt
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
INGEST_SECRET=
```

## Payload que o n8n deve enviar

POST para:

```txt
https://SEU_SITE.vercel.app/api/ingest
```

Header:

```txt
x-ingest-secret: mesmo_valor_do_INGEST_SECRET
content-type: application/json
```

Body:

```json
{
  "deviceId": "tuya-yinmik-1",
  "timestamp": "2026-05-12T13:00:00-03:00",
  "ph": 7.2,
  "ec": 0.24,
  "cf": 2.4,
  "tds": 120,
  "orp": 295,
  "humidity": 61.5,
  "temperature": 25.8,
  "raw": {}
}
```

## Dados da Tuya que voce precisa

No Tuya IoT Platform:

```txt
TUYA_CLIENT_ID / Access ID
TUYA_CLIENT_SECRET / Access Secret
TUYA_DEVICE_ID
TUYA_ENDPOINT
```

Endpoints comuns:

```txt
https://openapi.tuyaus.com
https://openapi.tuyaeu.com
https://openapi.tuyacn.com
https://openapi.tuyain.com
```

Use o endpoint do data center escolhido no projeto Tuya.

## n8n free local

No PowerShell:

```powershell
$env:NODE_FUNCTION_ALLOW_BUILTIN="crypto"
npx n8n
```

Abra:

```txt
http://localhost:5678
```

Workflow:

```txt
Schedule Trigger
  -> HTTP Request: token Tuya
  -> HTTP Request: status do device Tuya
  -> Code: mapear status Tuya para ph/ec/cf/tds/orp/humidity/temperature
  -> HTTP Request: POST /api/ingest
```

## Proximo passo

Quando voce tiver `Access ID`, `Access Secret`, `Device ID` e o data center da Tuya, o workflow do n8n pode ser montado com os nomes reais que aparecem no status do sensor.
