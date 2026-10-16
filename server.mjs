#!/usr/bin/env node
// dfwmetro-mcp — a local (stdio) MCP server for the dfwmetro.net directory.
//
// dfwmetro.net already hosts a stateless HTTP MCP endpoint at
// https://dfwmetro.net/mcp — but many MCP clients (Claude Desktop and
// friends) speak stdio to a local process. This tiny server bridges the
// two: it exposes the same three tools over stdio and forwards every call
// to the public endpoint, so tool definitions and validation stay in sync
// with the live directory by construction. No API key, no database, no
// secrets — it only ever talks to dfwmetro.net's public machine API.
//
// Tools (served by dfwmetro.net):
//   submit_listing         — submit a genuinely online-bookable DFW business
//   find_listings          — search the directory (verification status labeled)
//   find_verified_listings — strict VERIFIED-only search
//
// Requires Node.js 18+ (built-in fetch). Zero dependencies.

import { createInterface } from "node:readline";

const REMOTE = process.env.DFWMETRO_MCP_URL || "https://dfwmetro.net/mcp";
const SERVER_INFO = { name: "dfwmetro-mcp", version: "1.0.0" };

async function remote(method, params) {
  const res = await fetch(REMOTE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`dfwmetro.net returned HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "remote MCP error");
  return data.result;
}

async function handle(msg) {
  const { id, method, params } = msg;
  if (id === undefined || id === null) return null; // notification: no reply
  try {
    if (method === "initialize") {
      return {
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      };
    }
    if (method === "tools/list") {
      return { id, result: await remote("tools/list", {}) };
    }
    if (method === "tools/call") {
      return { id, result: await remote("tools/call", params) };
    }
    if (method === "ping") return { id, result: {} };
    return {
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    };
  } catch (err) {
    return {
      id,
      error: { code: -32603, message: String(err?.message || err) },
    };
  }
}

const rl = createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return; // not JSON — ignore, per JSON-RPC stream practice
  }
  const reply = await handle(msg);
  if (reply) process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...reply }) + "\n");
});
