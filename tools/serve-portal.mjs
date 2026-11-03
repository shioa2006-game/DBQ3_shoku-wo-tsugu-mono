// 共通ページのローカル確認用。指定した出力だけをloopbackで公開する。
import http from "node:http";
import { readFile, stat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const directory = args[0];
const port = Number(args[1] ?? 5188);
const prefix = "/DBQ3_shoku-wo-tsugu-mono/";
if (!directory || !Number.isInteger(port) || port < 1024 || port > 65535 || args.length > 2) {
  console.error("使い方: node tools/serve-portal.mjs work/portal-build-XXXXXX [ポート番号（既定5188）]");
  process.exit(1);
}

const work = await realpath(path.join(root, "work"));
const base = await realpath(path.resolve(root, directory));
const relative = path.relative(work, base);
if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
  throw new Error("公開できるのは work/ 配下の出力フォルダだけです。");
}
await stat(path.join(base, "index.html"));
const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".woff2": "font/woff2", ".ogg": "audio/ogg", ".mp3": "audio/mpeg",
};
const server = http.createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/" || url.pathname === prefix.slice(0, -1)) {
      res.writeHead(302, { Location: prefix }).end();
      return;
    }
    if (!url.pathname.startsWith(prefix)) {
      res.writeHead(404).end("Not found");
      return;
    }
    let target = path.resolve(base, decodeURIComponent(url.pathname.slice(prefix.length)));
    let rel = path.relative(base, target);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if ((await stat(target)).isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        res.writeHead(302, { Location: url.pathname + "/" + url.search }).end();
        return;
      }
      target = path.join(target, "index.html");
    }
    target = await realpath(target);
    rel = path.relative(base, target);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(target);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(target)] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
server.once("error", (error) => {
  console.error(`確認サーバーを起動できません: ${error.message}`);
  console.error("既存サーバーは停止せず、別のポート番号を引数で指定してください。");
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}${prefix}`);
  console.log(`公開フォルダ: ${base}`);
});
