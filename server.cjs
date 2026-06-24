var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_https = __toESM(require("https"), 1);
var import_http = __toESM(require("http"), 1);
var import_url = require("url");
var import_vite = require("vite");
function fetchUrlWithRedirect(targetUrl, maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error("Terlalu banyak pengalihan (redirect) oleh Google."));
    }
    try {
      const urlObj = new import_url.URL(targetUrl);
      const options = {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,text/plain,*/*;q=0.8",
          "Accept-Language": "id,en-US,en;q=0.9"
        }
      };
      const client = targetUrl.startsWith("https") ? import_https.default : import_http.default;
      const req = client.request(options, (res) => {
        const { statusCode } = res;
        if (statusCode && statusCode >= 300 && statusCode < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith("http")) {
            redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
          }
          return fetchUrlWithRedirect(redirectUrl, maxRedirects - 1).then(resolve, reject);
        }
        let rawData = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          resolve({
            status: statusCode || 200,
            headers: res.headers,
            body: rawData
          });
        });
      });
      req.on("error", (err) => {
        reject(err);
      });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.disable("x-powered-by");
  app.get("/api/public-sheet", async (req, res) => {
    try {
      const { id, sheet } = req.query;
      if (!id || !sheet) {
        return res.status(400).json({ error: "Spreadsheet ID dan Nama Sheet wajib diisi." });
      }
      console.log(`Proxying public sheet request: ID=${id}, Sheet=${sheet}`);
      const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
      const result = await fetchUrlWithRedirect(googleSheetUrl);
      const isHtml = result.body.includes("<!DOCTYPE html>") || result.body.includes("<html") || result.body.includes("google-signin") || result.body.includes("ServiceLogin");
      if (isHtml) {
        console.warn(`HTML response detected from Google Sheets. Body snippet: ${result.body.slice(0, 300)}`);
        return res.status(403).json({
          error: `Spreadsheet ini bersifat pribadi (terkunci). Silakan buka menu "Bagikan" (Share) di Google Sheets Anda, lalu ubah Akses Umum menjadi "Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view / Viewer), kemudian coba lagi.`
        });
      }
      if (result.status === 404) {
        return res.status(404).json({
          error: `Spreadsheet dengan ID "${id}" tidak ditemukan. Pastikan ID Spreadsheet yang dimasukkan sudah benar.`
        });
      }
      if (result.status === 400 || result.body.includes("INVALID_SHEET_NAME") || result.body.includes("not found") || result.body.includes("RESOURCE_NOT_FOUND")) {
        return res.status(400).json({
          error: `Tab "${sheet}" tidak ditemukan di Spreadsheet Anda. Pastikan nama tab tersebut ada (sama persis, huruf besar/kecil berpengaruh, tanpa spasi ekstra) dan diberi nama "Pegawai" untuk daftar pegawai, dan "Permohonan Cuti" untuk daftar permohonan.`
        });
      }
      if (result.status !== 200) {
        console.warn(`Non-200 response from Google: ${result.status}. Body: ${result.body.slice(0, 200)}`);
        return res.status(result.status).json({
          error: `Gagal menarik data dari Google (Kode Status: ${result.status}). Detail: ${result.body.slice(0, 150)}`
        });
      }
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(result.body);
    } catch (err) {
      console.error("Error in public-sheet API proxy:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
