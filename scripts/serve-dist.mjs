import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const port = 5173;
const host = "127.0.0.1";
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

http
  .createServer((req, res) => {
    const rawUrl = req.url ?? "/";
    const url = rawUrl === "/" ? "/index.html" : rawUrl.split("?")[0];
    const file = path.join(root, url);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        fs.readFile(path.join(root, "index.html"), (fallbackError, fallbackData) => {
          if (fallbackError) {
            res.writeHead(404);
            res.end("not found");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(fallbackData);
        });
        return;
      }
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "application/octet-stream"
      });
      res.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`static server ready at http://${host}:${port}/`);
  });
