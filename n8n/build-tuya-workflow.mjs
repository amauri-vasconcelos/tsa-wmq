import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = process.argv[2] || "tuya-workflow.json";
const codePath = join(scriptDir, "..", "docs", "n8n-tuya-code-node.js");
const code = readFileSync(codePath, "utf8");

const workflow = {
  id: "9a80fd0d-d352-4678-84a8-9e8708da8a91",
  name: "Tuya YINMIK para Firebase",
  active: false,
  nodes: [
    {
      parameters: {
        rule: {
          interval: [
            {
              field: "minutes",
              minutesInterval: 5,
            },
          ],
        },
      },
      id: "schedule-tuya",
      name: "A cada 5 minutos",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: [260, 300],
    },
    {
      parameters: {
        mode: "runOnceForAllItems",
        jsCode: code,
      },
      id: "code-tuya-ingest",
      name: "Ler Tuya e enviar ao Firebase",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [560, 300],
    },
  ],
  connections: {
    "A cada 5 minutos": {
      main: [
        [
          {
            node: "Ler Tuya e enviar ao Firebase",
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
