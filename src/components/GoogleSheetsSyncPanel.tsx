import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Database, 
  PlusCircle, 
  Link2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck,
  Eye,
  Info
} from 'lucide-react';

interface GoogleSheetsSyncPanelProps {
  user: User | null;
  spreadsheetId: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError?: string | null;
  lastSynced: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onCreateNewSheet: () => void;
  onLinkExistingSheet: (id: string) => void;
  onPullData: () => void;
  onPushData: () => void;
  onChangeSheet: () => void;
  isLoggingIn: boolean;
  isUnlocked: boolean; // Menunjukkan apakah pimpinan telah memasukkan PIN keamanan
}

export const GoogleSheetsSyncPanel: React.FC<GoogleSheetsSyncPanelProps> = ({
  user,
  spreadsheetId,
  syncStatus,
  syncError,
  lastSynced,
  onLogin,
  onLogout,
  onCreateNewSheet,
  onLinkExistingSheet,
  onPullData,
  onPushData,
  onChangeSheet,
  isLoggingIn,
  isUnlocked
}) => {
  const [inputSheetId, setInputSheetId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  // Panel expanded by default if there's no connected spreadsheet, so users notice it immediately!
  const [isExpanded, setIsExpanded] = useState(!spreadsheetId);

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputSheetId.trim();
    if (!cleanId) {
      setErrorMsg('ID atau URL Spreadsheet tidak boleh kosong.');
      return;
    }
    // Simple check to extract ID if user inputs the whole URL
    let finalId = cleanId;
    if (cleanId.includes('/d/')) {
      const parts = cleanId.split('/d/');
      if (parts[1]) {
        finalId = parts[1].split('/')[0];
      }
    }
    setErrorMsg('');
    onLinkExistingSheet(finalId);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs mb-6 overflow-hidden transition-all duration-300" id="google-sheets-panel-root">
      
      {/* COMPACT STICKY HEADER (TAMPILAN UTAMA YANG SANGAT RINGKAS) */}
      <div 
        className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 cursor-pointer select-none border-b border-gray-100/60 hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        id="sync-panel-header"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs text-gray-900 flex flex-wrap items-center gap-1.5 leading-none">
              <span>Status Basis Data</span>
              {spreadsheetId ? (
                isUnlocked ? (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded-md">🟢 ONLINE (ADMIN CLOUD)</span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-800 rounded-md">🟢 ONLINE (MODE PEGAWAI)</span>
                )
              ) : (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-700 rounded-md">🔵 LOKAL (PIN AMAN)</span>
              )}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 truncate">
              {spreadsheetId 
                ? `Terhubung ke Google Sheets (${spreadsheetId.slice(0, 8)}...). Data tersinkron otomatis.`
                : 'Beroperasi menggunakan basis data lokal terenkripsi PIN pimpinan.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick Pull/Refresh button if connected to spreadsheet */}
          {spreadsheetId && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent toggling accordion
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
            <span>{isExpanded ? 'Tutup Pengaturan' : 'Atur Database / Cloud'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>
        </div>
      </div>

      {/* EXPANDABLE CONFIGURATION PANEL */}
      {isExpanded && (
        <div className="p-5 md:p-6 border-t border-gray-100 animate-slideDown" id="sync-panel-expanded-body">
          
          {/* SECURE PIN MODE HIGHLIGHT */}
          <div className="mb-5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start space-x-3">
            <div className="p-1.5 bg-white text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
              {isUnlocked ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-indigo-500" />}
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-indigo-900 flex items-center space-x-1.5">
                <span>Mode Utama: Keamanan PIN Pimpinan</span>
                {isUnlocked ? (
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-100 text-emerald-800 rounded-full">TERVERIFIKASI</span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-800 rounded-full">TERKUNCI</span>
                )}
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Aplikasi ini didesain agar pimpinan dapat mengelola seluruh pengajuan cuti, menambah/mengedit pegawai, dan mengatur saldo cuti secara penuh <strong>cukup dengan memasukkan PIN Keamanan Pimpinan (Default: 1971)</strong> tanpa harus login Google.
              </p>
              {!isUnlocked && (
                <div className="text-[10px] text-indigo-700 font-semibold bg-white/80 border border-indigo-100/50 px-2 py-1 rounded-lg inline-flex items-center space-x-1">
                  <Info className="w-3 h-3" />
                  <span>Untuk menjalankan Mode Admin, silakan masuk ke tab "Portal Pimpinan" di bawah dan masukkan PIN Anda.</span>
                </div>
              )}
            </div>
          </div>

          {/* SPREADSHEET ERROR BANNER */}
          {syncError && (
            <div className="mb-5 p-4 bg-red-50/90 border border-red-100 rounded-xl text-red-800 text-xs flex items-start space-x-2.5 animate-fadeIn" id="sync-error-banner">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Kendala Koneksi Google Sheets:</p>
                <p className="leading-relaxed text-red-700">{syncError}</p>
              </div>
            </div>
          )}

          {/* SINKRONISASI GOOGLE SHEETS OPTIONS */}
          <div className="border border-gray-100 rounded-2xl p-4 md:p-5 bg-slate-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-xs text-gray-900 flex items-center space-x-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span>Sinkronisasi Google Sheets (Koneksi Database Cloud)</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Gunakan fitur ini jika ingin menyambungkan aplikasi dengan Google Spreadsheet agar data tersimpan aman di cloud dan dapat diakses oleh semua pegawai.
                </p>
              </div>

              {/* Login/Logout Button */}
              <div>
                {user ? (
                  <div className="flex items-center space-x-2 bg-white border border-gray-200 py-1 px-3 rounded-xl text-[11px] font-medium shadow-2xs">
                    <span className="text-gray-600">Google: <strong className="text-gray-900">{user.displayName || user.email}</strong></span>
                    <button 
                      onClick={onLogout}
                      className="text-red-600 hover:text-red-700 font-bold ml-1.5 border-l border-gray-200 pl-2 cursor-pointer inline-flex items-center space-x-1"
                      title="Log out dari Google"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onLogin}
                    disabled={isLoggingIn}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    id="btn-google-login"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in Google'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* CASE A: SHEET CONNECTED, USER NOT LOGGED IN (EMPLOYEE / VIEWER MODE) */}
            {!user && spreadsheetId ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50 mt-4 animate-fadeIn">
                <div className="md:col-span-8 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Sinkronisasi Google Sheet Aktif (Mode Pegawai - Read-Only)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Aplikasi saat ini membaca database sisa cuti resmi pimpinan langsung dari Google Sheet publik. Pegawai dapat memantau saldo cuti secara real-time.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-mono">
                    <span>ID Spreadsheet: <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-700">{spreadsheetId}</span></span>
                    {lastSynced && <span>• Sinkronisasi Terakhir: <strong>{lastSynced}</strong></span>}
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col sm:flex-row justify-end gap-2 shrink-0">
                  <button
                    onClick={onPullData}
                    disabled={syncStatus === 'syncing'}
                    className="inline-flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Segarkan</span>
                  </button>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-1 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                  <button
                    onClick={onChangeSheet}
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold py-1 px-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Putuskan Link
                  </button>
                </div>
              </div>
            ) : !user ? (
              /* CASE B: NO SPREADSHEET & NO USER (STANDALONE PIN WORKSPACE WITH MANUAL LINK OPTION FOR EMPLOYEES) */
              <div className="space-y-4 mt-4 animate-fadeIn">
                <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl text-indigo-950 text-[11px] leading-relaxed">
                  💡 <strong>Mode Penyimpanan Lokal Aktif:</strong> Saat ini aplikasi berjalan offline menggunakan database lokal browser Anda. 
                  <br />
                  <span className="font-semibold text-indigo-900">Pegawai dapat menghubungkan Google Spreadsheet Publik pimpinan di bawah ini agar data pegawai dan sisa cuti sinkron secara otomatis dari cloud.</span>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-2xs transition-all max-w-xl mx-auto text-left">
                  <h5 className="font-bold text-xs text-indigo-900 flex items-center space-x-1.5 uppercase tracking-wide">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hubungkan Spreadsheet Publik Pegawai</span>
                  </h5>
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Tempel URL Google Spreadsheet atau ID Spreadsheet yang telah dibagikan oleh pimpinan BKHIT Papua Barat Daya (harus disetel ke <strong>"Siapa saja yang memiliki link dapat melihat / Viewer"</strong> di menu Bagikan Google Sheets).
                  </p>
                  <form onSubmit={handleLinkSubmit} className="mt-3.5 space-y-2">
                    <div className="flex gap-1.5 flex-col sm:flex-row">
                      <input
                        type="text"
                        placeholder="Tempel ID atau URL Google Spreadsheet di sini..."
                        value={inputSheetId}
                        onChange={e => setInputSheetId(e.target.value)}
                        className="flex-grow text-[11px] border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none bg-white font-mono"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 text-center"
                      >
                        Hubungkan Sheet Publik
                      </button>
                    </div>
                    {errorMsg && <p className="text-[10px] text-red-600 font-bold mt-1">{errorMsg}</p>}
                  </form>
                </div>
              </div>
            ) : !spreadsheetId ? (
              /* CASE C: USER LOGGED IN, NO SPREADSHEET CONNECTED */
              <div className="space-y-4 mt-4 animate-fadeIn">
                <div className="p-3 bg-amber-50/80 border border-amber-100 rounded-xl text-amber-950 text-[11px] font-medium leading-relaxed">
                  🎉 Anda telah login Google! Untuk mengaktifkan sinkronisasi awan, silakan pilih salah satu opsi koneksi basis data Google Sheet di bawah ini.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {/* Option A: Create New */}
                  <div className="bg-white border border-gray-250/80 hover:border-emerald-200 rounded-xl p-4 shadow-2xs transition-all">
                    <h5 className="font-bold text-xs text-emerald-850 flex items-center space-x-1.5 uppercase tracking-wide">
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Opsi A: Buat Baru Otomatis</span>
                    </h5>
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      Sistem akan membuat Google Spreadsheet baru bernama <strong>"Database Cuti BKHIT Papua Barat Daya"</strong> di Google Drive Anda secara otomatis.
                    </p>
                    <button
                      onClick={onCreateNewSheet}
                      disabled={!isUnlocked}
                      className="mt-3.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      id="btn-create-sheet"
                    >
                      {isUnlocked ? 'Buat Spreadsheet Baru' : 'Masukkan PIN Pimpinan Dahulu'}
                    </button>
                  </div>

                  {/* Option B: Link Existing */}
                  <div className="bg-white border border-gray-250/80 hover:border-indigo-200 rounded-xl p-4 shadow-2xs transition-all">
                    <h5 className="font-bold text-xs text-indigo-850 flex items-center space-x-1.5 uppercase tracking-wide">
                      <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Opsi B: Hubungkan yang Ada</span>
                    </h5>
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      Jika sudah memiliki file Spreadsheet sebelumnya di Google Drive Anda, masukkan URL atau ID filenya di bawah.
                    </p>
                    <form onSubmit={handleLinkSubmit} className="mt-3 space-y-2">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="ID / URL Spreadsheet"
                          value={inputSheetId}
                          onChange={e => setInputSheetId(e.target.value)}
                          className="flex-grow text-[11px] border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none bg-white"
                          disabled={!isUnlocked}
                        />
                        <button
                          type="submit"
                          disabled={!isUnlocked}
                          className="px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Hubungkan
                        </button>
                      </div>
                      {errorMsg && <p className="text-[9px] text-red-600 font-medium">{errorMsg}</p>}
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              /* CASE D: USER LOGGED IN AND SPREADSHEET CONNECTED (ADMIN FULL-CONTROL ONLINE MODE) */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-emerald-50/20 p-4 rounded-xl border border-emerald-100 mt-4">
                
                <div className="md:col-span-7 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Koneksi Google Sheets Aktif (Mode Admin - Sinkronisasi Penuh)</span>
                  </div>
                  
                  <div className="text-[11px] text-gray-600 leading-relaxed font-mono truncate">
                    Spreadsheet ID: <span className="font-semibold bg-white border border-gray-150 px-1 rounded">{spreadsheetId}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-medium">
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>Auto-Sync Aktif (Setiap Perubahan)</span>
                    </span>
                    <span>•</span>
                    <span>
                      Status Sync:{' '}
                      <strong className={`uppercase ${
                        syncStatus === 'syncing' ? 'text-amber-600 animate-pulse' :
                        syncStatus === 'success' ? 'text-emerald-600' :
                        syncStatus === 'error' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {syncStatus === 'syncing' && 'Sinkronisasi...'}
                        {syncStatus === 'success' && 'Tersinkronisasi'}
                        {syncStatus === 'error' && 'Gagal'}
                        {syncStatus === 'idle' && 'Siap'}
                      </strong>
                    </span>
                    {lastSynced && (
                      <>
                        <span>•</span>
                        <span>Terakhir: <strong>{lastSynced}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-wrap gap-2 justify-end shrink-0">
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[10px] font-bold transition-all shadow-2xs"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>

                  <button
                    onClick={onPullData}
                    disabled={syncStatus === 'syncing'}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Tarik data terbaru dari Google Sheets"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Pull (Tarik)</span>
                  </button>

                  <button
                    onClick={onPushData}
                    disabled={syncStatus === 'syncing'}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Unggah data lokal saat ini ke Google Sheets"
                  >
                    <Database className="w-3 h-3" />
                    <span>Push (Unggah)</span>
                  </button>

                  <button
                    onClick={onChangeSheet}
                    className="text-gray-400 hover:text-red-600 text-[10px] font-medium transition-colors cursor-pointer ml-1"
                  >
                    Putuskan Koneksi
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
