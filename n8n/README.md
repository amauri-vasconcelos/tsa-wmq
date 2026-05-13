# n8n com Docker

## 1. Instalar Docker Desktop

Instale o Docker Desktop para Windows:

```txt
https://www.docker.com/products/docker-desktop/
```

Depois reinicie o PowerShell.

## 2. Configurar variaveis

Copie o arquivo de exemplo:

```powershell
cd C:\VSC\TSA_WMQ\n8n
copy .env.example .env
```

Edite `.env` e preencha:

```txt
TUYA_CLIENT_ID
TUYA_CLIENT_SECRET
TUYA_DEVICE_ID
INGEST_URL
INGEST_SECRET
```

Use o mesmo `INGEST_SECRET` configurado na Vercel.

## 3. Subir o n8n

```powershell
cd C:\VSC\TSA_WMQ\n8n
docker compose up -d
```

Abra:

```txt
http://localhost:5678
```

Login:

```txt
usuario: valor de N8N_BASIC_AUTH_USER
senha: valor de N8N_BASIC_AUTH_PASSWORD
```

## 4. Ver logs

```powershell
docker compose logs -f n8n
```

## 5. Parar

```powershell
docker compose down
```

Os dados do n8n ficam no volume Docker `n8n_data`.

## 6. Criar workflow

No n8n:

1. Crie um workflow.
2. Adicione **Schedule Trigger**.
3. Adicione **Code**.
4. Cole o conteudo de `../docs/n8n-tuya-code-node.js`.
5. Conecte `Schedule Trigger -> Code`.
6. Execute **Test workflow**.
