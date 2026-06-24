import React from 'react';
import { BusinessProcessStep } from '../types';
import { ClipboardList, Calculator, FileCheck, Search, ShieldCheck, CheckSquare } from 'lucide-react';

const STEPS: BusinessProcessStep[] = [
  {
    step: 1,
    title: 'Input Pengajuan Cuti',
    description: 'Pegawai memilih identitas, menginput jenis cuti (Cuti Tahunan, Sakit, Alasan Penting, Besar, Melahirkan, atau CLTN), tanggal mulai & selesai, alasan pengajuan cuti, serta alamat & nomor kontak selama cuti.',
    actor: 'Karyawan'
  },
  {
    step: 2,
    title: 'Validasi Sisa Cuti & Hari Kerja',
    description: 'Sistem secara otomatis menghitung durasi hari kerja (mengecualikan hari Sabtu dan Minggu) serta mengecek sisa saldo cuti pegawai berjalan (N).',
    actor: 'Sistem'
  },
  {
    step: 3,
    title: 'Submit & Generate Draft Surat',
    description: 'Pegawai mengirimkan permohonan. Sistem mencatat status sebagai "Pending" dan menggenerate pratinjau dokumen formal lampiran cuti BKHIT Papua Barat Daya.',
    actor: 'Sistem'
  },
  {
    step: 4,
    title: 'Review & Preview oleh Atasan',
    description: 'Pimpinan mengakses modul approval untuk mempreview surat permohonan cuti resmi, melengkapi Catatan Atasan (Kasubbag Umum) dan Catatan Kepala Balai.',
    actor: 'Pimpinan'
  },
  {
    step: 5,
    title: 'Keputusan (Setujui / Tolak / Ditangguhkan / Perubahan)',
    description: 'Status permohonan diubah sesuai pilihan. Tanda tangan digital disematkan secara otomatis di dokumen formulir.',
    actor: 'Pimpinan'
  },
  {
    step: 6,
    title: 'Update Database & Cetak Surat',
    description: 'Sisa saldo cuti N otomatis terpotong jika disetujui. Pegawai dapat mencetak langsung atau mengunduh formulir cuti berformat HTML resmi siap cetak.',
    actor: 'Sistem'
  }
];

export const BusinessProcessView: React.FC = () => {
  const getIcon = (step: number) => {
    switch (step) {
      case 1: return <ClipboardList className="w-5 h-5 text-indigo-600" />;
      case 2: return <Calculator className="w-5 h-5 text-indigo-600" />;
      case 3: return <FileCheck className="w-5 h-5 text-indigo-600" />;
      case 4: return <Search className="w-5 h-5 text-indigo-600" />;
      case 5: return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 6: return <CheckSquare className="w-5 h-5 text-indigo-600" />;
      default: return <ClipboardList className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getActorColor = (actor: string) => {
    switch (actor) {
      case 'Karyawan': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Sistem': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Pimpinan': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8" id="business-process-section">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Bisnis Proses Sistem Permintaan Cuti BKHIT PBD</h2>
        <p className="text-sm text-gray-500 mt-1">
          Alur kerja pengajuan cuti pegawai, verifikasi Kasubbag Umum, persetujuan Kepala Balai, serta pembaruan database secara otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {STEPS.map((stepItem) => (
          <div 
            key={stepItem.step}
            className="flex flex-col h-full bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all duration-200 relative group"
            id={`bp-step-${stepItem.step}`}
          >
            {/* Step Number Badge */}
            <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-100">
              {stepItem.step}
            </div>

            {/* Icon & Title */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 bg-white rounded-lg border border-slate-100 shadow-xs">
                {getIcon(stepItem.step)}
              </div>
              <h3 className="font-semibold text-gray-900 pr-8">{stepItem.title}</h3>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 flex-grow leading-relaxed mb-4">
              {stepItem.description}
            </p>

            {/* Actor Tag */}
            <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-200/60 text-xs">
              <span className="text-gray-400">Aktor Utama:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-medium border ${getActorColor(stepItem.actor)}`}>
                {stepItem.actor === 'Karyawan' ? 'Pegawai' : stepItem.actor}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-indigo-50 border border-indigo-100/60 rounded-xl p-4 flex items-start space-x-3">
        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700 mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-indigo-900">Catatan Keamanan & Integrasi</h4>
          <p className="text-xs text-indigo-700/95 mt-0.5 leading-relaxed">
            Sesuai instruksi Anda untuk menonaktifkan Google Sheets/Drive, sistem ini menggunakan <strong>Local Storage Engine (terenkapsulasi aman di browser)</strong> yang bertindak persis seperti basis data terintegrasi. Anda dapat menguji seluruh alur pengajuan dan verifikasi secara mandiri.
          </p>
        </div>
      </div>
    </div>
  );
};
