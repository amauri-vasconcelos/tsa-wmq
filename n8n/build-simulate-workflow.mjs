import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = process.argv[2] || "simulate-ingest-workflow.json";
const codePath = join(scriptDir, "..", "docs", "n8n-simulate-ingest-code-node.js");
const code = readFileSync(codePath, "utf8");

const workflow = {
  id: "96f18424-b09a-4dfb-8c6b-f1f9f40e4d45",
  name: "Simular leitura para Firebase",
  active: false,
  nodes: [
    {
      parameters: {},
      id: "manual-simulated-reading",
      name: "Executar manualmente",
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [260, 300],
    },
    {
      parameters: {
        mode: "runOnceForAllItems",
        jsCode: code,
      },
      id: "code-simulated-ingest",
      name: "Enviar leitura simulada",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [560, 300],
    },
  ],
  connections: {
    "Executar manualmente": {
      main: [
        [
          {
            node: "Enviar leitura simulada",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
  },
  settings: {
    executionOrder: "v1",
  },
};

const resolvedOutputPath = join(scriptDir, outputPath);
writeFileSync(resolvedOutputPath, `${JSON.stringify(workflow, null, 2)}\n`);
console.log(`Workflow gerado em ${resolvedOutputPath}`);
