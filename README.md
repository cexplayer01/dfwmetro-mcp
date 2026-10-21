# dfwmetro-mcp

A local [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for
**[dfwmetro.net](https://dfwmetro.net)** — the Dallas–Fort Worth directory of
genuinely online-bookable service businesses.

Give your AI agent three tools:

| Tool | What it does |
| --- | --- |
| `find_listings` | Search the directory. Every listing is labeled with its verification status; verified businesses rank first with full machine-readable booking data. |
| `find_verified_listings` | Strict search: VERIFIED businesses only — license, registration, and insurance checked by the dfwmetro verification desk. |
| `submit_listing` | Submit a DFW business to the directory. It **must** be genuinely online-bookable (a real date/time scheduling flow — not a quote form, not phone-only). Accepted submissions start as `NOT_YET_VERIFIED` and pass human review. |

## Install in Claude / Cursor (and other MCP clients)

Two ways to connect — no auth, no API key either way:

**Hosted endpoint** — if your client supports remote (Streamable HTTP)
servers, connect it straight to:

```
https://dfwmetro.net/mcp
```

It is also listed in the official MCP Registry as
`io.github.cexplayer01/dfwmetro-directory`, so clients that browse the
registry can find and add it there.

**This repo (stdio bridge)** — if your client only launches local
processes, run this package instead: it speaks stdio to your client and
forwards every call to the hosted endpoint. See **Quick start** below.

## Why this exists

dfwmetro.net hosts the same tools as a stateless HTTP MCP endpoint at
`https://dfwmetro.net/mcp`. Many MCP clients, though, launch a **local process
over stdio**. This server bridges the two: it speaks stdio to your client and
forwards every call to the public endpoint, so tool definitions and validation
rules are always the live ones. No API key, no database, no secrets — it only
ever talks to dfwmetro.net's public machine API.

Requires **Node.js 18+**. Zero dependencies.

## Quick start

```bash
node server.mjs
```

It reads JSON-RPC on stdin and writes responses on stdout — your MCP client
launches it; you don't run it by hand.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dfwmetro": {
      "command": "node",
      "args": ["/path/to/dfwmetro-mcp/server.mjs"]
    }
  }
}
```

### Any other MCP client

Point the client at `node /path/to/dfwmetro-mcp/server.mjs` as a stdio server.

### Prefer the hosted endpoint?

If your client supports remote/HTTP MCP servers, skip this package entirely
and connect straight to:

```
https://dfwmetro.net/mcp
```

Other machine surfaces on dfwmetro.net: `GET /api/bridge/discover` for
discovery JSON, `/llms.txt` for the agent guide, and
`/.well-known/dfwmetro-agent.json` for the agent registry entry.

## Configuration

| Env var | Default | Meaning |
| --- | --- | --- |
| `DFWMETRO_MCP_URL` | `https://dfwmetro.net/mcp` | Override the remote endpoint (testing only). |

## The listing rule

The directory lists only businesses a customer can actually book online:
a real scheduling flow with date/time selection. Quote forms, contact forms,
phone-only businesses, lead aggregators, and login-gated booking do not
qualify and will not survive verification. If you're an agent submitting on
behalf of a business, find its real street address first (website footer,
contact page, or its JSON-LD LocalBusiness block) — it drives the map pin.

## License

MIT — see [LICENSE](LICENSE). The directory data itself is served by
dfwmetro.net under the terms in its `/llms.txt`.
