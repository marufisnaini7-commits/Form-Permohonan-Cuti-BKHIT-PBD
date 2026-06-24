import express from "express";
import path from "path";
import https from "https";
import http from "http";
import { URL } from "url";
import { createServer as createViteServer } from "vite";

// Robust redirect-following HTTP client
function fetchUrlWithRedirect(targetUrl: string, maxRedirects = 10): Promise<{ status: number; headers: any; body: string }> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error("Terlalu banyak pengalihan (redirect) oleh Google."));
    }

    const client = targetUrl.startsWith("https") ? https : http;

    client.get(targetUrl, (res) => {
      const { statusCode } = res;
      
      // Follow redirects (301, 302, 303, 307, 308)
      if (statusCode && statusCode >= 300 && statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith("http")) {
          const parsedUrl = new URL(targetUrl);
          redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
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
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Disable powered-by header for security
  app.disable('x-powered-by');

  // API routes FIRST
  app.get("/api/public-sheet", async (req, res) => {
    try {
      const { id, sheet } = req.query;
      if (!id || !sheet) {
        return res.status(400).json({ error: "Spreadsheet ID dan Nama Sheet wajib diisi." });
      }

      console.log(`Proxying public sheet request: ID=${id}, Sheet=${sheet}`);

      // We use the official, cleanest /export format
      const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&sheet=${encodeURIComponent(sheet as string)}`;
      
      const result = await fetchUrlWithRedirect(googleSheetUrl);

      // Check for Google Login redirect / HTML response (means sheet is private)
      const isHtml = result.body.includes("<!DOCTYPE html>") || result.body.includes("<html") || result.body.includes("google-signin");
      if (isHtml) {
        return res.status(403).json({
          error: `Spreadsheet ini bersifat pribadi. Silakan buka menu "Bagikan" di Google Sheets Anda, lalu setel Akses Umum ke "Siapa saja yang memiliki link dapat melihat" (Viewer / Pengakses lihat-saja).`
        });
      }

      if (result.status === 404) {
        return res.status(404).json({
          error: `Spreadsheet dengan ID "${id}" tidak ditemukan. Pastikan ID Spreadsheet yang dimasukkan sudah benar.`
        });
      }

      if (result.status === 400 || result.body.includes("INVALID_SHEET_NAME") || result.body.includes("tidak ditemukan")) {
        return res.status(400).json({
          error: `Tab "${sheet}" tidak ditemukan di Spreadsheet Anda. Pastikan nama tab tersebut ada (huruf besar/kecil berpengaruh).`
        });
      }

      if (result.status !== 200) {
        return res.status(result.status).json({
          error: `Gagal menarik data dari Google (Kode Status: ${result.status}).`
        });
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(result.body);
    } catch (err: any) {
      console.error("Error in public-sheet API proxy:", err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
