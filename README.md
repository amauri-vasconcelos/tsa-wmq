# TSA WMQ

Painel inicial para monitoramento de qualidade da agua com sensor YINMIK/Tuya, Firebase e n8n.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereco exibido no terminal, normalmente `http://localhost:5173`.

## Firebase

1. Crie um projeto em https://console.firebase.google.com.
2. Ative o Firestore Database.
3. Crie um app Web no Firebase.
4. Copie `.env.example` para `.env`.
5. Preencha as variaveis `VITE_FIREBASE_*`.

Estrutura sugerida no Firestore:

```txt
devices/{deviceId}
  name
  tuyaDeviceId
  location
  createdAt

devices/{deviceId}/readings/{readingId}
  timestamp
  ph
  ec
  cf
  tds
  orp
  humidity
  temperature
  raw
  source
```

## n8n + Tuya

Workflow recomendado:

```txt
Schedule Trigger
  -> HTTP Request para Tuya Cloud API
  -> Function/Set para normalizar ph, tds, ec, temperature e orp
  -> HTTP Request ou Firebase node para gravar no Firestore
```

Guarde `Access ID`, `Access Secret` e `Device ID` no n8n, nunca no frontend.

## Vercel

1. Suba este projeto para um repositorio no GitHub.
2. Importe o repositorio em https://vercel.com.
3. Configure as mesmas variaveis `VITE_FIREBASE_*` em Project Settings > Environment Variables.
4. Deploy.
