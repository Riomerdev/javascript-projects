import http from "node:http";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, "data");
const eventFile = path.join(dataDir, "events.jsonl");
const deliveryFile = path.join(dataDir, "deliveries.jsonl");
const port = Number(process.env.PORT || 3400);
const staticFiles = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"]
};
const secretPattern = /(authorization|token|secret|password|cookie|signature|email|phone)/i;

function send(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}
async function readBody(request, limit = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error("payload exceeds 1 MiB limit");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}
function redact(value, key = "") {
  if (secretPattern.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map(item => redact(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]));
  }
  return value;
}
async function readLines(file, limit = 100) {
  try {
    const lines = (await readFile(file, "utf8")).trim().split("\n").filter(Boolean);
    return lines.slice(-limit).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  } catch { return []; }
}

await mkdir(dataDir, { recursive: true });
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://localhost");
  try {
    if (request.method === "GET" && staticFiles[url.pathname]) {
      const [name, type] = staticFiles[url.pathname];
      response.writeHead(200, { "content-type": type });
      return response.end(await readFile(path.join(root, "public", name)));
    }
    if (request.method === "GET" && url.pathname === "/api/events") return send(response, 200, await readLines(eventFile));
    if (request.method === "GET" && url.pathname === "/api/deliveries") return send(response, 200, await readLines(deliveryFile));
    if (request.method === "POST" && url.pathname.startsWith("/hooks/")) {
      const source = decodeURIComponent(url.pathname.slice("/hooks/".length)).slice(0, 80);
      if (!source) return send(response, 400, { error: "source is required" });
      const raw = await readBody(request);
      let body;
      try { body = JSON.parse(raw); } catch { return send(response, 415, { error: "Only JSON payloads are accepted" }); }
      const headers = {
        "content-type": request.headers["content-type"] || "",
        "user-agent": request.headers["user-agent"] || "",
        "x-request-id": request.headers["x-request-id"] || ""
      };
      const event = { id: randomUUID(), source, receivedAt: new Date().toISOString(), headers, body: redact(body) };
      await appendFile(eventFile, JSON.stringify(event) + "\n", { mode: 0o600 });
      return send(response, 202, { accepted: true, eventId: event.id });
    }
    if (request.method === "POST" && url.pathname.startsWith("/api/events/") && url.pathname.endsWith("/replay")) {
      const id = url.pathname.split("/")[3];
      const event = (await readLines(eventFile, 1000)).find(item => item.id === id);
      if (!event) return send(response, 404, { error: "Event not found" });
      const delivery = { id: randomUUID(), originalEventId: id, source: event.source, replayedAt: new Date().toISOString(), receiver: "local-mock", outcome: "accepted" };
      await appendFile(deliveryFile, JSON.stringify(delivery) + "\n", { mode: 0o600 });
      return send(response, 202, delivery);
    }
    return send(response, 404, { error: "Not found" });
  } catch (error) {
    return send(response, error.message.includes("1 MiB") ? 413 : 400, { error: error.message });
  }
});
server.listen(port, "127.0.0.1", () => console.log("Webhook Observatory at http://127.0.0.1:" + port));
