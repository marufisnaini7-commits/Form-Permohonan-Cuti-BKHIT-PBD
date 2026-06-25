/**
 * JEMBATAN INTEGRASI DEFAULT - DATABASE GOOGLE SHEETS BKHIT PAPUA BARAT DAYA
 * 
 * Atur nilai di bawah ini agar semua pengguna/pegawai otomatis terhubung ke 
 * Google Spreadsheet yang sama saat pertama kali membuka aplikasi.
 * 
 * Anda juga bisa mengaturnya menggunakan environment variables di platform hosting:
 * - VITE_DEFAULT_SPREADSHEET_ID
 * - VITE_DEFAULT_APPSCRIPT_URL
 */

// Silakan isi ID Spreadsheet default Anda di sini jika tidak menggunakan env variable
export const DEFAULT_SPREADSHEET_ID = 
  ((import.meta as any).env?.VITE_DEFAULT_SPREADSHEET_ID as string) || 
  ""; // Contoh: "1vF8Z-eP7p79X..."

// Silakan isi URL Web App Apps Script default Anda di sini jika tidak menggunakan env variable
export const DEFAULT_APPSCRIPT_URL = 
  ((import.meta as any).env?.VITE_DEFAULT_APPSCRIPT_URL as string) || 
  ""; // Contoh: "https://script.google.com/macros/s/.../exec"
