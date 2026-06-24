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
  Lock
} from 'lucide-react';

interface GoogleSheetsSyncPanelProps {
  user: User | null;
  spreadsheetId: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSynced: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onCreateNewSheet: () => void;
  onLinkExistingSheet: (id: string) => void;
  onPullData: () => void;
  onPushData: () => void;
  onChangeSheet: () => void;
  isLoggingIn: boolean;
}

export const GoogleSheetsSyncPanel: React.FC<GoogleSheetsSyncPanelProps> = ({
  user,
  spreadsheetId,
  syncStatus,
  lastSynced,
  onLogin,
  onLogout,
  onCreateNewSheet,
  onLinkExistingSheet,
  onPullData,
  onPushData,
  onChangeSheet,
  isLoggingIn
}) => {
  const [inputSheetId, setInputSheetId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputSheetId.trim();
    if (!cleanId) {
      setErrorMsg('ID Spreadsheet tidak boleh kosong.');
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-6" id="google-sheets-panel-root">
      
      {/* HEADER STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
              <span>Google Sheets Database Sync</span>
              {spreadsheetId ? (
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-100 text-emerald-800 rounded-md">AKTIF</span>
              ) : (
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-gray-100 text-gray-600 rounded-md">NON-AKTIF (LOCAL)</span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Hubungkan sistem cuti dengan Google Sheets untuk menyimpan data pegawai & riwayat cuti secara permanen.
            </p>
          </div>
        </div>

        {/* Auth Button at Top Right */}
        <div className="self-start md:self-auto">
          {user ? (
            <div className="flex items-center space-x-3 bg-slate-50 border border-gray-100 py-1 px-3 rounded-xl text-xs">
              <span className="text-gray-600">Signed in as <strong className="text-gray-900">{user.displayName || user.email}</strong></span>
              <button 
                onClick={onLogout}
                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                title="Log out dari Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              id="btn-google-login"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in dengan Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* CORE CONTENT */}
      {!user ? (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
          <p className="text-xs text-gray-600 leading-relaxed max-w-xl mx-auto">
            💡 <strong>Mode Offline Aktif (Local Storage):</strong> Data perubahan Anda saat ini hanya tersimpan sementara di browser. Silakan klik tombol <strong>"Sign in dengan Google"</strong> untuk menyinkronkan langsung ke Google Sheets agar aman dan dapat dibuka bersama rekan kerja.
          </p>
        </div>
      ) : !spreadsheetId ? (
        // LOGGED IN, NO SPREADSHEET CONNECTED
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs">
            🎉 Anda telah berhasil masuk menggunakan akun Google Anda! Sekarang, silakan pilih salah satu opsi di bawah untuk menghubungkan basis data cuti Anda.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Opsi 1: Buat Baru */}
            <div className="bg-white border border-gray-100 hover:border-emerald-200 rounded-xl p-5 shadow-xs transition-colors">
              <h4 className="font-bold text-xs text-emerald-800 flex items-center space-x-1.5 uppercase tracking-wide">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Opsi A: Buat Baru Otomatis</span>
              </h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Sistem akan membuat Google Spreadsheet baru bernama <strong>"Database Cuti BKHIT Papua Barat Daya"</strong> di Google Drive Anda, lalu mengisinya dengan data pegawai awal.
              </p>
              <button
                onClick={onCreateNewSheet}
                className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                id="btn-create-sheet"
              >
                Buat Spreadsheet Baru
              </button>
            </div>

            {/* Opsi 2: Hubungkan yang Ada */}
            <div className="bg-white border border-gray-100 hover:border-indigo-200 rounded-xl p-5 shadow-xs transition-colors">
              <h4 className="font-bold text-xs text-indigo-800 flex items-center space-x-1.5 uppercase tracking-wide">
                <Link2 className="w-4 h-4 text-indigo-600" />
                <span>Opsi B: Hubungkan yang Sudah Ada</span>
              </h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Jika Anda memiliki Spreadsheet yang dibuat sebelumnya, tempel URL atau ID Spreadsheet tersebut untuk menghubungkannya kembali.
              </p>
              <form onSubmit={handleLinkSubmit} className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan ID / URL Spreadsheet"
                    value={inputSheetId}
                    onChange={e => setInputSheetId(e.target.value)}
                    className="flex-grow text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Hubungkan
                  </button>
                </div>
                {errorMsg && <p className="text-[10px] text-red-600">{errorMsg}</p>}
              </form>
            </div>
          </div>
        </div>
      ) : (
        // LOGGED IN & CONNECTED TO SPREADSHEET
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-slate-50/50 p-4 rounded-xl border border-gray-100">
          
          {/* Status info */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sistem Terkoneksi dengan Google Sheets</span>
            </div>
            
            <div className="text-xs text-gray-600 leading-relaxed font-mono text-[11px] truncate">
              ID Sheet: <span className="font-bold bg-white px-1.5 py-0.5 rounded border border-gray-100">{spreadsheetId}</span>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>Auto-Sync Aktif (Setiap Perubahan)</span>
              </span>
              <span>•</span>
              <span>
                Status Sinkronisasi:{' '}
                <strong className={`font-semibold uppercase ${
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
                  <span>Terakhir Sinkron: <strong>{lastSynced}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="md:col-span-5 flex flex-wrap gap-2 justify-end">
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
            >
              <span>Buka Google Sheet</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>

            <button
              onClick={onPullData}
              disabled={syncStatus === 'syncing'}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              title="Tarik data terbaru dari Google Sheets"
            >
              <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Segarkan (Pull)</span>
            </button>

            <button
              onClick={onPushData}
              disabled={syncStatus === 'syncing'}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              title="Unggah data saat ini ke Google Sheets"
            >
              <Database className="w-3 h-3" />
              <span>Unggah (Push)</span>
            </button>

            <button
              onClick={onChangeSheet}
              className="text-gray-400 hover:text-red-600 text-[10px] font-medium transition-colors cursor-pointer"
            >
              Putuskan Koneksi
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
