import React, { useState } from 'react';
import { Employee, LeaveRequest, StatusCuti } from '../types';
import { formatDateIndo } from '../utils';
import { DocumentPreviewCard } from './DocumentGenerator';
import { CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, Check, X, ShieldAlert, FileSearch } from 'lucide-react';

interface DashboardPimpinanProps {
  employees: Employee[];
  requests: LeaveRequest[];
  onChangeStatusRequest: (id: string, status: StatusCuti, catatanAtasan: string, catatanPimpinan: string) => void;
}

export const DashboardPimpinan: React.FC<DashboardPimpinanProps> = ({
  employees,
  requests,
  onChangeStatusRequest
}) => {
  const [selectedReqForReview, setSelectedReqForReview] = useState<LeaveRequest | null>(null);
  const [catatanAtasan, setCatatanAtasan] = useState('');
  const [catatanPimpinan, setCatatanPimpinan] = useState('');
  const [feedback, setFeedback] = useState('');

  // Calculate stats
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const approvedRequests = requests.filter(r => r.status === 'Disetujui');
  const otherRequests = requests.filter(r => r.status !== 'Pending' && r.status !== 'Disetujui');

  // Find the employee of the reviewed request to show sisa cuti
  const getBalances = (req: LeaveRequest | null) => {
    if (!req) return { sisaN: 0, sisaN1: 0, sisaN2: 0 };
    const emp = employees.find(e => e.id === req.employeeId);
    if (!emp) return { sisaN: 0, sisaN1: 0, sisaN2: 0 };
    
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

  const handleUpdateStatus = (id: string, status: StatusCuti) => {
    const finalAtasan = catatanAtasan.trim() || 'Disetujui/dipertimbangkan oleh Kasubbag Umum.';
    const finalPimpinan = catatanPimpinan.trim() || 'Disetujui oleh Kepala Balai.';
    
    onChangeStatusRequest(id, status, finalAtasan, finalPimpinan);
    setFeedback(`Status permohonan berhasil diubah menjadi: ${status.toUpperCase()}!`);
    
    // Refresh selected state preview
    const req = requests.find(r => r.id === id);
    if (req) {
      setSelectedReqForReview({ 
        ...req, 
        status, 
        catatanAtasan: finalAtasan,
        catatanPimpinan: finalPimpinan 
      });
    }
    
    setTimeout(() => setFeedback(''), 4000);
  };

  const balances = getBalances(selectedReqForReview);

  return (
    <div className="space-y-6" id="dashboard-pimpinan-root">
      
      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Pending */}
        <div className="bg-white rounded-xl p-5 border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Menunggu Review</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{pendingRequests.length}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Approved */}
        <div className="bg-white rounded-xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Telah Disetujui</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{approvedRequests.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Other Statuses */}
        <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Perubahan / Ditangguhkan / Ditolak</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{otherRequests.length}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total */}
        <div className="bg-white rounded-xl p-5 border border-indigo-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Pengajuan</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{totalRequests}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-medium flex items-center space-x-2 animate-fadeIn" id="pimpinan-feedback">
          <Check className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* CORE WORKPLACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Inbox List / Incoming Request Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[650px]">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900">Kotak Masuk Permintaan Cuti</h2>
            <p className="text-xs text-gray-500 mt-1">
              Daftar pengajuan cuti pegawai BKHIT Papua Barat Daya untuk diverifikasi & disetujui.
            </p>
          </div>

          <div className="space-y-3 overflow-y-auto flex-grow pr-1" id="inbox-container">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Belum ada pengajuan cuti yang masuk.</div>
            ) : (
              requests.map(req => {
                const balSnapshot = getBalances(req);
                const isSelected = selectedReqForReview?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedReqForReview(req);
                      setCatatanAtasan(req.catatanAtasan || '');
                      setCatatanPimpinan(req.catatanPimpinan || '');
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                    id={`inbox-item-${req.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-gray-900">{req.employeeName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        req.status === 'Disetujui' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                          : req.status === 'Ditolak' 
                            ? 'bg-red-50 text-red-800 border-red-100' 
                            : req.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-100'
                              : 'bg-purple-50 text-purple-800 border-purple-100'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-500 mb-2">
                      <div>Jenis: <span className="font-semibold text-gray-700">{req.jenisCuti}</span></div>
                      <div className="text-right">Durasi: <span className="font-semibold text-gray-700">{req.durasiHari} Hari</span></div>
                      <div>Mulai: <span>{formatDateIndo(req.tanggalMulai)}</span></div>
                      <div className="text-right font-mono text-[10px] text-gray-400">Sisa Cuti N: {balSnapshot.sisaN} Hari</div>
                    </div>

                    <p className="text-[11px] text-gray-600 line-clamp-1 italic">
                      "{req.alasan}"
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed Evaluation & Preview Column */}
        <div className="lg:col-span-7 flex flex-col h-[650px]">
          {selectedReqForReview ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
              
              {/* Document Preview on Left portion */}
              <div className="md:col-span-7 h-full flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto">
                  <DocumentPreviewCard 
                    request={selectedReqForReview}
                    sisaN={balances.sisaN}
                    sisaN1={balances.sisaN1}
                    sisaN2={balances.sisaN2}
                  />
                </div>
              </div>

              {/* Approval controls on Right portion */}
              <div className="md:col-span-5 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col h-full justify-between overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-2">Evaluasi Persetujuan</h3>
                  
                  <div className="space-y-3.5 text-xs text-gray-600">
                    <div>
                      <p className="text-gray-400 font-medium uppercase text-[9px]">Nama Pegawai</p>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{selectedReqForReview.employeeName}</p>
                      <p className="text-gray-500 mt-0.5 font-mono text-[10px]">NIP. {selectedReqForReview.employeeNip}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 font-medium uppercase text-[9px]">Jenis & Durasi Cuti</p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {selectedReqForReview.jenisCuti} ({selectedReqForReview.durasiHari} Hari Kerja)
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-[10px] border border-gray-100">
                      <div>
                        <p className="text-gray-400 font-medium text-[8px] uppercase">Sisa N</p>
                        <p className="font-bold text-gray-900 font-mono text-xs">{balances.sisaN} H</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium text-[8px] uppercase">Sisa N-1</p>
                        <p className="font-bold text-gray-900 font-mono text-xs">{balances.sisaN1} H</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium text-[8px] uppercase">Sisa N-2</p>
                        <p className="font-bold text-gray-900 font-mono text-xs">{balances.sisaN2} H</p>
                      </div>
                    </div>

                    {selectedReqForReview.jenisCuti === 'Cuti Tahunan' && (
                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] text-indigo-800 leading-relaxed">
                        <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 inline mr-1 mb-0.5" />
                        Persetujuan cuti ini akan mengurangi jatah sisa cuti N berjalan sebanyak <strong>{selectedReqForReview.durasiHari} Hari</strong>.
                      </div>
                    )}

                    {/* VII. Atasan Notes */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-[10px] uppercase">VII. Catatan Kasubbag Umum (Mila Yasni M.)</label>
                      <textarea
                        rows={2}
                        placeholder="Catatan pertimbangan atasan..."
                        value={catatanAtasan}
                        onChange={e => setCatatanAtasan(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                        id="input-catatan-atasan"
                      />
                    </div>

                    {/* VIII. Pimpinan Notes */}
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-[10px] uppercase">VIII. Catatan Kepala Balai (I Wayan K.)</label>
                      <textarea
                        rows={2}
                        placeholder="Catatan persetujuan Kepala Balai..."
                        value={catatanPimpinan}
                        onChange={e => setCatatanPimpinan(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                        id="input-catatan-pimpinan"
                      />
                    </div>
                  </div>
                </div>

                {/* Review Action Buttons */}
                <div className="space-y-2 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedReqForReview.id, 'Disetujui')}
                      className="flex items-center justify-center space-x-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-all cursor-pointer"
                      id="btn-setujui"
                    >
                      <span>Setujui</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReqForReview.id, 'Ditolak')}
                      className="flex items-center justify-center space-x-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition-all cursor-pointer"
                      id="btn-tolak"
                    >
                      <span>Tolak</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedReqForReview.id, 'Perubahan')}
                      className="flex items-center justify-center space-x-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-xs transition-all cursor-pointer"
                      id="btn-perubahan"
                    >
                      <span>Perubahan</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReqForReview.id, 'Ditangguhkan')}
                      className="flex items-center justify-center space-x-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-semibold text-xs transition-all cursor-pointer"
                      id="btn-ditangguhkan"
                    >
                      <span>Tangguhkan</span>
                    </button>
                  </div>

                  {selectedReqForReview.status !== 'Pending' && (
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-center text-[10px] text-gray-500 font-medium">
                      Status Saat Ini: <span className="font-bold text-gray-800">{selectedReqForReview.status}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center flex flex-col items-center justify-center h-full" id="pimpinan-empty-view">
              <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-3 border border-gray-100">
                <FileSearch className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Evaluasi Pengajuan Cuti</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Silakan pilih salah satu pengajuan dari Kotak Masuk di sebelah kiri untuk melakukan review dokumen, sisa saldo cuti, dan memberikan keputusan persetujuan.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
