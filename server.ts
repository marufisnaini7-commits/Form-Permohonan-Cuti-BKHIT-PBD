import express from "express";
import path from "path";
import https from "https";
import http from "http";
import { URL } from "url";
import { createServer as createViteServer } from "vite";

// Robust redirect-following HTTP client with custom headers
function fetchUrlWithRedirect(targetUrl: string, maxRedirects = 10): Promise<{ status: number; headers: any; body: string }> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error("Terlalu banyak pengalihan (redirect) oleh Google."));
    }

    try {
      const urlObj = new URL(targetUrl);
      const options = {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,text/plain,*/*;q=0.8",
          "Accept-Language": "id,en-US,en;q=0.9",
        }
      };

      const client = targetUrl.startsWith("https") ? https : http;

      const req = client.request(options, (res) => {
        const { statusCode } = res;
        
        // Follow redirects (301, 302, 303, 307, 308)
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

      // We use gviz/tq?tqx=out:csv which supports selecting tabs by name on public spreadsheets
      const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet as string)}`;
      
      const result = await fetchUrlWithRedirect(googleSheetUrl);

      // Check for Google Login redirect / HTML response (means sheet is private)
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
