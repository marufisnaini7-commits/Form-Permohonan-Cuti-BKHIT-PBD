import React, { useState, useEffect } from 'react';
import { Employee, LeaveRequest, JenisCuti, StatusCuti } from '../types';
import { calculateWorkingDays, formatDateIndo } from '../utils';
import { DocumentPreviewCard } from './DocumentGenerator';
import { Calendar, FileText, FilePlus, AlertCircle, CheckCircle, Info, History, Check } from 'lucide-react';

interface DashboardKaryawanProps {
  employees: Employee[];
  requests: LeaveRequest[];
  onSubmitRequest: (newRequest: LeaveRequest) => void;
}

export const DashboardKaryawan: React.FC<DashboardKaryawanProps> = ({
  employees,
  requests,
  onSubmitRequest
}) => {
  // Selected Employee Context
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Form Fields
  const [jenisCuti, setJenisCuti] = useState<JenisCuti>('Cuti Tahunan');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  const [alamatCuti, setAlamatCuti] = useState('');
  const [telp, setTelp] = useState('');
  
  // Validation / Derived State
  const [durasiHari, setDurasiHari] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedRequestForPreview, setSelectedRequestForPreview] = useState<LeaveRequest | null>(null);

  // Update employee details when selection changes
  useEffect(() => {
    const emp = employees.find(e => e.id === selectedEmpId) || null;
    setSelectedEmp(emp);
    setErrorMsg('');
    setSuccessMsg('');
    if (emp) {
      // Set default contact details if any or clear them
      setTelp('081245588880');
      setAlamatCuti('Sorong');
    }
  }, [selectedEmpId, employees]);

  // Recalculate duration
  useEffect(() => {
    if (tanggalMulai && tanggalSelesai) {
      const days = calculateWorkingDays(tanggalMulai, tanggalSelesai);
      setDurasiHari(days);
    } else {
      setDurasiHari(0);
    }
  }, [tanggalMulai, tanggalSelesai]);

  // Filter requests for currently selected employee
  const personalRequests = requests.filter(req => req.employeeId === selectedEmpId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedEmp) {
      setErrorMsg('Harap pilih nama pegawai terlebih dahulu.');
      return;
    }

    if (!tanggalMulai || !tanggalSelesai) {
      setErrorMsg('Harap tentukan tanggal mulai dan tanggal selesai cuti.');
      return;
    }

    if (new Date(tanggalSelesai) < new Date(tanggalMulai)) {
      setErrorMsg('Tanggal selesai tidak boleh mendahului tanggal mulai.');
      return;
    }

    if (durasiHari <= 0) {
      setErrorMsg('Durasi cuti tidak valid. Pastikan memilih hari kerja (bukan akhir pekan).');
      return;
    }

    if (!alasan.trim()) {
      setErrorMsg('Harap tuliskan alasan pengajuan cuti secara jelas.');
      return;
    }

    if (!alamatCuti.trim()) {
      setErrorMsg('Harap tuliskan alamat selama menjalankan cuti.');
      return;
    }

    if (!telp.trim()) {
      setErrorMsg('Harap masukkan nomor telepon aktif.');
      return;
    }

    // Balance check for Annual Leave (Cuti Tahunan)
    if (jenisCuti === 'Cuti Tahunan' && durasiHari > selectedEmp.sisaCutiN) {
      setErrorMsg(`Saldo sisa cuti tahunan (Tahun N) Anda tidak mencukupi. Sisa saldo N berjalan: ${selectedEmp.sisaCutiN} Hari, Pengajuan: ${durasiHari} Hari.`);
      return;
    }

    const newRequest: LeaveRequest = {
      id: `req-${Date.now()}`,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.nama,
      employeeNip: selectedEmp.nip,
      employeeJabatan: selectedEmp.jabatan,
      employeeMasaKerja: selectedEmp.masaKerja,
      employeeUnitKerja: selectedEmp.unitKerja,
      jenisCuti,
      tanggalMulai,
      tanggalSelesai,
      durasiHari,
      alasan: alasan.trim(),
      alamatCuti: alamatCuti.trim(),
      telp: telp.trim(),
      status: 'Pending',
      tanggalPengajuan: new Date().toISOString().split('T')[0]
    };

    onSubmitRequest(newRequest);
    setSuccessMsg('Permohonan cuti berhasil diajukan sebagai DRAFT! Menunggu review dan persetujuan.');
    
    // Auto preview newly created request
    setSelectedRequestForPreview(newRequest);

    // Reset Form fields except employee, phone and address context
    setTanggalMulai('');
    setTanggalSelesai('');
    setAlasan('');
  };

  // Helper to fetch employee balances for document preview snapshot
  const getBalancesForPreview = (req: LeaveRequest) => {
    const emp = employees.find(e => e.id === req.employeeId);
    if (!emp) {
      return { sisaN: 0, sisaN1: 0, sisaN2: 0 };
    }
    // If approved, the active sisaCutiN has already been deducted.
    // For preview before or during processing, we read the current balance.
    // To show "sisa sebelum", we restore the count if approved
    let sisaN = emp.sisaCutiN;
    if (req.status === 'Disetujui' && req.jenisCuti === 'Cuti Tahunan') {
      sisaN = emp.sisaCutiN + req.durasiHari;
    }
    return {
      sisaN,
      sisaN1: emp.sisaCutiN1,
      sisaN2: emp.sisaCutiN2
    };
  };

  const currentBalances = selectedRequestForPreview 
    ? getBalancesForPreview(selectedRequestForPreview) 
    : { sisaN: 0, sisaN1: 0, sisaN2: 0 };

  const listJenisCuti: JenisCuti[] = [
    'Cuti Tahunan',
    'Cuti Sakit',
    'Cuti Karena Alasan Penting',
    'Cuti Besar',
    'Cuti Melahirkan',
    'Cuti di Luar Tanggungan Negara'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="dashboard-karyawan-root">
      
      {/* LEFT COLUMN: Input Form */}
      <div className="lg:col-span-5 flex flex-col space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <FilePlus className="w-5 h-5 text-indigo-600" />
            <span>Formulir Pengajuan Cuti</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Silakan lengkapi formulir di bawah ini untuk mengajukan permohonan cuti resmi BKHIT Papua Barat Daya.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" id="form-permohonan-cuti">
            
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Pegawai</label>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                id="select-karyawan"
              >
                <option value="">-- Cari Nama Anda --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} ({emp.nip})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Balance Summary */}
            {selectedEmp && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2" id="personal-balance-banner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium uppercase">SISA JATAH CUTI TAHUNAN (N)</p>
                      <p className="text-[10px] text-gray-400 font-mono">Masa Kerja: {selectedEmp.masaKerja}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 font-mono">{selectedEmp.sisaCutiN}</span>
                    <span className="text-[10px] text-gray-500 ml-1">Hari</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200 text-[10px] text-gray-500">
                  <div>Sisa N-1: <span className="font-mono font-semibold">{selectedEmp.sisaCutiN1} Hari</span></div>
                  <div>Sisa N-2: <span className="font-mono font-semibold">{selectedEmp.sisaCutiN2} Hari</span></div>
                </div>
              </div>
            )}

            {/* Type of Leave */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Cuti Yang Diambil**</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-[150px] overflow-y-auto p-1 border border-gray-200 rounded-lg" id="jenis-cuti-selector">
                {listJenisCuti.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setJenisCuti(type)}
                    className={`py-1.5 px-3 text-left text-xs font-medium rounded-md border transition-all flex items-center justify-between ${
                      jenisCuti === type
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                        : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                    }`}
                    id={`btn-jenis-cuti-${type.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span>{type}</span>
                    {jenisCuti === type && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Picker Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={e => setTanggalMulai(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                  id="input-tanggal-mulai"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={e => setTanggalSelesai(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                  id="input-tanggal-selesai"
                />
              </div>
            </div>

            {/* Working Days Duration Preview */}
            {durasiHari > 0 && (
              <div className="bg-indigo-50/70 border border-indigo-100/60 rounded-xl p-3 flex items-center space-x-2.5" id="working-days-banner">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <div className="text-xs">
                  <p className="font-semibold text-indigo-900">Total Hari Kerja: {durasiHari} Hari</p>
                  <p className="text-[10px] text-indigo-700/90 mt-0.5">Sabtu dan Minggu diabaikan secara otomatis.</p>
                </div>
              </div>
            )}

            {/* Reason Text */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan Cuti</label>
              <textarea
                rows={2}
                placeholder="Contoh: Urusan Keluarga mendesak..."
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all placeholder:text-gray-400"
                id="input-alasan-cuti"
              />
            </div>

            {/* Contact Details on Leave (Section VI) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Selama Cuti</label>
                <input
                  type="text"
                  placeholder="Sorong / Jayapura"
                  value={alamatCuti}
                  onChange={e => setAlamatCuti(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                  id="input-alamat-cuti"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">No. Telp (HP)</label>
                <input
                  type="text"
                  placeholder="081245588880"
                  value={telp}
                  onChange={e => setTelp(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                  id="input-telp"
                />
              </div>
            </div>

            {/* Feedback Notifications */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-red-700 text-xs" id="error-banner">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs" id="success-banner">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedEmp}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all text-center ${
                selectedEmp 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-md' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              id="btn-submit-permohonan"
            >
              Ajukan Permohonan Cuti (Kirim Draft)
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-sm">
          <h4 className="text-xs font-bold flex items-center space-x-2 uppercase tracking-wide">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Informasi & Ketentuan BKHIT PBD</span>
          </h4>
          <ul className="mt-3 space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
            <li>Form ini sesuai dengan format resmi lampiran cuti BKHIT Papua Barat Daya.</li>
            <li>Status draft akan dikirimkan ke pimpinan untuk diverifikasi oleh **Mila Yasni Morintoh (Kasubbag Umum)** dan disetujui oleh **I Wayan Kertanegara (Kepala Balai)**.</li>
            <li>Anda dapat mengunduh surat berformat **HTML resmi** yang siap dicetak dan ditandatangani.</li>
          </ul>
        </div>
      </div>

      {/* RIGHT COLUMN: Document Preview & Personal History */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        
        {/* Document Preview Area */}
        {selectedRequestForPreview ? (
          <DocumentPreviewCard 
            request={selectedRequestForPreview}
            sisaN={currentBalances.sisaN}
            sisaN1={currentBalances.sisaN1}
            sisaN2={currentBalances.sisaN2}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center flex flex-col items-center justify-center h-[340px]" id="empty-preview-card">
            <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-3 border border-gray-100">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Preview Dokumen Permohonan</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              Silakan pilih salah satu riwayat permohonan Anda di bawah atau buat pengajuan baru untuk melihat pratinjau dan menunduh dokumen resmi permohonan cuti.
            </p>
          </div>
        )}

        {/* Personal Leave History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-grow">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight flex items-center space-x-2 mb-4">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Riwayat Pengajuan Cuti Anda</span>
          </h2>

          {!selectedEmpId ? (
            <p className="text-xs text-gray-400 italic text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
              Pilih nama pegawai pada form pengajuan untuk melihat riwayat cuti personal.
            </p>
          ) : personalRequests.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
              Belum ada riwayat pengajuan cuti untuk pegawai ini.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="text-[10px] uppercase text-gray-500 bg-gray-50/75 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Tanggal Mulai</th>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3 text-center">Durasi</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {personalRequests.map(req => (
                    <tr 
                      key={req.id} 
                      className={`hover:bg-gray-50 transition-colors ${selectedRequestForPreview?.id === req.id ? 'bg-indigo-50/40' : ''}`}
                      id={`personal-row-${req.id}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatDateIndo(req.tanggalMulai)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-700">{req.jenisCuti}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium">
                        {req.durasiHari} Hari
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          req.status === 'Disetujui' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                            : req.status === 'Ditolak' 
                              ? 'bg-red-50 text-red-800 border-red-100' 
                              : req.status === 'Pending' 
                                ? 'bg-amber-50 text-amber-800 border-amber-100'
                                : 'bg-slate-50 text-slate-800 border-slate-100'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedRequestForPreview(req)}
                          className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-md font-medium transition-all cursor-pointer"
                          id={`btn-view-preview-${req.id}`}
                        >
                          Lihat Surat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
