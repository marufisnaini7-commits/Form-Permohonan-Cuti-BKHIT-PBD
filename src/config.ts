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
  "1LKS6zNYOnddTZoZs87488V-SOocRBkLKa54si0nhe0Q";

// Silakan isi URL Web App Apps Script default Anda di sini jika tidak menggunakan env variable
export const DEFAULT_APPSCRIPT_URL = 
  ((import.meta as any).env?.VITE_DEFAULT_APPSCRIPT_URL as string) || 
  "https://script.google.com/macros/s/AKfycbyOvkamK-G9s8xPYHvM65SIHSKZoLza8E4Ppjgrrs7Q48R4ucfjX0vN1GU7I_UaaECaOg/exec";
