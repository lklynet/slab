import { createServer } from "node:http";
import { mkdirSync, createReadStream } from "node:fs";
import { readFile, access } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const PORT = parseInt(process.env.PORT || "3000", 10);
const DB_PATH = join(__dirname, "data", "tasks.db");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

const STATIC_FILES = new Set([
  "/",
  "/index.html",
  "/script.js",
  "/css/slab.css",
]);

mkdirSync(join(__dirname, "data"), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    config TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

function generateBoardId() {
  return [...Array(8)].map(() => Math.random().toString(36)[2]).join("");
}

function setCspHeaders(res) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://use.typekit.net https://p.typekit.net",
    "font-src 'self' data: https://cdnjs.cloudflare.com https://use.typekit.net https://p.typekit.net",
    "img-src 'self' data:",
    "connect-src 'self' https://www.googletagmanager.com",
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);
}

function sendJson(res, status, body) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  setCspHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.writeHead(status);
  res.end(data);
}


async function serveStaticFile(res, pathname) {
  const filePath = pathname === "/" || pathname === "/index.html"
    ? join(__dirname, "index.html")
    : join(__dirname, pathname);

  try {
    await access(filePath);
  } catch {
    return false;
  }

  const ext = extname(filePath);
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";
  setCspHeaders(res);

  res.setHeader("Content-Type", mimeType);
  res.writeHead(200);

  if (pathname === "/" || pathname === "/index.html") {
    const html = await readFile(filePath, "utf-8");
    res.end(html);
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
}

async function handleApiRequest(req, res, pathname) {
  if (pathname === "/" || pathname === "") {
    if (req.method !== "GET") {
      sendJson(res, 405, "Method not allowed");
      return;
    }

    const boardId = generateBoardId();
    const defaultConfig = `my slab\n/To Do\n/Doing\n/Done`;
    const timestamp = Math.floor(Date.now() / 1000);

    db.prepare("INSERT INTO boards (id, config, created_at) VALUES (?, ?, ?)")
      .run(boardId, defaultConfig, timestamp);

    sendJson(res, 200, { boardId });
    return;
  }

  const boardId = pathname.substring(1);

  if (req.method === "GET") {
    const row = db.prepare("SELECT config FROM boards WHERE id = ?").get(boardId);
    if (row) {
      sendJson(res, 200, { config: row.config });
    } else {
      sendJson(res, 404, "Board not found");
    }
  } else if (req.method === "POST") {
  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
  const config = new URLSearchParams(body).get("config");

    if (!config) {
      sendJson(res, 400, "Missing config field");
      return;
    }

    const result = db.prepare("UPDATE boards SET config = ? WHERE id = ?")
      .run(config, boardId);

    if (result.changes > 0) {
      sendJson(res, 200, "Board updated");
    } else {
      sendJson(res, 404, "Board not found");
    }
  } else if (req.method === "DELETE") {
    const result = db.prepare("DELETE FROM boards WHERE id = ?").run(boardId);
    if (result.changes > 0) {
      sendJson(res, 200, "Board deleted");
    } else {
      sendJson(res, 404, "Board not found");
    }
  } else {
    sendJson(res, 405, "Method not allowed");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/")) {
    const apiPath = pathname.replace("/api", "") || "/";
    await handleApiRequest(req, res, apiPath);
    return;
  }

  if (STATIC_FILES.has(pathname)) {
    const served = await serveStaticFile(res, pathname);
    if (served) return;
  }

  if (pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  await serveStaticFile(res, "/index.html");
});

server.listen(PORT, () => {
  console.log(`Tasks server running at http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  db.close();
  server.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  db.close();
  server.close();
  process.exit(0);
});
