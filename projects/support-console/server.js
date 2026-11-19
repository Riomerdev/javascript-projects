import http from "node:http";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");
const port = Number(process.env.PORT || 3000);
const workspaceKey = process.env.SUPPORT_WORKSPACE_KEY || "";
const sessions = new Set();
const rateLimits = new Map();
const messageFile = path.join(dataDir, "messages.jsonl");
const staticFiles = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"]
};

function safeEqual(left, right) {
  const a = Buffer.from(left || "");
  const b = Buffer.from(right || "");
  return a.length === b.length && timingSafeEqual(a, b);
}

function cookieToken(request) {
  const cookies = request.headers.cookie || "";
  const pair = cookies.split(";").map(value => value.trim()).find(value => value.startsWith("support_session="));
  return pair ? decodeURIComponent(pair.split("=")[1]) : "";
}

function send(response, status, value, headers = {}) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(value));
}

async function readBody(request, maxBytes = 4096) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("request too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function history(limit = 100) {
  try {
    const lines = (await readFile(messageFile, "utf8")).trim().split("\n").filter(Boolean);
    return lines.slice(-limit).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  } catch { return []; }
}

await mkdir(dataDir, { recursive: true });
const wss = new WebSocketServer({ noServer: true });
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    if (request.method === "POST" && url.pathname === "/api/session") {
      if (!workspaceKey) return send(response, 503, { error: "Configure SUPPORT_WORKSPACE_KEY first" });
      const body = JSON.parse(await readBody(request));
      if (!safeEqual(body.key, workspaceKey)) return send(response, 401, { error: "Invalid workspace key" });
      const token = randomUUID();
      sessions.add(token);
      return send(response, 200, { ok: true }, {
        "set-cookie": "support_session=" + encodeURIComponent(token) + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800"
      });
    }
    if (url.pathname.startsWith("/api/")) {
      if (!sessions.has(cookieToken(request))) return send(response, 401, { error: "Sign in required" });
      if (request.method === "GET" && url.pathname === "/api/messages") return send(response, 200, await history());
      return send(response, 404, { error: "Not found" });
    }
    if (request.method === "GET" && staticFiles[url.pathname]) {
      const [name, type] = staticFiles[url.pathname];
      const content = await readFile(path.join(publicDir, name));
      response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      return response.end(content);
    }
    return send(response, 404, { error: "Not found" });
  } catch (error) {
    return send(response, error.message === "request too large" ? 413 : 400, { error: error.message });
  }
});

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "/", "http://localhost");
  if (url.pathname !== "/ws" || !sessions.has(cookieToken(request))) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    return socket.destroy();
  }
  wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws, request));
});

wss.on("connection", async ws => {
  ws.send(JSON.stringify({ type: "history", messages: await history() }));
  ws.on("message", async buffer => {
    if (buffer.length > 2048) return ws.close(1009, "Message too large");
    let message;
    try { message = JSON.parse(buffer.toString()); } catch { return; }
    const sender = String(message.sender || "").trim().slice(0, 40);
    const text = String(message.text || "").trim();
    if (!sender || !text || text.length > 1000) return;
    const now = Date.now();
    const previous = rateLimits.get(sender) || 0;
    if (now - previous < 700) return;
    rateLimits.set(sender, now);
    const record = { id: randomUUID(), sender, text, sentAt: new Date().toISOString() };
    await appendFile(messageFile, JSON.stringify(record) + "\n", { mode: 0o600 });
    const payload = JSON.stringify({ type: "message", message: record });
    for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log("Support Console available at http://127.0.0.1:" + port);
});
