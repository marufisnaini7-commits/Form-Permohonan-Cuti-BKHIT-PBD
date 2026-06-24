export interface Employee {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  masaKerja: string;
  unitKerja: string;
  sisaCutiN: number;  // Tahun N berjalan
  sisaCutiN1: number; // Tahun N-1
  sisaCutiN2: number; // Tahun N-2
}

export type JenisCuti = 
  | 'Cuti Tahunan'
  | 'Cuti Sakit'
  | 'Cuti Karena Alasan Penting'
  | 'Cuti Besar'
  | 'Cuti Melahirkan'
  | 'Cuti di Luar Tanggungan Negara';

export type StatusCuti = 'Pending' | 'Disetujui' | 'Perubahan' | 'Ditangguhkan' | 'Ditolak';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  employeeJabatan: string;
  employeeMasaKerja: string;
  employeeUnitKerja: string;
  jenisCuti: JenisCuti;
  tanggalMulai: string;
  tanggalSelesai: string;
  durasiHari: number;
  alasan: string;
  alamatCuti: string;
  telp: string;
  status: StatusCuti;
  tanggalPengajuan: string;
  catatanAtasan?: string;
  catatanPimpinan?: string;
  tanggalPersetujuan?: string;
}

export interface BusinessProcessStep {
  step: number;
  title: string;
  description: string;
  actor: 'Karyawan' | 'Sistem' | 'Pimpinan';
}
