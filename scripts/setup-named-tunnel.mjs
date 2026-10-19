#!/usr/bin/env node
/**
 * One-time setup for a stable Cloudflare named tunnel → :5050
 *
 * Requires:
 *   - Cloudflare account
 *   - A domain already on Cloudflare (nameservers at CF)
 *
 * Usage:
 *   npm run parkwise:tunnel:setup -- api.yourdomain.com
 *
 * Then keep API + tunnel up with:
 *   npm run parkwise:zalo
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfDir = path.join(os.homedir(), ".cloudflared");
const repoCfDir = path.join(root, "cloudflared");
const configPath = path.join(repoCfDir, "config.yml");
const statePath = path.join(repoCfDir, "tunnel.json");
const zaloEnv = path.join(root, "frontend/zalo-miniapp/.env");
const tunnelName = process.env.PARKWISE_TUNNEL_NAME || "parkwise-zalo";

const hostname = (process.argv[2] || process.env.PARKWISE_TUNNEL_HOSTNAME || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

function log(msg) {
  console.log(`\n[tunnel-setup] ${msg}`);
}

function die(msg) {
  console.error(`\n[tunnel-setup] ${msg}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: opts.inherit ? "inherit" : "pipe",
    ...opts,
  });
  if (res.status !== 0 && !opts.allowFail) {
    const err = (res.stderr || res.stdout || "").trim();
    die(`${cmd} ${args.join(" ")} failed${err ? `:\n${err}` : ""}`);
  }
  return res;
}

if (!hostname) {
  die(`Missing hostname.

Named tunnels need a domain on your Cloudflare account.

  npm run parkwise:tunnel:setup -- api.yourdomain.com

Example: api.parkwise.vn  or  parkwise-api.example.com`);
}

const cf = spawnSync("cloudflared", ["--version"], { encoding: "utf8" });
if (cf.status !== 0) {
  die("cloudflared not found. Install: brew install cloudflare/cloudflare/cloudflared");
}

fs.mkdirSync(repoCfDir, { recursive: true });
fs.mkdirSync(cfDir, { recursive: true });

const certPem = path.join(cfDir, "cert.pem");
if (!fs.existsSync(certPem)) {
  log("Opening browser to login Cloudflare (select the zone for your domain)…");
  run("cloudflared", ["tunnel", "login"], { inherit: true });
  if (!fs.existsSync(certPem)) {
    die("Login did not create ~/.cloudflared/cert.pem — try again.");
  }
} else {
  log("Already logged in (~/.cloudflared/cert.pem).");
}

let tunnelId = "";
const list = run("cloudflared", ["tunnel", "list"], { allowFail: true });
const listOut = `${list.stdout || ""}\n${list.stderr || ""}`;
const existing = listOut
  .split("\n")
  .find((line) => line.includes(tunnelName));
if (existing) {
  tunnelId = existing.trim().split(/\s+/)[0];
  log(`Reusing tunnel "${tunnelName}" (${tunnelId}).`);
} else {
  log(`Creating tunnel "${tunnelName}"…`);
  const created = run("cloudflared", ["tunnel", "create", tunnelName]);
  const out = `${created.stdout || ""}\n${created.stderr || ""}`;
  const idMatch = out.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  if (!idMatch) die(`Could not parse tunnel UUID from:\n${out}`);
  tunnelId = idMatch[1];
  log(`Created ${tunnelId}`);
}

const credFile = path.join(cfDir, `${tunnelId}.json`);
if (!fs.existsSync(credFile)) {
  die(`Missing credentials file: ${credFile}`);
}

log(`Routing DNS ${hostname} → tunnel…`);
run("cloudflared", ["tunnel", "route", "dns", tunnelName, hostname], {
  inherit: true,
  allowFail: true,
});

const config = `tunnel: ${tunnelId}
credentials-file: ${credFile}

ingress:
  - hostname: ${hostname}
    service: http://127.0.0.1:5050
  - service: http_status:404
`;
fs.writeFileSync(configPath, config);
fs.writeFileSync(
  statePath,
  JSON.stringify(
    {
      name: tunnelName,
      id: tunnelId,
      hostname,
      url: `https://${hostname}`,
      config: path.relative(root, configPath),
    },
    null,
    2,
  ) + "\n",
);

let envText = fs.existsSync(zaloEnv) ? fs.readFileSync(zaloEnv, "utf8") : "";
const apiUrl = `https://${hostname}`;
if (/^VITE_API_URL=/m.test(envText)) {
  envText = envText.replace(/^VITE_API_URL=.*$/m, `VITE_API_URL=${apiUrl}`);
} else {
  envText = `VITE_API_URL=${apiUrl}\n${envText}`;
}
fs.writeFileSync(zaloEnv, envText.endsWith("\n") ? envText : `${envText}\n`);

log("Done.");
console.log(`
  Stable URL:  ${apiUrl}
  Config:      ${path.relative(root, configPath)}
  State:       ${path.relative(root, statePath)}

  Run (API + named tunnel):
    npm run parkwise:zalo

  Redeploy Mini App once so the phone uses the new API URL:
    npm run parkwise:zalo:deploy
`);
