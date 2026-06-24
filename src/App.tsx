import { useState, useEffect } from 'react';
import { Employee, LeaveRequest, StatusCuti } from './types';
import { INITIAL_EMPLOYEES, INITIAL_REQUESTS } from './utils';
import { DashboardKaryawan } from './components/DashboardKaryawan';
import { DashboardPimpinan } from './components/DashboardPimpinan';
import { DatabaseCutiView } from './components/DatabaseCutiView';
import { BusinessProcessView } from './components/BusinessProcessView';
import { GoogleSheetsSyncPanel } from './components/GoogleSheetsSyncPanel';
import { initAuth, googleSignIn, logout } from './services/googleAuth';
import { createSpreadsheet, syncToGoogleSheet, fetchFromGoogleSheet, fetchFromPublicGoogleSheet } from './services/googleSheets';
import { User } from 'firebase/auth';
import { ClipboardCheck, FileText, Settings, HelpCircle, Building2, CalendarRange, Lock, Unlock, Key } from 'lucide-react';

const LOCAL_STORAGE_EMPLOYEES_KEY = 'spc_employees_v1';
const LOCAL_STORAGE_REQUESTS_KEY = 'spc_requests_v1';

export default function App() {
  // Initialize States from LocalStorage or Default Mock
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'karyawan' | 'pimpinan' | 'database' | 'alur'>('karyawan');
  const [initialized, setInitialized] = useState(false);

  // Passcode / PIN States for Tab Locking
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingTab, setPendingTab] = useState<'pimpinan' | 'database' | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(() => !!sessionStorage.getItem('spc_unlocked_v1'));
  const [savedPin, setSavedPin] = useState(() => localStorage.getItem('spc_pimpinan_pin_v1') || '1971');

  // Google OAuth / Sheets states
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(localStorage.getItem('spc_spreadsheet_id_v1'));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(localStorage.getItem('spc_last_synced_v1'));
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load Initial State & Google Auth
  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem(LOCAL_STORAGE_EMPLOYEES_KEY);
      const storedRequests = localStorage.getItem(LOCAL_STORAGE_REQUESTS_KEY);

      if (storedEmployees) {
        setEmployees(JSON.parse(storedEmployees));
      } else {
        setEmployees(INITIAL_EMPLOYEES);
        localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(INITIAL_EMPLOYEES));
      }

      if (storedRequests) {
        setRequests(JSON.parse(storedRequests));
      } else {
        setRequests(INITIAL_REQUESTS);
        localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(INITIAL_REQUESTS));
      }
    } catch (e) {
      console.warn('Failed to load initial state from localStorage:', e);
      setEmployees(INITIAL_EMPLOYEES);
      setRequests(INITIAL_REQUESTS);
    } finally {
      setInitialized(true);
    }

    // Initialize Google Auth listener
    initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        
        // If we have a spreadsheet ID, pull data from Google Sheets immediately
        const storedSpreadsheetId = localStorage.getItem('spc_spreadsheet_id_v1');
        if (storedSpreadsheetId) {
          handlePullData(storedSpreadsheetId, token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
        
        // If we have a spreadsheet ID but no authenticated token, pull data publicly
        const storedSpreadsheetId = localStorage.getItem('spc_spreadsheet_id_v1');
        if (storedSpreadsheetId) {
          handlePullData(storedSpreadsheetId, null);
        }
      }
    );
  }, []);

  // Helper to save locally & sync in background if connected
  const saveAndSync = async (updatedEmployees: Employee[], updatedRequests: LeaveRequest[]) => {
    setEmployees(updatedEmployees);
    setRequests(updatedRequests);
    
    try {
      localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(updatedEmployees));
      localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(updatedRequests));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    // Auto sync to Google Sheets if connected
    if (spreadsheetId && accessToken) {
      setSyncStatus('syncing');
      try {
        await syncToGoogleSheet(spreadsheetId, updatedEmployees, updatedRequests, accessToken);
        setSyncStatus('success');
        const timeStr = new Date().toLocaleTimeString('id-ID');
        setLastSynced(timeStr);
        localStorage.setItem('spc_last_synced_v1', timeStr);
      } catch (err) {
        console.warn('Auto-sync to Google Sheets failed:', err);
        setSyncStatus('error');
      }
    }
  };

  // Google Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        
        // If we already have a spreadsheet ID linked, pull from it
        const storedId = localStorage.getItem('spc_spreadsheet_id_v1');
        if (storedId) {
          await handlePullData(storedId, result.accessToken);
        }
      }
    } catch (err) {
      console.warn('Google Sign-In failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
    } catch (err) {
      console.warn('Logout failed:', err);
    }
  };

  // Create New Spreadsheet
  const handleCreateNewSheet = async () => {
    if (!accessToken) return;
    setSyncStatus('syncing');
    try {
      const newId = await createSpreadsheet(accessToken);
      setSpreadsheetId(newId);
      localStorage.setItem('spc_spreadsheet_id_v1', newId);
      
      // Upload current local data to newly created sheet
      await syncToGoogleSheet(newId, employees, requests, accessToken);
      
      setSyncStatus('success');
      const timeStr = new Date().toLocaleTimeString('id-ID');
      setLastSynced(timeStr);
      localStorage.setItem('spc_last_synced_v1', timeStr);
      alert('Google Spreadsheet baru berhasil dibuat dan disinkronkan di Google Drive Anda!');
    } catch (err: any) {
      console.warn('Failed to create new spreadsheet:', err);
      setSyncStatus('error');
      alert(`Gagal membuat Spreadsheet: ${err.message || err}`);
    }
  };

  // Link Existing Spreadsheet
  const handleLinkExistingSheet = async (id: string) => {
    if (!accessToken) return;
    setSyncStatus('syncing');
    try {
      const data = await fetchFromGoogleSheet(id, accessToken);
      setEmployees(data.employees);
      setRequests(data.requests);
      
      // Save locally
      localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(data.employees));
      localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(data.requests));
      
      setSpreadsheetId(id);
      localStorage.setItem('spc_spreadsheet_id_v1', id);
      
      setSyncStatus('success');
      const timeStr = new Date().toLocaleTimeString('id-ID');
      setLastSynced(timeStr);
      localStorage.setItem('spc_last_synced_v1', timeStr);
      alert('Google Sheet berhasil dihubungkan dan data berhasil disinkronkan!');
    } catch (err: any) {
      console.warn('Failed to link existing spreadsheet:', err);
      setSyncStatus('error');
      alert(`Gagal menghubungkan Spreadsheet. Pastikan ID benar dan Anda memiliki hak akses. Error: ${err.message || err}`);
    }
  };

  // Pull (Refresh) Data
  const handlePullData = async (targetId = spreadsheetId, targetToken = accessToken) => {
    if (!targetId) return;
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      let data;
      if (targetToken) {
        // Mode Terautentikasi (Pimpinan)
        data = await fetchFromGoogleSheet(targetId, targetToken);
      } else {
        // Mode Publik (Pegawai)
        data = await fetchFromPublicGoogleSheet(targetId);
      }
      setEmployees(data.employees);
      setRequests(data.requests);
      
      localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(data.employees));
      localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(data.requests));
      
      setSyncStatus('success');
      const timeStr = new Date().toLocaleTimeString('id-ID');
      setLastSynced(timeStr);
      localStorage.setItem('spc_last_synced_v1', timeStr);
    } catch (err: any) {
      console.warn('Error pulling data from Google Sheet:', err);
      setSyncStatus('error');
      let friendlyMessage = err.message || String(err);
      if (friendlyMessage.includes('Failed to fetch') || friendlyMessage.includes('fetch')) {
        friendlyMessage = 'Gagal memuat data dari Google Sheet. Hal ini biasanya terjadi karena Spreadsheet belum dibagikan secara publik. Harap pastikan Spreadsheet Anda disetel ke "Siapa saja yang memiliki link dapat melihat" (Viewer / Pengakses lihat-saja) di menu Bagikan (Share) Google Sheets.';
      }
      setSyncError(friendlyMessage);
    }
  };

  // Push Data (Explicit update with confirmation)
  const handlePushData = async () => {
    if (!spreadsheetId || !accessToken) return;
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengunggah data saat ini ke Google Sheets? Tindakan ini akan menimpa seluruh data pegawai dan riwayat cuti yang ada di Google Sheet tersebut.'
    );
    if (!confirmed) return;

    setSyncStatus('syncing');
    try {
      await syncToGoogleSheet(spreadsheetId, employees, requests, accessToken);
      setSyncStatus('success');
      const timeStr = new Date().toLocaleTimeString('id-ID');
      setLastSynced(timeStr);
      localStorage.setItem('spc_last_synced_v1', timeStr);
      alert('Data berhasil diunggah ke Google Sheets!');
    } catch (err: any) {
      console.warn('Error pushing data to Google Sheet:', err);
      setSyncStatus('error');
      alert(`Gagal mengunggah data: ${err.message || err}`);
    }
  };

  // Disconnect Sheet
  const handleChangeSheet = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin memutuskan koneksi dengan Spreadsheet ini? Data Anda akan tetap aman di Google Drive, dan sistem akan kembali menggunakan database local di browser Anda.'
    );
    if (!confirmed) return;
    
    setSpreadsheetId(null);
    localStorage.removeItem('spc_spreadsheet_id_v1');
    localStorage.removeItem('spc_last_synced_v1');
    setLastSynced(null);
    setSyncStatus('idle');
  };

  // Lock admin / leadership tabs
  const handleLockPimpinan = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('spc_unlocked_v1');
    setActiveTab('karyawan');
  };

  // Tab click interceptor with passcode check
  const handleTabClick = (tab: 'karyawan' | 'pimpinan' | 'database' | 'alur') => {
    if (tab === 'pimpinan') {
      if (!isUnlocked) {
        setPendingTab(tab);
        setShowPinModal(true);
        setPinValue('');
        setPinError('');
        return;
      }
    }
    setActiveTab(tab);
  };

  // Verify PIN entered by user
  const handleVerifyPin = (enteredPin: string) => {
    if (enteredPin === savedPin) {
      setIsUnlocked(true);
      sessionStorage.setItem('spc_unlocked_v1', 'true');
      setShowPinModal(false);
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
    } else {
      setPinError('PIN yang Anda masukkan salah. Silakan coba lagi.');
    }
  };

  // Handle New Leave Submission
  const handleSubmitRequest = (newRequest: LeaveRequest) => {
    const updated = [newRequest, ...requests];
    saveAndSync(employees, updated);
  };

  // Handle status changing (Disetujui, Perubahan, Ditangguhkan, Ditolak) with balance restoration / deduction
  const handleChangeStatusRequest = (id: string, newStatus: StatusCuti, catatanAtasan: string, catatanPimpinan: string) => {
    const originalRequest = requests.find(r => r.id === id);
    if (!originalRequest) return;

    const oldStatus = originalRequest.status;

    // 1. Update the request status & comments
    const updatedRequests = requests.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: newStatus,
          catatanAtasan,
          catatanPimpinan,
          tanggalPersetujuan: new Date().toISOString().split('T')[0]
        };
      }
      return req;
    });

    let updatedEmployees = [...employees];

    // 2. Adjust balances for Cuti Tahunan transition
    if (originalRequest.jenisCuti === 'Cuti Tahunan') {
      const duration = originalRequest.durasiHari;
      
      updatedEmployees = employees.map(emp => {
        if (emp.id === originalRequest.employeeId) {
          let balance = emp.sisaCutiN;
          
          // Transition TO Disetujui
          if (newStatus === 'Disetujui' && oldStatus !== 'Disetujui') {
            balance = Math.max(0, balance - duration);
          }
          // Transition FROM Disetujui
          else if (oldStatus === 'Disetujui' && newStatus !== 'Disetujui') {
            balance = balance + duration;
          }

          return {
            ...emp,
            sisaCutiN: balance
          };
        }
        return emp;
      });
    }

    saveAndSync(updatedEmployees, updatedRequests);
  };

  // Reset database back to default initial values
  const handleResetDatabase = async () => {
    if (confirm('Apakah Anda yakin ingin me-reset database sisa cuti dan daftar pengajuan kembali ke data contoh BKHIT Papua Barat Daya?')) {
      if (spreadsheetId && accessToken) {
        setSyncStatus('syncing');
        try {
          await syncToGoogleSheet(spreadsheetId, INITIAL_EMPLOYEES, INITIAL_REQUESTS, accessToken);
          setSyncStatus('success');
          const timeStr = new Date().toLocaleTimeString('id-ID');
          setLastSynced(timeStr);
          localStorage.setItem('spc_last_synced_v1', timeStr);
        } catch (err) {
          console.warn('Failed to sync database reset to Google Sheets:', err);
          setSyncStatus('error');
        }
      }

      setEmployees(INITIAL_EMPLOYEES);
      setRequests(INITIAL_REQUESTS);
      localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(INITIAL_EMPLOYEES));
      localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(INITIAL_REQUESTS));
      alert('Database berhasil di-reset!');
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 font-medium">Memuat Database Sisa Cuti BKHIT PBD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-gray-800 font-sans flex flex-col" id="app-root">
      
      {/* HEADER NAV BAR */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-sm" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-950 rounded-xl text-indigo-400 border border-indigo-900">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center space-x-1.5">
                  <span>Sistem Cuti Pegawai (BKHIT)</span>
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-indigo-900 text-indigo-300 rounded-md uppercase">RESMI</span>
                </h1>
                <p className="text-[10px] md:text-xs text-slate-300 flex items-center space-x-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>Karantina Papua Barat Daya</span>
                </p>
              </div>
            </div>

            {/* Quick Context Switch Warning */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <p className="text-[11px] font-medium text-slate-300">Sorong, Papua Barat Daya</p>
            </div>

          </div>
        </div>
      </header>

      {/* NAVIGATION TABS RAIL */}
      <div className="bg-white border-b border-gray-200/80 shadow-xs" id="navigation-tabs-rail">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
            <nav className="flex flex-wrap gap-1 py-2" aria-label="Tabs">
              <button
                onClick={() => handleTabClick('karyawan')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'karyawan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                id="tab-karyawan"
              >
                <FileText className="w-4 h-4" />
                <span>Portal Pegawai (Form Cuti)</span>
              </button>

              <button
                onClick={() => handleTabClick('pimpinan')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                  activeTab === 'pimpinan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                id="tab-pimpinan"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Portal Pimpinan (Approval)</span>
                {!isUnlocked && <Lock className="w-3 h-3 text-gray-400 ml-1" />}
                {requests.filter(r => r.status === 'Pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {requests.filter(r => r.status === 'Pending').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabClick('database')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'database'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                id="tab-database"
              >
                <Settings className="w-4 h-4" />
                <span>Database Sisa Cuti</span>
              </button>

              <button
                onClick={() => handleTabClick('alur')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'alur'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                id="tab-alur"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Bisnis Proses</span>
              </button>
            </nav>

            {isUnlocked && (
              <div className="flex items-center space-x-2 py-2 sm:py-0 self-end sm:self-auto">
                <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center space-x-1">
                  <Unlock className="w-3 h-3 text-emerald-500" />
                  <span>Sesi Pimpinan Aktif</span>
                </span>
                <button
                  onClick={handleLockPimpinan}
                  className="flex items-center space-x-1 text-[11px] font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-3 py-1 rounded-lg transition-all cursor-pointer"
                  title="Kunci kembali portal pimpinan"
                >
                  <Lock className="w-3 h-3" />
                  <span>Kunci Portal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE CONTENT PANEL */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Google Sheets Sync Integration Panel */}
        <GoogleSheetsSyncPanel
          user={user}
          spreadsheetId={spreadsheetId}
          syncStatus={syncStatus}
          syncError={syncError}
          lastSynced={lastSynced}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onCreateNewSheet={handleCreateNewSheet}
          onLinkExistingSheet={handleLinkExistingSheet}
          onPullData={() => handlePullData()}
          onPushData={handlePushData}
          onChangeSheet={handleChangeSheet}
          isLoggingIn={isLoggingIn}
          isUnlocked={isUnlocked}
        />

        {activeTab === 'karyawan' && (
          <DashboardKaryawan
            employees={employees}
            requests={requests}
            onSubmitRequest={handleSubmitRequest}
          />
        )}

        {activeTab === 'pimpinan' && (
          <DashboardPimpinan
            employees={employees}
            requests={requests}
            onChangeStatusRequest={handleChangeStatusRequest}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseCutiView
            employees={employees}
            onUpdateEmployees={(updated) => saveAndSync(updated, requests)}
            onResetDatabase={handleResetDatabase}
            savedPin={savedPin}
            onChangePin={(newPin) => {
              setSavedPin(newPin);
              localStorage.setItem('spc_pimpinan_pin_v1', newPin);
            }}
            isUnlocked={isUnlocked}
          />
        )}

        {activeTab === 'alur' && (
          <BusinessProcessView />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-3">
          <p>© 2026 Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya. Layanan Kepegawaian Resmi.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-gray-500 font-semibold">Integrasi Database Aktif</span>
            </span>
            <span>•</span>
            <span>
              {spreadsheetId ? 'Tersambung Google Sheets' : 'Local Storage Engine'}
            </span>
          </div>
        </div>
      </footer>

      {/* PIN SECURITY OVERLAY MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-9999 p-4 animate-fadeIn" id="pin-modal-overlay">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden" id="pin-modal-container">
            
            {/* Top Security Banner Accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600"></div>

            {/* Icon */}
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 border border-indigo-100">
              <Lock className="w-6 h-6" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              Verifikasi PIN Keamanan
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
              Menu ini memerlukan verifikasi PIN Keamanan Pimpinan.
            </p>

            {/* Keyboard Input Wrapper */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyPin(pinValue);
              }}
              className="w-full mt-6"
            >
              <input
                type="password"
                placeholder="Masukkan PIN"
                value={pinValue}
                onChange={(e) => {
                  setPinValue(e.target.value);
                  setPinError('');
                }}
                className="w-full tracking-widest text-center text-xl font-bold font-mono border-2 border-gray-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3 outline-none"
                autoFocus
                maxLength={10}
                id="pin-password-input"
              />

              {pinError && (
                <p className="text-xs font-semibold text-red-500 mt-2 bg-red-50/50 border border-red-100/50 rounded-lg px-2 py-1 flex items-center justify-center space-x-1 animate-pulse">
                  <span>{pinError}</span>
                </p>
              )}

              {/* TACTILE KEYPAD (For Touch Screen and Extra Polish) */}
              <div className="grid grid-cols-3 gap-2 mt-4 max-w-[240px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setPinValue(prev => (prev + num).slice(0, 10));
                      setPinError('');
                    }}
                    className="h-12 w-12 rounded-full border border-gray-100 bg-gray-50/50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-sm font-bold text-gray-700 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Clear (C) */}
                <button
                  type="button"
                  onClick={() => {
                    setPinValue('');
                    setPinError('');
                  }}
                  className="h-12 w-12 rounded-full border border-red-50 hover:bg-red-50 hover:text-red-600 text-xs font-bold text-gray-400 transition-all flex items-center justify-center cursor-pointer"
                >
                  Clear
                </button>

                {/* Zero (0) */}
                <button
                  type="button"
                  onClick={() => {
                    setPinValue(prev => (prev + '0').slice(0, 10));
                    setPinError('');
                  }}
                  className="h-12 w-12 rounded-full border border-gray-100 bg-gray-50/50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-sm font-bold text-gray-700 transition-all flex items-center justify-center cursor-pointer active:scale-95"
                >
                  0
                </button>

                {/* Backspace (Delete) */}
                <button
                  type="button"
                  onClick={() => {
                    setPinValue(prev => prev.slice(0, -1));
                    setPinError('');
                  }}
                  className="h-12 w-12 rounded-full border border-gray-100 bg-gray-50/50 hover:bg-indigo-50 hover:text-indigo-600 text-sm font-bold text-gray-400 transition-all flex items-center justify-center cursor-pointer"
                  title="Hapus Karakter Terakhir"
                >
                  ⌫
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPendingTab(null);
                  }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/25 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Konfirmasi
                </button>
              </div>
            </form>

            {/* Hint footer */}
            <div className="mt-4 text-[10px] text-gray-400 border-t border-gray-50 pt-3 w-full">
              <span>Petunjuk: PIN standar sistem adalah </span>
              <span className="font-mono font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1 py-0.5 rounded">1971</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
