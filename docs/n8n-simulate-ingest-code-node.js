// n8n Code node
// Mode: Run Once for All Items
// Requires self-hosted n8n with NODE_FUNCTION_ALLOW_BUILTIN=https

const https = require("https");

const config = {
  ingestUrl: $env.INGEST_URL,
  ingestSecret: $env.INGEST_SECRET,
};

function requireConfig() {
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  });
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

function createSimulatedReading() {
  const now = new Date();
  const minuteWave = Math.sin(now.getMinutes() / 60 * Math.PI * 2);

  return {
    deviceId: "tuya-yinmik-simulado",
    timestamp: now.toISOString(),
    ph: Number((6.9 + minuteWave * 0.25).toFixed(2)),
    ec: Number((0.82 + minuteWave * 0.08).toFixed(2)),
    cf: Number((8.2 + minuteWave * 0.8).toFixed(1)),
    tds: Math.round(410 + minuteWave * 35),
    orp: Math.round(285 + minuteWave * 18),
    humidity: Number((62 + minuteWave * 4).toFixed(1)),
    temperature: Number((25.4 + minuteWave * 1.2).toFixed(1)),
    source: "n8n-simulation",
    raw: {
      simulated: true,
      note: "Manual n8n ingest test",
    },
  };
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

  if (!response.ok || response.data.ok === false) {
    throw new Error(`Ingest API error: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

requireConfig();

const reading = createSimulatedReading();
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
