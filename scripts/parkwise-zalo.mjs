#!/usr/bin/env node
/**
 * One terminal for Zalo Mini App local backend:
 *   API :5050  +  Cloudflare HTTPS tunnel
 *
 * Prefers named tunnel when cloudflared/config.yml exists
 * (see: npm run parkwise:tunnel:setup -- api.yourdomain.com).
 * Falls back to quick tunnel (trycloudflare.com).
 *
 * Then (only when you need a new phone build):
 *   npm run parkwise:zalo:deploy
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, "frontend/zalo-miniapp/.env");
const namedConfig = path.join(root, "cloudflared/config.yml");
const namedState = path.join(root, "cloudflared/tunnel.json");
const children = [];

function log(msg) {
  console.log(`\n[parkwise-zalo] ${msg}`);
}

function updateViteApiUrl(url) {
  let text = "";
  if (fs.existsSync(envPath)) text = fs.readFileSync(envPath, "utf8");
  if (/^VITE_API_URL=/m.test(text)) {
    text = text.replace(/^VITE_API_URL=.*$/m, `VITE_API_URL=${url}`);
  } else {
    text = `VITE_API_URL=${url}\n${text}`;
  }
  fs.writeFileSync(envPath, text.endsWith("\n") ? text : `${text}\n`);
  log(`Updated ${path.relative(root, envPath)} → VITE_API_URL=${url}`);
}

function printDeployHint() {
  log("Keep THIS terminal open.");
  log("Phone build (other terminal, only when needed):");
  console.log(`
  cd frontend/zalo-miniapp
  zmp login --app-id 3804607974416934390   # if session expired
  npm run zmp:deploy                       # scan QR in that terminal
`);
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function startApi() {
  log("Starting API on :5050 …");
  const api = spawn("npm", ["run", "dev"], {
    cwd: path.join(root, "backend/parkwise-sqlite"),
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  children.push(api);
  api.stdout.on("data", (buf) => process.stdout.write(buf));
  api.stderr.on("data", (buf) => process.stderr.write(buf));
  api.on("exit", (code) => {
    if (code) log(`API exited (${code})`);
  });
}

function startNamedTunnel() {
  let hostname = "";
  try {
    const state = JSON.parse(fs.readFileSync(namedState, "utf8"));
    hostname = state.hostname || "";
    if (state.url) updateViteApiUrl(state.url);
  } catch {
    // config.yml alone is enough to run
  }

  log(
    hostname
      ? `Starting named tunnel → https://${hostname}`
      : "Starting named tunnel (cloudflared/config.yml) …",
  );

  const bin = process.env.CLOUDFLARED_BIN || "cloudflared";
  const tunnel = spawn(
    bin,
    ["tunnel", "--config", namedConfig, "run"],
    {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    },
  );
  children.push(tunnel);

  tunnel.stdout.on("data", (buf) => process.stdout.write(buf));
  tunnel.stderr.on("data", (buf) => process.stdout.write(buf));
  tunnel.on("exit", (code) => {
    if (code) log(`Named tunnel exited (${code}) — restart with npm run parkwise:zalo`);
    shutdown();
  });

  printDeployHint();
}

function startQuickTunnel() {
  log("No named tunnel config — using quick tunnel (URL may expire).");
  log("For a stable URL: npm run parkwise:tunnel:setup -- api.yourdomain.com");

  const tunnel = spawn(
    "npx",
    ["--yes", "cloudflared", "tunnel", "--url", "http://127.0.0.1:5050"],
    {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    },
  );
  children.push(tunnel);

  let tunnelUrl = "";
  function onTunnelChunk(buf) {
    const text = buf.toString();
    process.stdout.write(text);
    if (tunnelUrl) return;
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (!match) return;
    tunnelUrl = match[0];
    updateViteApiUrl(tunnelUrl);
    printDeployHint();
  }

  tunnel.stdout.on("data", onTunnelChunk);
  tunnel.stderr.on("data", onTunnelChunk);
  tunnel.on("exit", (code) => {
    if (code) log(`Tunnel exited (${code})`);
    shutdown();
  });
}

startApi();
await new Promise((r) => setTimeout(r, 1200));

if (fs.existsSync(namedConfig)) {
  startNamedTunnel();
} else {
  startQuickTunnel();
}
