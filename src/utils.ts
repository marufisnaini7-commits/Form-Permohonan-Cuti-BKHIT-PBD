import { Employee, LeaveRequest } from './types';

// Calculate duration excluding Saturdays and Sundays
export function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  let count = 0;
  const current = new Date(start);
  
  // Normalize times to midnight to avoid timezone issues
  current.setHours(0, 0, 0, 0);
  const targetEnd = new Date(end);
  targetEnd.setHours(0, 0, 0, 0);

  while (current <= targetEnd) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    nip: '19820514 200902 1 003',
    nama: 'Supriyanto, S.P.',
    jabatan: 'Pemeriksa Karantina Tumbuhan Ahli Muda',
    masaKerja: '15 Tahun',
    unitKerja: 'Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya',
    sisaCutiN: 12,
    sisaCutiN1: 6,
    sisaCutiN2: 0
  },
  {
    id: 'emp-2',
    nip: '19910825 201801 2 002',
    nama: 'drh. Melati Pertiwi',
    jabatan: 'Medik Veteriner Ahli Pertama',
    masaKerja: '6 Tahun',
    unitKerja: 'Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya',
    sisaCutiN: 10,
    sisaCutiN1: 4,
    sisaCutiN2: 2
  },
  {
    id: 'emp-3',
    nip: '19951111 202012 1 001',
    nama: 'Faisal Rahman, S.Pi.',
    jabatan: 'Pengendali Hama dan Penyakit Ikan Ahli Pertama',
    masaKerja: '4 Tahun',
    unitKerja: 'Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya',
    sisaCutiN: 12,
    sisaCutiN1: 2,
    sisaCutiN2: 1
  },
  {
    id: 'emp-4',
    nip: '19980315 202203 2 003',
    nama: 'Nurlaila, A.Md.',
    jabatan: 'Pranata Komputer Terampil',
    masaKerja: '2 Tahun',
    unitKerja: 'Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya',
    sisaCutiN: 8,
    sisaCutiN1: 0,
    sisaCutiN2: 0
  }
];

export const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: 'req-1',
    employeeId: 'emp-1',
    employeeName: 'Supriyanto, S.P.',
    employeeNip: '19820514 200902 1 003',
    employeeJabatan: 'Pemeriksa Karantina Tumbuhan Ahli Muda',
    employeeMasaKerja: '15 Tahun',
    employeeUnitKerja: 'Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya',
    jenisCuti: 'Cuti Tahunan',
    tanggalMulai: '2026-07-01',
    tanggalSelesai: '2026-07-02',
    durasiHari: 2,
    alasan: 'Urusan Keluarga di Jayapura.',
    alamatCuti: 'Jl. Ahmad Yani No. 10, Jayapura, Papua',
    telp: '081245588880',
    status: 'Disetujui',
    tanggalPengajuan: '2026-06-20',
    catatanAtasan: 'Disetujui untuk ditindaklanjuti.',
    catatanPimpinan: 'Disetujui. Pastikan koordinasi tugas dengan rekan kerja berjalan baik.',
    tanggalPersetujuan: '2026-06-21'
  },
  {
    id: 'req-2',
    employeeId: 'emp-2',
    employeeName: 'drh. Melati Pertiwi',
    employeeNip: '19910825 201801 2 002',
    employeeJabatan: 'Medik Veteriner Ahli Pertama',
    employeeMasaKerja: '6 Tahun',
    employeeUnitKerja: 'Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya',
    jenisCuti: 'Cuti Sakit',
    tanggalMulai: '2026-06-15',
    tanggalSelesai: '2026-06-16',
    durasiHari: 2,
    alasan: 'Demam tinggi dan memerlukan istirahat total berdasarkan surat rujukan klinik.',
    alamatCuti: 'Jl. Basuki Rahmat, Sorong',
    telp: '08115562772',
    status: 'Disetujui',
    tanggalPengajuan: '2026-06-15',
    catatanAtasan: 'Disetujui.',
    catatanPimpinan: 'Lekas sembuh, harap unggah surat keterangan dokter ketika sudah kembali.',
    tanggalPersetujuan: '2026-06-15'
  },
  {
    id: 'req-3',
    employeeId: 'emp-3',
    employeeName: 'Faisal Rahman, S.Pi.',
    employeeNip: '19951111 202012 1 001',
    employeeJabatan: 'Pengendali Hama dan Penyakit Ikan Ahli Pertama',
    employeeMasaKerja: '4 Tahun',
    employeeUnitKerja: 'Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya',
    jenisCuti: 'Cuti Tahunan',
    tanggalMulai: '2026-07-10',
    tanggalSelesai: '2026-07-11',
    durasiHari: 2,
    alasan: 'Urusan Keluarga di Manado',
    alamatCuti: 'Sulawesi Utara',
    telp: '081245588880',
    status: 'Pending',
    tanggalPengajuan: '2026-06-22'
  }
];

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
