import { useState, useEffect } from 'react';
import { Employee, LeaveRequest, StatusCuti } from './types';
import { INITIAL_EMPLOYEES, INITIAL_REQUESTS } from './utils';
import { DashboardKaryawan } from './components/DashboardKaryawan';
import { DashboardPimpinan } from './components/DashboardPimpinan';
import { DatabaseCutiView } from './components/DatabaseCutiView';
import { BusinessProcessView } from './components/BusinessProcessView';
import { GoogleSheetsSyncPanel } from './components/GoogleSheetsSyncPanel';
import { initAuth, googleSignIn, logout } from './services/googleAuth';
import { createSpreadsheet, syncToGoogleSheet, fetchFromGoogleSheet } from './services/googleSheets';
import { User } from 'firebase/auth';
import { ClipboardCheck, FileText, Settings, HelpCircle, Building2, CalendarRange } from 'lucide-react';

const LOCAL_STORAGE_EMPLOYEES_KEY = 'spc_employees_v1';
const LOCAL_STORAGE_REQUESTS_KEY = 'spc_requests_v1';

export default function App() {
  // Initialize States from LocalStorage or Default Mock
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'karyawan' | 'pimpinan' | 'database' | 'alur'>('karyawan');
  const [initialized, setInitialized] = useState(false);

  // Google OAuth / Sheets states
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(localStorage.getItem('spc_spreadsheet_id_v1'));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
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
      console.error('Failed to load initial state from localStorage:', e);
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
      console.error('Failed to save to localStorage:', e);
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
        console.error('Auto-sync to Google Sheets failed:', err);
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
      console.error('Google Sign-In failed:', err);
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
      console.error('Logout failed:', err);
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
      console.error('Failed to create new spreadsheet:', err);
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
      console.error('Failed to link existing spreadsheet:', err);
      setSyncStatus('error');
      alert(`Gagal menghubungkan Spreadsheet. Pastikan ID benar dan Anda memiliki hak akses. Error: ${err.message || err}`);
    }
  };

  // Pull (Refresh) Data
  const handlePullData = async (targetId = spreadsheetId, targetToken = accessToken) => {
    if (!targetId || !targetToken) return;
    setSyncStatus('syncing');
    try {
      const data = await fetchFromGoogleSheet(targetId, targetToken);
      setEmployees(data.employees);
      setRequests(data.requests);
      
      localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(data.employees));
      localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(data.requests));
      
      setSyncStatus('success');
      const timeStr = new Date().toLocaleTimeString('id-ID');
      setLastSynced(timeStr);
      localStorage.setItem('spc_last_synced_v1', timeStr);
    } catch (err: any) {
      console.error('Error pulling data from Google Sheet:', err);
      setSyncStatus('error');
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
      console.error('Error pushing data to Google Sheet:', err);
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
          console.error('Failed to sync database reset to Google Sheets:', err);
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
          <nav className="flex space-x-1 py-3" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('karyawan')}
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
              onClick={() => setActiveTab('pimpinan')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'pimpinan'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              id="tab-pimpinan"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Portal Pimpinan (Approval)</span>
              {requests.filter(r => r.status === 'Pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {requests.filter(r => r.status === 'Pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('database')}
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
              onClick={() => setActiveTab('alur')}
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
        </div>
      </div>

      {/* CORE WORKSPACE CONTENT PANEL */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Google Sheets Sync Integration Panel */}
        <GoogleSheetsSyncPanel
          user={user}
          spreadsheetId={spreadsheetId}
          syncStatus={syncStatus}
          lastSynced={lastSynced}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onCreateNewSheet={handleCreateNewSheet}
          onLinkExistingSheet={handleLinkExistingSheet}
          onPullData={() => handlePullData()}
          onPushData={handlePushData}
          onChangeSheet={handleChangeSheet}
          isLoggingIn={isLoggingIn}
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

    </div>
  );
}
