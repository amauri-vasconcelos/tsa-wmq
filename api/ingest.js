import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const requiredMetrics = [
  "ph",
  "ec",
  "cf",
  "tds",
  "orp",
  "humidity",
  "temperature",
];

function getFirebaseCredentials() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(getFirebaseCredentials()),
    });
  }

  return getFirestore();
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function normalizeReading(payload) {
  const reading = {
    deviceId: String(payload.deviceId || "tuya-yinmik-1"),
    timestamp: payload.timestamp || new Date().toISOString(),
    ph: Number(payload.ph),
    ec: Number(payload.ec),
    cf: Number(payload.cf),
    tds: Number(payload.tds),
    orp: Number(payload.orp),
    humidity: Number(payload.humidity),
    temperature: Number(payload.temperature),
    raw: payload.raw || null,
    source: payload.source || "n8n-tuya",
  };

  const invalidMetric = requiredMetrics.find(
    (metric) => !Number.isFinite(reading[metric]),
  );

  if (invalidMetric) {
    throw new Error(`Invalid metric: ${invalidMetric}`);
  }

  return reading;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const expectedSecret = process.env.INGEST_SECRET;
  const receivedSecret = request.headers["x-ingest-secret"];

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    response.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const payload = await readBody(request);
    const reading = normalizeReading(payload);
    const db = getDb();
    const docRef = db
      .collection("devices")
      .doc(reading.deviceId)
      .collection("readings")
      .doc();

    await docRef.set({
      ...reading,
      createdAt: Timestamp.now(),
    });

    response.status(200).json({ ok: true, id: docRef.id });
  } catch (error) {
    response.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
}
