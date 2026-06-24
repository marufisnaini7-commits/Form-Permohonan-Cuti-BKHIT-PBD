import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

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
      
      const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet as string)}`;
      
      console.log(`Proxying public sheet request to Google: ID=${id}, Sheet=${sheet}`);
      
      const response = await fetch(googleSheetUrl);
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Gagal menarik data dari Google Sheets. Pastikan Spreadsheet disetel ke "Siapa saja yang memiliki link dapat melihat".` 
        });
      }
      
      const csvText = await response.text();
      
      // Let's check if Google returned a sign-in redirect instead of CSV (which means sheet is private)
      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('Sign in') || csvText.includes('google-signin')) {
        return res.status(403).json({ 
          error: 'Spreadsheet ini bersifat pribadi. Silakan buka menu "Bagikan" di Google Sheets, lalu setel Akses Umum ke "Siapa saja yang memiliki link dapat melihat" (sebagai Viewer / Pengakses lihat-saja).' 
        });
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(csvText);
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
