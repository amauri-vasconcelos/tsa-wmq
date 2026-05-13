// n8n Code node
// Mode: Run Once for All Items
// Requires self-hosted n8n with NODE_FUNCTION_ALLOW_BUILTIN=crypto,https

const crypto = require("crypto");
const https = require("https");

const config = {
  tuyaEndpoint: $env.TUYA_ENDPOINT,
  tuyaClientId: $env.TUYA_CLIENT_ID,
  tuyaClientSecret: $env.TUYA_CLIENT_SECRET,
  tuyaDeviceId: $env.TUYA_DEVICE_ID,
  ingestUrl: $env.INGEST_URL,
  ingestSecret: $env.INGEST_SECRET,
};

const statusCodeMap = {
  // Ajuste estes codigos depois de ver o retorno real da Tuya.
  ph: "ph",
  ec: "ec",
  cf: "cf",
  tds: "tds",
  orp: "orp",
  humidity: "humidity",
  temp_current: "temperature",
  temperature: "temperature",
};

function requireConfig() {
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  });
}

function sha256(content = "") {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function hmacSha256Upper(message, secret) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex").toUpperCase();
}

function buildStringToSign(method, pathWithQuery, body = "") {
  return [method.toUpperCase(), sha256(body), "", pathWithQuery].join("\n");
}

function buildTuyaHeaders({ method, pathWithQuery, accessToken, body = "" }) {
  const t = Date.now().toString();
  const stringToSign = buildStringToSign(method, pathWithQuery, body);
  const signSource = accessToken
    ? `${config.tuyaClientId}${accessToken}${t}${stringToSign}`
    : `${config.tuyaClientId}${t}${stringToSign}`;

  return {
    client_id: config.tuyaClientId,
    sign: hmacSha256Upper(signSource, config.tuyaClientSecret),
    t,
    sign_method: "HMAC-SHA256",
    ...(accessToken ? { access_token: accessToken } : {}),
  };
}

function requestJson(url, { method = "GET", headers = {}, body = "" } = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method, headers }, (response) => {
      let responseBody = "";

      response.on("data", (chunk) => {
        responseBody += chunk;
      });

      response.on("end", () => {
        let data = {};

        try {
          data = responseBody ? JSON.parse(responseBody) : {};
        } catch (error) {
          reject(new Error(`Invalid JSON response from ${url}: ${responseBody}`));
          return;
        }

        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          statusCode: response.statusCode,
          data,
        });
      });
    });

    request.on("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function tuyaRequest(method, pathWithQuery, accessToken) {
  const headers = buildTuyaHeaders({ method, pathWithQuery, accessToken });
  const response = await requestJson(`${config.tuyaEndpoint}${pathWithQuery}`, {
    method,
    headers,
  });
  const data = response.data;

  if (!response.ok || data.success === false) {
    throw new Error(`Tuya API error: ${JSON.stringify(data)}`);
  }

  return data;
}

function normalizeStatus(statusList) {
  const reading = {
    deviceId: config.tuyaDeviceId,
    timestamp: new Date().toISOString(),
    source: "n8n-tuya",
    raw: statusList,
  };

  statusList.forEach((item) => {
    const targetKey = statusCodeMap[item.code];

    if (!targetKey) return;

    reading[targetKey] = Number(item.value);
  });

  const required = ["ph", "ec", "cf", "tds", "orp", "humidity", "temperature"];
  const missing = required.filter((key) => !Number.isFinite(reading[key]));

  if (missing.length > 0) {
    throw new Error(
      `Missing mapped metrics: ${missing.join(", ")}. Tuya status was: ${JSON.stringify(statusList)}`,
    );
  }

  return reading;
}

async function sendToIngest(reading) {
  const body = JSON.stringify(reading);
  const response = await requestJson(config.ingestUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body).toString(),
      "x-ingest-secret": config.ingestSecret,
    },
    body,
  });
  const data = response.data;

  if (!response.ok || data.ok === false) {
    throw new Error(`Ingest API error: ${JSON.stringify(data)}`);
  }

  return data;
}

requireConfig();

const tokenPath = "/v1.0/token?grant_type=1";
const tokenResponse = await tuyaRequest("GET", tokenPath);
const accessToken = tokenResponse.result.access_token;

const statusPath = `/v1.0/iot-03/devices/${config.tuyaDeviceId}/status`;
const statusResponse = await tuyaRequest("GET", statusPath, accessToken);
const reading = normalizeStatus(statusResponse.result);
const ingestResponse = await sendToIngest(reading);

return [
  {
    json: {
      ok: true,
      reading,
      ingestResponse,
    },
  },
];
