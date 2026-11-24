// Serves the static export (out/) for the look-and-layout checks: /privacy -> privacy.html, like Pages.
// No dependencies on purpose. Usage: node e2e/serve.mjs [port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(import.meta.dirname, "..", "out");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain" };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  for (const file of [path, `${path}.html`, join(path, "index.html")]) {
    try {
      const body = await readFile(join(root, file));
      res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
      return res.end(body);
    } catch {}
  }
  res.writeHead(404, { "content-type": "text/html" });
  res.end(await readFile(join(root, "404.html")).catch(() => "Not found"));
}).listen(Number(process.argv[2] ?? 4173));
