import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Database, 
  Link2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  Check,
  Code,
  Globe,
  Settings
} from 'lucide-react';
import { DEFAULT_SPREADSHEET_ID, DEFAULT_APPSCRIPT_URL } from '../config';

interface GoogleSheetsSyncPanelProps {
  spreadsheetId: string | null;
  appscriptUrl: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError?: string | null;
  lastSynced: string | null;
  onConnectAppsScript: (id: string, url: string) => void;
  onPullData: () => void;
  onPushData: () => void;
  onChangeSheet: () => void;
  isUnlocked: boolean; // Menunjukkan apakah pimpinan telah memasukkan PIN keamanan
}

export const GoogleSheetsSyncPanel: React.FC<GoogleSheetsSyncPanelProps> = ({
  spreadsheetId,
  appscriptUrl,
  syncStatus,
  syncError,
  lastSynced,
  onConnectAppsScript,
  onPullData,
  onPushData,
  onChangeSheet,
  isUnlocked
}) => {
  const [inputSheetId, setInputSheetId] = useState(spreadsheetId || '');
  const [inputUrl, setInputUrl] = useState(appscriptUrl || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isExpanded, setIsExpanded] = useState(!spreadsheetId || !appscriptUrl);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  const APPS_SCRIPT_CODE = `// =========================================================================
// GOOGLE APPS SCRIPT: Jembatan Integrasi Database Cuti BKHIT Papua Barat Daya
// =========================================================================
// Skenario Deploy: 
// 1. Jalankan Sebagai: "Saya" (Me / Akun Google Anda)
// 2. Siapa yang memiliki akses: "Siapa Saja" (Anyone / Bahkan tanpa login Google)
// =========================================================================

function doGet(e) {
  var id = e.parameter.id;
  if (!id) {
    return createJsonResponse({ error: "Spreadsheet ID wajib disertakan (?id=...)" });
  }
  
  try {
    var ss = SpreadsheetApp.openById(id);
    
    // Ambil atau buat Sheet Pegawai jika belum ada
    var sheetPegawai = ss.getSheetByName("Pegawai");
    if (!sheetPegawai) {
      sheetPegawai = ss.insertSheet("Pegawai");
      sheetPegawai.appendRow(["ID", "NIP", "Nama", "Jabatan", "Masa Kerja", "Unit Kerja", "Sisa Cuti N", "Sisa Cuti N-1", "Sisa Cuti N-2"]);
    }
    
    // Ambil atau buat Sheet Permohonan Cuti jika belum ada
    var sheetCuti = ss.getSheetByName("Permohonan Cuti");
    if (!sheetCuti) {
      sheetCuti = ss.insertSheet("Permohonan Cuti");
      sheetCuti.appendRow([
        "ID", "EmployeeID", "EmployeeNIP", "EmployeeNama", "EmployeeJabatan", "EmployeeMasaKerja", "EmployeeUnitKerja", 
        "Jenis Cuti", "Tanggal Mulai", "Tanggal Selesai", "Alasan", "Alamat", "No Kontak", "Durasi Hari", 
        "Status", "Catatan Atasan", "Catatan Pimpinan", "Tanggal Persetujuan", "Tanggal Pengajuan"
      ]);
    }
    
    var dataPegawai = sheetPegawai.getDataRange().getValues();
    var dataCuti = sheetCuti.getDataRange().getValues();
    
    var employees = [];
    var requests = [];
    
    // Parse Pegawai (Melewati baris header)
    for (var i = 1; i < dataPegawai.length; i++) {
      var row = dataPegawai[i];
      if (!row[0] && !row[1] && !row[2]) continue;
      employees.push({
        id: String(row[0] || ""),
        nip: String(row[1] || ""),
        nama: String(row[2] || ""),
        jabatan: String(row[3] || ""),
        masaKerja: String(row[4] || ""),
        unitKerja: String(row[5] || ""),
        sisaCutiN: Number(row[6] || 0),
        sisaCutiN1: Number(row[7] || 0),
        sisaCutiN2: Number(row[8] || 0)
      });
    }
    
    // Parse Permohonan Cuti (Melewati baris header)
    for (var j = 1; j < dataCuti.length; j++) {
      var row = dataCuti[j];
      if (!row[0]) continue;
      
      var formatVal = function(val) {
        if (val instanceof Date) {
          try {
            return val.toISOString().split('T')[0];
          } catch(e) {
            return String(val);
          }
        }
        return String(val || "");
      };
      
      requests.push({
        id: String(row[0] || ""),
        employeeId: String(row[1] || ""),
        employeeNip: String(row[2] || ""),
        employeeName: String(row[3] || ""),
        employeeJabatan: String(row[4] || ""),
        employeeMasaKerja: String(row[5] || ""),
        employeeUnitKerja: String(row[6] || ""),
        jenisCuti: String(row[7] || ""),
        tanggalMulai: formatVal(row[8]),
        tanggalSelesai: formatVal(row[9]),
        alasan: String(row[10] || ""),
        alamatCuti: String(row[11] || ""),
        telp: String(row[12] || ""),
        durasiHari: Number(row[13] || 0),
        status: String(row[14] || ""),
        catatanAtasan: String(row[15] || ""),
        catatanPimpinan: String(row[16] || ""),
        tanggalPersetujuan: formatVal(row[17]),
        tanggalPengajuan: formatVal(row[18])
      });
    }
    
    return createJsonResponse({ employees: employees, requests: requests });
  } catch (err) {
    return createJsonResponse({ error: "Gagal membaca database Google Sheets: " + err.message });
  }
}

function doPost(e) {
  try {
    var id = e.parameter.id;
    if (!id) {
      return createJsonResponse({ error: "Spreadsheet ID wajib disertakan (?id=...)" });
    }
    
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById(id);
    
    // Tulis Pegawai
    var sheetPegawai = ss.getSheetByName("Pegawai");
    if (!sheetPegawai) {
      sheetPegawai = ss.insertSheet("Pegawai");
    }
    sheetPegawai.clear();
    
    var pegawaiHeaders = ["ID", "NIP", "Nama", "Jabatan", "Masa Kerja", "Unit Kerja", "Sisa Cuti N", "Sisa Cuti N-1", "Sisa Cuti N-2"];
    var pegawaiRows = [pegawaiHeaders];
    if (payload.employees && payload.employees.length > 0) {
      payload.employees.forEach(function(emp) {
        pegawaiRows.push([
          emp.id,
          emp.nip,
          emp.nama,
          emp.jabatan,
          emp.masaKerja,
          emp.unitKerja,
          emp.sisaCutiN,
          emp.sisaCutiN1,
          emp.sisaCutiN2
        ]);
      });
    }
    sheetPegawai.getRange(1, 1, pegawaiRows.length, pegawaiHeaders.length).setValues(pegawaiRows);
    
    // Tulis Permohonan Cuti
    var sheetCuti = ss.getSheetByName("Permohonan Cuti");
    if (!sheetCuti) {
      sheetCuti = ss.insertSheet("Permohonan Cuti");
    }
    sheetCuti.clear();
    
    var permohonanHeaders = [
      "ID", "EmployeeID", "EmployeeNIP", "EmployeeNama", "EmployeeJabatan", "EmployeeMasaKerja", "EmployeeUnitKerja", 
      "Jenis Cuti", "Tanggal Mulai", "Tanggal Selesai", "Alasan", "Alamat", "No Kontak", "Durasi Hari", 
      "Status", "Catatan Atasan", "Catatan Pimpinan", "Tanggal Persetujuan", "Tanggal Pengajuan"
    ];
    var permohonanRows = [permohonanHeaders];
    if (payload.requests && payload.requests.length > 0) {
      payload.requests.forEach(function(r) {
        permohonanRows.push([
          r.id,
          r.employeeId,
          r.employeeNip,
          r.employeeName,
          r.employeeJabatan,
          r.employeeMasaKerja,
          r.employeeUnitKerja,
          r.jenisCuti,
          r.tanggalMulai,
          r.tanggalSelesai,
          r.alasan,
          r.alamatCuti,
          r.telp,
          r.durasiHari,
          r.status,
          r.catatanAtasan || "",
          r.catatanPimpinan || "",
          r.tanggalPersetujuan || "",
          r.tanggalPengajuan || ""
        ]);
      });
    }
    sheetCuti.getRange(1, 1, permohonanRows.length, permohonanHeaders.length).setValues(permohonanRows);
    
    return createJsonResponse({ success: true });
  } catch (err) {
    return createJsonResponse({ error: "Gagal menyimpan database ke Google Sheets: " + err.message });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdInput = inputSheetId.trim();
    const cleanUrlInput = inputUrl.trim();

    if (!cleanIdInput || !cleanUrlInput) {
      setErrorMsg('ID Spreadsheet dan URL Jembatan Apps Script tidak boleh kosong.');
      return;
    }

    if (!cleanUrlInput.startsWith('https://script.google.com/')) {
      setErrorMsg('Format URL Apps Script tidak valid. Harus diawali dengan "https://script.google.com/macros/s/..."');
      return;
    }

    // Extract real spreadsheet ID from URL or text
    let finalId = cleanIdInput;
    const match = cleanIdInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      finalId = match[1];
    } else {
      finalId = cleanIdInput.replace(/["']/g, "").trim();
    }

    setErrorMsg('');
    onConnectAppsScript(finalId, cleanUrlInput);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs mb-6 overflow-hidden transition-all duration-300" id="google-sheets-panel-root">
      
      {/* COMPACT STICKY HEADER */}
      <div 
        className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 cursor-pointer select-none border-b border-gray-100/60 hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        id="sync-panel-header"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs text-gray-900 flex flex-wrap items-center gap-1.5 leading-none">
              <span>Status Basis Data</span>
              {spreadsheetId && appscriptUrl ? (
                isUnlocked ? (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded-md">🟢 ONLINE (FULL SYNC)</span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-800 rounded-md">🟢 ONLINE (READ ONLY)</span>
                )
              ) : (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-700 rounded-md">🔵 LOCAL STORAGE</span>
              )}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 truncate">
              {spreadsheetId && appscriptUrl 
                ? `Terhubung ke Google Sheet via Jembatan Apps Script. Bebas kendala login.`
                : 'Beroperasi menggunakan basis data lokal terenkripsi PIN pimpinan.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick Pull/Refresh button if connected */}
          {spreadsheetId && appscriptUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPullData();
              }}
              disabled={syncStatus === 'syncing'}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Segarkan sisa cuti dari Google Sheet"
            >
              <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan Data</span>
            </button>
          )}

          <div className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-all">
            <span>{isExpanded ? 'Tutup Pengaturan' : 'Atur Database Cloud'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>
        </div>
      </div>

      {/* EXPANDABLE CONFIGURATION PANEL */}
      {isExpanded && (
        <div className="p-5 md:p-6 border-t border-gray-100 animate-slideDown" id="sync-panel-expanded-body">
          
          {/* SPREADSHEET ERROR BANNER */}
          {syncError && (
            <div className="mb-5 p-4 bg-red-50/90 border border-red-100 rounded-xl text-red-800 text-xs flex items-start space-x-2.5 animate-fadeIn" id="sync-error-banner">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Kendala Koneksi Jembatan Apps Script:</p>
                <p className="leading-relaxed text-red-700">{syncError}</p>
              </div>
            </div>
          )}

          {/* CLOUD CONNECTION WITH GOOGLE APPS SCRIPT */}
          <div className="border border-gray-100 rounded-2xl p-4 md:p-5 bg-slate-50/30">
            <div className="pb-4 border-b border-gray-100 mb-4">
              <h4 className="font-bold text-xs text-gray-900 flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Koneksi Basis Data Google Sheets via Jembatan Google Apps Script</span>
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Kami beralih menggunakan Google Apps Script sebagai jembatan integrasi database. Metode ini <strong>100% andal, bebas kendala login, dan bypass sistem sign-in manual Google</strong> yang sering diblokir popup blocker browser.
              </p>
            </div>

            {/* CASE A: DISCONNECTED (FORM SETUP) */}
            {!spreadsheetId || !appscriptUrl ? (
              !isUnlocked ? (
                <div className="p-6 text-center space-y-4 max-w-md mx-auto" id="disconnected-locked-state">
                  <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-gray-950">Konfigurasi Database Cloud Terkunci</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Sinkronisasi basis data cloud Google Sheets belum dikonfigurasi. Pengaturan koneksi awal dan salinan Kode gs dilindungi untuk menghindari perubahan struktur data secara tidak sah.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-gray-150 rounded-xl">
                    <p className="text-[10px] text-gray-600 font-medium leading-normal">
                      Silakan klik tombol <strong>"Gunakan PIN Pimpinan"</strong> di menu navigasi paling atas terlebih dahulu untuk melakukan konfigurasi awal database.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-950 text-[11px] leading-relaxed">
                    📌 <strong>Cara Kerja Jembatan:</strong> Anda hanya perlu menempelkan kode Apps Script kami ke dalam Google Sheet Anda, lalu menerapkannya (deploy) sebagai Aplikasi Web. Selanjutnya, tempel URL Web App tersebut di bawah ini bersama ID Spreadsheet Anda.
                  </div>

                  <form onSubmit={handleLinkSubmit} className="space-y-3.5 max-w-xl mx-auto text-left">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">1. ID / URL Google Spreadsheet</label>
                      <input
                        type="text"
                        placeholder="Contoh: 1vF8Z... atau paste URL lengkap"
                        value={inputSheetId}
                        onChange={e => setInputSheetId(e.target.value)}
                        className="w-full text-[11px] border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none bg-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">2. URL Web App Google Apps Script</label>
                      <input
                        type="text"
                        placeholder="Contoh: https://script.google.com/macros/s/.../exec"
                        value={inputUrl}
                        onChange={e => setInputUrl(e.target.value)}
                        className="w-full text-[11px] border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none bg-white font-mono"
                      />
                    </div>

                    {errorMsg && <p className="text-[10px] text-red-600 font-bold">{errorMsg}</p>}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={syncStatus === 'syncing'}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {syncStatus === 'syncing' ? 'Menghubungkan...' : 'Hubungkan Database Cloud'}
                      </button>
                    </div>
                  </form>
                </div>
              )
            ) : (
              /* CASE B: CONNECTED */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/50 mt-2">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>Sinkronisasi Google Sheet Aktif</span>
                    </div>
                    {spreadsheetId === DEFAULT_SPREADSHEET_ID && appscriptUrl === DEFAULT_APPSCRIPT_URL ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                        🔌 KONEKSI OTOMATIS BKHIT
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs">
                        🛠️ KONEKSI MANUAL KUSTOM
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-[10px] font-mono text-gray-600">
                    <div className="truncate">ID Spreadsheet: <span className="bg-white border border-gray-200 px-1 rounded text-gray-800">{spreadsheetId}</span></div>
                    <div className="truncate">URL Jembatan: <span className="bg-white border border-gray-200 px-1 rounded text-gray-800">{appscriptUrl}</span></div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 font-medium">
                    <span className="flex items-center space-x-1 text-emerald-700">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>Sinkronisasi Otomatis Aktif</span>
                    </span>
                    {lastSynced && <span>• Terakhir Sinkron: <strong>{lastSynced}</strong></span>}
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-wrap gap-2 justify-end shrink-0">
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>

                  <button
                    onClick={onPullData}
                    disabled={syncStatus === 'syncing'}
                    className="inline-flex items-center space-x-1 px-2.5 py-2 bg-indigo-550 hover:bg-indigo-650 text-indigo-700 border border-indigo-150 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Ambil data sisa cuti dari Google Sheets"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Tarik Data</span>
                  </button>

                  {isUnlocked && (
                    <button
                      onClick={onPushData}
                      disabled={syncStatus === 'syncing'}
                      className="inline-flex items-center space-x-1 px-2.5 py-2 bg-emerald-550 hover:bg-emerald-650 text-emerald-700 border border-emerald-150 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                      title="Unggah data lokal saat ini ke Google Sheets"
                    >
                      <Database className="w-3 h-3" />
                      <span>Unggah Data</span>
                    </button>
                  )}

                  {isUnlocked && (
                    <button
                      onClick={onChangeSheet}
                      className="text-red-600 hover:text-red-700 text-[10px] font-bold py-1.5 px-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Putuskan Koneksi
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* INSTRUCTIONS COLLAPSIBLE DRAWER */}
          {!isUnlocked ? (
            <div className="mt-5 p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col items-center text-center space-y-2" id="instructions-locked-state">
              <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-xs text-gray-900">Panduan & Kode Apps Script Dilindungi</h5>
              <p className="text-[11px] text-gray-500 max-w-md leading-relaxed">
                Untuk menjaga keaslian kode jembatan Google Apps Script (gs) dan menghindari manipulasi basis data oleh pihak yang tidak bertanggung jawab, modul panduan ini dikunci.
              </p>
              <div className="pt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50/70 border border-indigo-100/60 px-3 py-1.5 rounded-lg">
                🔐 Silakan masukkan PIN Pimpinan di menu navigasi atas untuk melihat Kode gs
              </div>
            </div>
          ) : (
            <div className="mt-5 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-100/50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
                  <Code className="w-4 h-4 text-indigo-600" />
                  <span>⚙️ Panduan Deploy Jembatan Google Apps Script (Hanya 1 Menit!)</span>
                </div>
                {showInstructions ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>

              {showInstructions && (
                <div className="p-4 md:p-5 border-t border-slate-150 space-y-4 animate-fadeIn text-left text-xs text-gray-700 leading-relaxed">
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900">Langkah-langkah di Google Spreadsheet Anda:</p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-gray-600">
                      <li>Buka Google Spreadsheet target Anda di Google Drive.</li>
                      <li>Di bilah menu atas, klik <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                      <li>Hapus seluruh kode kosong di dalam editor Apps Script bawaan.</li>
                      <li>Klik tombol <strong className="text-indigo-600">"Salin Kode gs"</strong> di bawah ini, lalu tempelkan seluruh kodenya ke editor Apps Script tersebut.</li>
                      <li>Simpan dengan mengklik ikon disket/Save (atau tekan <kbd className="bg-gray-100 border px-1 rounded">Ctrl+S</kbd>).</li>
                      <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> di pojok kanan atas, lalu pilih <strong>Penerapan Baru (New deployment)</strong>.</li>
                      <li>Klik ikon gerigi di sebelah kiri "Pilih jenis", lalu pilih <strong>Aplikasi Web (Web app)</strong>.</li>
                      <li>Setel konfigurasi berikut:
                        <ul className="list-disc list-inside pl-5 mt-1 space-y-0.5 text-gray-900 font-medium">
                          <li>Deskripsi: <span className="font-normal text-gray-600">Database Cuti BKHIT</span></li>
                          <li>Jalankan sebagai (Execute as): <span className="text-indigo-700">Saya (email-anda@gmail.com)</span></li>
                          <li>Siapa yang memiliki akses (Who has access): <span className="text-emerald-700 font-bold">Siapa saja (Anyone)</span></li>
                        </ul>
                      </li>
                      <li>Klik tombol <strong>Terapkan (Deploy)</strong>.</li>
                      <li>Google akan meminta Anda memberikan izin akses ("Otorisasi Akses"). Klik <strong>Berikan Akses (Authorize Access)</strong>, login akun Google Anda, klik <strong>Advanced</strong> di bagian kiri bawah, lalu klik <strong>Go to Untitled project (unsafe)</strong>, dan klik <strong>Allow</strong>.</li>
                      <li>Salin <strong>URL Aplikasi Web</strong> yang ditampilkan (berakhir dengan <code className="bg-gray-150 px-1 font-mono text-red-600">/exec</code>).</li>
                      <li>Tempel URL tersebut beserta ID Spreadsheet Anda ke dalam form di atas!</li>
                    </ol>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 flex items-center space-x-1.5">
                        <span>Kode Apps Script (Code.gs)</span>
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Tersalin!' : 'Salin Kode gs'}</span>
                      </button>
                    </div>

                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed max-h-60 scrollbar-thin">
                      {APPS_SCRIPT_CODE}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
