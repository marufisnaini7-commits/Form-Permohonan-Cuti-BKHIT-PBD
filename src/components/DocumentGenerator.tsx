import React from 'react';
import { LeaveRequest } from '../types';
import { formatDateIndo } from '../utils';
import { Download, Printer, Check, Clock, X } from 'lucide-react';

interface DocumentPreviewProps {
  request: LeaveRequest;
  sisaN: number;
  sisaN1: number;
  sisaN2: number;
}

export function generateHtmlDocument(request: LeaveRequest, sisaN: number, sisaN1: number, sisaN2: number): string {
  const currentYear = new Date().getFullYear();
  const formatCode = `BKHIT-PBD/CUTI/${currentYear}/${request.id.toUpperCase().slice(-4)}`;

  // Function to render checkmark
  const renderCheck = (condition: boolean) => condition ? '&#10004;' : '&nbsp;&nbsp;&nbsp;';

  // Calculate remaining balances after deduction if Cuti Tahunan
  const sisaNAfter = request.status === 'Disetujui' && request.jenisCuti === 'Cuti Tahunan'
    ? Math.max(0, sisaN - request.durasiHari)
    : sisaN;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Formulir Cuti BKHIT Papua Barat Daya - ${request.employeeName}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.3;
      color: #000;
      padding: 30px;
      max-width: 850px;
      margin: 0 auto;
      background-color: #fff;
      font-size: 11px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    
    .letterhead {
      margin-bottom: 15px;
      font-size: 11px;
    }
    
    .title-doc {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      text-decoration: underline;
      margin-top: 10px;
      margin-bottom: 15px;
      letter-spacing: 0.5px;
    }

    table.main-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }

    table.main-table th, table.main-table td {
      border: 1px solid #000;
      padding: 5px 8px;
      vertical-align: top;
    }

    .section-title {
      font-weight: bold;
      background-color: #e5e7eb;
    }

    .signature-container {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }

    .signature-box {
      width: 45%;
      text-align: center;
    }

    .stamp-approved {
      border: 2px solid #16a34a;
      color: #16a34a;
      font-weight: bold;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 3px;
      display: inline-block;
      transform: rotate(-5deg);
      text-transform: uppercase;
      font-family: Arial, sans-serif;
      margin: 5px 0;
    }

    .stamp-rejected {
      border: 2px solid #dc2626;
      color: #dc2626;
      font-weight: bold;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 3px;
      display: inline-block;
      transform: rotate(-5deg);
      text-transform: uppercase;
      font-family: Arial, sans-serif;
      margin: 5px 0;
    }

    .stamp-pending {
      border: 2px solid #d97706;
      color: #d97706;
      font-weight: bold;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 3px;
      display: inline-block;
      text-transform: uppercase;
      font-family: Arial, sans-serif;
      margin: 5px 0;
    }

    @media print {
      body { padding: 0; margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <!-- Top Right Header Location -->
  <div class="text-right letterhead">
    Sorong, ${formatDateIndo(request.tanggalPengajuan)}<br>
    Kepada Yth.<br>
    <span class="text-bold">Kepala Balai Karantina Hewan, Ikan dan Tumbuhan<br>Papua Barat Daya</span><br>
    di -<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-bold">Sorong</span>
  </div>

  <div class="title-doc">FORMULIR PERMINTAAN DAN PEMBERIAN IJIN</div>

  <!-- I. DATA PEGAWAI -->
  <table class="main-table">
    <tbody>
      <tr class="section-title">
        <td colspan="4">I. DATA PEGAWAI</td>
      </tr>
      <tr>
        <td style="width: 15%;">Nama</td>
        <td style="width: 35%;" class="text-bold">${request.employeeName}</td>
        <td style="width: 15%;">NIP</td>
        <td style="width: 35%;" class="text-bold">${request.employeeNip}</td>
      </tr>
      <tr>
        <td>Jabatan</td>
        <td>${request.employeeJabatan}</td>
        <td>Masa Kerja</td>
        <td>${request.employeeMasaKerja}</td>
      </tr>
      <tr>
        <td>Unit Kerja</td>
        <td colspan="3">${request.employeeUnitKerja}</td>
      </tr>
    </tbody>
  </table>

  <!-- II. JENIS CUTI YANG DIAMBIL -->
  <table class="main-table">
    <tbody>
      <tr class="section-title">
        <td colspan="4">II. JENIS CUTI YANG DIAMBIL**</td>
      </tr>
      <tr>
        <td style="width: 45%;">1. Cuti Tahunan</td>
        <td style="width: 5%;" class="text-center text-bold">${renderCheck(request.jenisCuti === 'Cuti Tahunan')}</td>
        <td style="width: 45%;">4. Cuti Besar</td>
        <td style="width: 5%;" class="text-center text-bold">${renderCheck(request.jenisCuti === 'Cuti Besar')}</td>
      </tr>
      <tr>
        <td>2. Cuti Sakit</td>
        <td class="text-center text-bold">${renderCheck(request.jenisCuti === 'Cuti Sakit')}</td>
        <td>5. Cuti Melahirkan</td>
        <td class="text-center text-bold">${renderCheck(request.jenisCuti === 'Cuti Melahirkan')}</td>
      </tr>
      <tr>
        <td>3. Cuti Karena Alasan Penting</td>
        <td class="text-center text-bold">${renderCheck(request.jenisCuti === 'Cuti Karena Alasan Penting')}</td>
        <td>6. Cuti di Luar Tanggungan Negara</td>
        <td class="text-center text-bold">${renderCheck(request.jenisCuti === 'Cuti di Luar Tanggungan Negara')}</td>
      </tr>
    </tbody>
  </table>

  <!-- III. ALASAN CUTI -->
  <table class="main-table">
    <tbody>
      <tr class="section-title">
        <td>III. ALASAN CUTI</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; font-style: italic;">${request.alasan}</td>
      </tr>
    </tbody>
  </table>

  <!-- IV. LAMANYA IJIN -->
  <table class="main-table">
    <tbody>
      <tr class="section-title">
        <td colspan="3">IV. LAMANYA IJIN</td>
      </tr>
      <tr>
        <td style="width: 30%;">Selama: <span class="text-bold">${request.durasiHari} (hari)</span></td>
        <td style="width: 35%;">Mulai Tanggal: <span class="text-bold">${formatDateIndo(request.tanggalMulai)}</span></td>
        <td style="width: 35%;">s/d Tanggal: <span class="text-bold">${formatDateIndo(request.tanggalSelesai)}</span></td>
      </tr>
    </tbody>
  </table>

  <!-- V. CATATAN CUTI -->
  <table class="main-table">
    <tbody>
      <tr class="section-title">
        <td colspan="5">V. CATATAN CUTI***</td>
      </tr>
      <tr>
        <td colspan="3" style="width: 50%; font-weight: bold;" class="text-center">1. CUTI TAHUNAN</td>
        <td style="width: 40%; font-weight: bold;">2. CUTI BESAR</td>
        <td style="width: 10%;" class="text-center">${request.jenisCuti === 'Cuti Besar' ? '&#10004;' : ''}</td>
      </tr>
      <tr>
        <td class="text-center text-bold" style="width: 15%;">Tahun</td>
        <td class="text-center text-bold" style="width: 15%;">Sisa</td>
        <td class="text-center text-bold" style="width: 20%;">Keterangan</td>
        <td style="font-weight: bold;">3. CUTI SAKIT</td>
        <td class="text-center">${request.jenisCuti === 'Cuti Sakit' ? '&#10004;' : ''}</td>
      </tr>
      <tr>
        <td class="text-center">N-2</td>
        <td class="text-center">${sisaN2} Hari</td>
        <td class="text-center">-</td>
        <td style="font-weight: bold;">4. CUTI MELAHIRKAN</td>
        <td class="text-center">${request.jenisCuti === 'Cuti Melahirkan' ? '&#10004;' : ''}</td>
      </tr>
      <tr>
        <td class="text-center">N-1</td>
        <td class="text-center">${sisaN1} Hari</td>
        <td class="text-center">-</td>
        <td style="font-weight: bold;">5. CUTI KARENA ALASAN PENTING</td>
        <td class="text-center">${request.jenisCuti === 'Cuti Karena Alasan Penting' ? '&#10004;' : ''}</td>
      </tr>
      <tr>
        <td class="text-center">N (Berjalan)</td>
        <td class="text-center text-bold" style="background-color: #f9fafb;">${sisaNAfter} Hari</td>
        <td class="text-center">Sisa berjalan</td>
        <td style="font-weight: bold;">6. CUTI DI LUAR TANGGUNGAN NEGARA</td>
        <td class="text-center">${request.jenisCuti === 'Cuti di Luar Tanggungan Negara' ? '&#10004;' : ''}</td>
      </tr>
    </tbody>
  </table>

  <!-- VI. ALAMAT SELAMA MENJALANKAN CUTI & SIGNATURE -->
  <table class="main-table">
    <tbody>
      <tr class="section-title">
        <td style="width: 50%;">VI. ALAMAT SELAMA MENJALANKAN CUTI</td>
        <td style="width: 50%;">TANDA TANGAN PEMOHON</td>
      </tr>
      <tr>
        <td>
          Alamat: <span class="text-bold">${request.alamatCuti}</span><br>
          No. Telp: <span class="text-bold">${request.telp}</span>
        </td>
        <td class="text-center" style="padding-top: 15px; padding-bottom: 15px;">
          Hormat saya,<br><br><br>
          <span class="text-bold" style="text-decoration: underline;">${request.employeeName}</span><br>
          NIP. ${request.employeeNip}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- VII. PERTIMBANGAN ATASAN LANGSUNG -->
  <table class="main-table">
    <tbody>
      <tr class="section-title">
        <td colspan="4">VII. PERTIMBANGAN ATASAN LANGSUNG**</td>
      </tr>
      <tr class="text-center">
        <td style="width: 25%;" class="text-bold">DISETUJUI</td>
        <td style="width: 25%;" class="text-bold">PERUBAHAN****</td>
        <td style="width: 25%;" class="text-bold">DITANGGUHKAN****</td>
        <td style="width: 25%;" class="text-bold">TIDAK DISETUJUI****</td>
      </tr>
      <tr class="text-center">
        <td style="font-size: 16px; height: 25px;">${request.status === 'Disetujui' ? '&#10004;' : ''}</td>
        <td style="font-size: 16px;">${request.status === 'Perubahan' ? '&#10004;' : ''}</td>
        <td style="font-size: 16px;">${request.status === 'Ditangguhkan' ? '&#10004;' : ''}</td>
        <td style="font-size: 16px;">${request.status === 'Ditolak' ? '&#10004;' : ''}</td>
      </tr>
      <tr>
        <td colspan="4" style="padding: 10px 15px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="width: 50%;">
              <span class="text-bold">Catatan Atasan:</span><br>
              <span style="font-style: italic;">"${request.catatanAtasan || 'Sesuai prosedur yang berlaku.'}"</span>
            </div>
            <div style="width: 45%; text-align: center;">
              Kepala Sub Bagian Umum,<br><br>
              ${request.status !== 'Pending' ? `<div class="stamp-approved">SIGNED ATASAN</div><br>` : '<br><br>'}
              <span class="text-bold" style="text-decoration: underline;">Mila Yasni Morintoh</span><br>
              NIP. 19801212 200501 2 001
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- VIII. KEPUTUSAN PEJABAT YANG BERWENANG -->
  <table class="main-table">
    <tbody>
      <tr class="section-title">
        <td colspan="4">VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI**</td>
      </tr>
      <tr class="text-center">
        <td style="width: 25%;" class="text-bold">DISETUJUI</td>
        <td style="width: 25%;" class="text-bold">PERUBAHAN****</td>
        <td style="width: 25%;" class="text-bold">DITANGGUHKAN****</td>
        <td style="width: 25%;" class="text-bold">TIDAK DISETUJUI****</td>
      </tr>
      <tr class="text-center">
        <td style="font-size: 16px; height: 25px;">${request.status === 'Disetujui' ? '&#10004;' : ''}</td>
        <td style="font-size: 16px;">${request.status === 'Perubahan' ? '&#10004;' : ''}</td>
        <td style="font-size: 16px;">${request.status === 'Ditangguhkan' ? '&#10004;' : ''}</td>
        <td style="font-size: 16px;">${request.status === 'Ditolak' ? '&#10004;' : ''}</td>
      </tr>
      <tr>
        <td colspan="4" style="padding: 10px 15px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="width: 50%;">
              <span class="text-bold">Catatan Kepala Balai:</span><br>
              <span style="font-style: italic;">"${request.catatanPimpinan || 'Disetujui penuh.'}"</span>
            </div>
            <div style="width: 45%; text-align: center;">
              Kepala Balai Karantina Hewan, Ikan dan Tumbuhan<br>Papua Barat Daya,<br><br>
              ${request.status === 'Disetujui' ? `<div class="stamp-approved">APPROVED</div><br>` : request.status !== 'Pending' ? `<div class="stamp-rejected">${request.status}</div><br>` : '<br><br>'}
              <span class="text-bold" style="text-decoration: underline;">I Wayan Kertanegara</span><br>
              NIP. 19740520 199903 1 002
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Footnotes -->
  <div style="font-size: 9px; color: #555; margin-top: 15px; line-height: 1.2;">
    Catatan:<br>
    * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Coret yang tidak perlu<br>
    ** &nbsp;&nbsp;&nbsp;Pilih salah satu dengan memberi tanda centang (&#10004;)<br>
    *** &nbsp;&nbsp;Diisi oleh pejabat yang menangani bidang kepegawaian sebelum PNS mengajukan cuti<br>
    **** Di beri tanda centang dan alasannya<br>
    N &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Cuti tahunan berjalan | N-1 = Sisa cuti 1 tahun sebelumnya | N-2 = Sisa cuti 2 tahun sebelumnya
  </div>

</body>
</html>`;
}

export function downloadDocument(request: LeaveRequest, sisaN: number, sisaN1: number, sisaN2: number) {
  const htmlContent = generateHtmlDocument(request, sisaN, sisaN1, sisaN2);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const fileName = `Formulir_Cuti_BKHIT_${request.employeeName.replace(/\s+/g, '_')}_${request.id.slice(-4)}.html`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const DocumentPreviewCard: React.FC<DocumentPreviewProps> = ({ request, sisaN, sisaN1, sisaN2 }) => {
  const currentYear = new Date().getFullYear();
  const formatCode = `BKHIT-PBD/CUTI/${currentYear}/${request.id.toUpperCase().slice(-4)}`;

  const sisaNAfter = request.status === 'Disetujui' && request.jenisCuti === 'Cuti Tahunan'
    ? Math.max(0, sisaN - request.durasiHari)
    : sisaN;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateHtmlDocument(request, sisaN, sisaN1, sisaN2));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col h-full" id={`preview-card-${request.id}`}>
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Preview Dokumen Permohonan</h3>
          <p className="text-xs text-gray-500">Format Resmi Lampiran Cuti BKHIT Papua Barat Daya</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Cetak Formulir Cuti"
            id={`btn-print-${request.id}`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
          <button
            onClick={() => downloadDocument(request, sisaN, sisaN1, sisaN2)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Download Formulir Resmi (.html)"
            id={`btn-download-${request.id}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML</span>
          </button>
        </div>
      </div>

      {/* Styled A4-like Document Page in UI */}
      <div className="bg-slate-100 p-4 rounded-xl flex-grow overflow-y-auto max-h-[500px] border border-slate-200">
        <div className="bg-white shadow-md p-6 mx-auto max-w-[650px] aspect-[1/1.4] text-gray-900 text-[10px] text-left font-serif leading-tight relative border border-gray-300">
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5">
            {request.status === 'Disetujui' && (
              <span className="text-5xl font-sans font-bold border-8 border-green-600 text-green-600 p-4 rounded-xl rotate-12">APPROVED</span>
            )}
            {request.status === 'Ditolak' && (
              <span className="text-5xl font-sans font-bold border-8 border-red-600 text-red-600 p-4 rounded-xl rotate-12">DITOLAK</span>
            )}
            {request.status === 'Pending' && (
              <span className="text-5xl font-sans font-bold border-8 border-amber-600 text-amber-600 p-4 rounded-xl rotate-12">DRAFT</span>
            )}
          </div>

          {/* Letterhead and Destination */}
          <div className="text-right mb-4">
            <p>Sorong, {formatDateIndo(request.tanggalPengajuan)}</p>
            <p>Kepada Yth.</p>
            <p className="font-bold">Kepala Balai Karantina Hewan, Ikan dan Tumbuhan</p>
            <p className="font-bold">Papua Barat Daya</p>
            <p>di -</p>
            <p className="font-bold pr-8">Sorong</p>
          </div>

          <h2 className="text-center font-bold underline text-xs tracking-wider mb-4">FORMULIR PERMINTAAN DAN PEMBERIAN IJIN</h2>

          {/* I. DATA PEGAWAI */}
          <div className="mb-2">
            <div className="bg-gray-100 font-bold border border-black p-1">I. DATA PEGAWAI</div>
            <table className="w-full border-collapse border-l border-r border-b border-black">
              <tbody>
                <tr className="border-b border-black">
                  <td className="w-[15%] p-1 border-r border-black">Nama</td>
                  <td className="w-[35%] p-1 border-r border-black font-bold">{request.employeeName}</td>
                  <td className="w-[15%] p-1 border-r border-black">NIP</td>
                  <td className="w-[35%] p-1 font-bold">{request.employeeNip}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 border-r border-black">Jabatan</td>
                  <td className="p-1 border-r border-black">{request.employeeJabatan}</td>
                  <td className="p-1 border-r border-black">Masa Kerja</td>
                  <td className="p-1">{request.employeeMasaKerja}</td>
                </tr>
                <tr>
                  <td className="p-1 border-r border-black">Unit Kerja</td>
                  <td colSpan={3} className="p-1">{request.employeeUnitKerja}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* II. JENIS CUTI */}
          <div className="mb-2">
            <div className="bg-gray-100 font-bold border border-black p-1">II. JENIS CUTI YANG DIAMBIL**</div>
            <table className="w-full border-collapse border-l border-r border-b border-black text-[9px]">
              <tbody>
                <tr className="border-b border-black">
                  <td className="w-[42%] p-1 border-r border-black">1. Cuti Tahunan</td>
                  <td className="w-[8%] p-1 border-r border-black text-center font-bold">{request.jenisCuti === 'Cuti Tahunan' ? '√' : ''}</td>
                  <td className="w-[42%] p-1 border-r border-black">4. Cuti Besar</td>
                  <td className="w-[8%] p-1 text-center font-bold">{request.jenisCuti === 'Cuti Besar' ? '√' : ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 border-r border-black">2. Cuti Sakit</td>
                  <td className="p-1 border-r border-black text-center font-bold">{request.jenisCuti === 'Cuti Sakit' ? '√' : ''}</td>
                  <td className="p-1 border-r border-black">5. Cuti Melahirkan</td>
                  <td className="p-1 text-center font-bold">{request.jenisCuti === 'Cuti Melahirkan' ? '√' : ''}</td>
                </tr>
                <tr>
                  <td className="p-1 border-r border-black">3. Cuti Karena Alasan Penting</td>
                  <td className="p-1 border-r border-black text-center font-bold">{request.jenisCuti === 'Cuti Karena Alasan Penting' ? '√' : ''}</td>
                  <td className="p-1 border-r border-black">6. Cuti di Luar Tanggungan Negara</td>
                  <td className="p-1 text-center font-bold">{request.jenisCuti === 'Cuti di Luar Tanggungan Negara' ? '√' : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* III. ALASAN CUTI */}
          <div className="mb-2">
            <div className="bg-gray-100 font-bold border border-black p-1">III. ALASAN CUTI</div>
            <div className="border-l border-r border-b border-black p-1.5 italic">
              {request.alasan}
            </div>
          </div>

          {/* IV. LAMANYA IJIN */}
          <div className="mb-2">
            <div className="bg-gray-100 font-bold border border-black p-1">IV. LAMANYA IJIN</div>
            <table className="w-full border-collapse border-l border-r border-b border-black">
              <tbody>
                <tr>
                  <td className="w-[30%] p-1 border-r border-black">Selama: <span className="font-bold">{request.durasiHari} Hari Kerja</span></td>
                  <td className="w-[35%] p-1 border-r border-black">mulai tanggal: <span className="font-bold">{formatDateIndo(request.tanggalMulai)}</span></td>
                  <td className="w-[35%] p-1">s/d tanggal: <span className="font-bold">{formatDateIndo(request.tanggalSelesai)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* V. CATATAN CUTI */}
          <div className="mb-2">
            <div className="bg-gray-100 font-bold border border-black p-1">V. CATATAN CUTI***</div>
            <table className="w-full border-collapse border-l border-r border-b border-black text-[9px]">
              <tbody>
                <tr className="border-b border-black">
                  <td colSpan={3} className="w-[50%] p-1 border-r border-black font-bold text-center">1. CUTI TAHUNAN</td>
                  <td className="w-[42%] p-1 border-r border-black font-bold">2. CUTI BESAR</td>
                  <td className="w-[8%] p-1 text-center font-bold">{request.jenisCuti === 'Cuti Besar' ? '√' : ''}</td>
                </tr>
                <tr className="border-b border-black bg-slate-50">
                  <td className="p-1 border-r border-black text-center font-bold">Tahun</td>
                  <td className="p-1 border-r border-black text-center font-bold">Sisa</td>
                  <td className="p-1 border-r border-black text-center font-bold">Keterangan</td>
                  <td className="p-1 border-r border-black font-bold">3. CUTI SAKIT</td>
                  <td className="p-1 text-center font-bold">{request.jenisCuti === 'Cuti Sakit' ? '√' : ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 border-r border-black text-center">N-2</td>
                  <td className="p-1 border-r border-black text-center">{sisaN2} Hari</td>
                  <td className="p-1 border-r border-black text-center">-</td>
                  <td className="p-1 border-r border-black font-bold">4. CUTI MELAHIRKAN</td>
                  <td className="p-1 text-center font-bold">{request.jenisCuti === 'Cuti Melahirkan' ? '√' : ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 border-r border-black text-center">N-1</td>
                  <td className="p-1 border-r border-black text-center">{sisaN1} Hari</td>
                  <td className="p-1 border-r border-black text-center">-</td>
                  <td className="p-1 border-r border-black font-bold">5. CUTI KARENA ALASAN PENTING</td>
                  <td className="p-1 text-center font-bold">{request.jenisCuti === 'Cuti Karena Alasan Penting' ? '√' : ''}</td>
                </tr>
                <tr>
                  <td className="p-1 border-r border-black text-center">N (Berjalan)</td>
                  <td className="p-1 border-r border-black text-center font-bold bg-amber-50">{sisaNAfter} Hari</td>
                  <td className="p-1 border-r border-black text-center">Sisa berjalan</td>
                  <td className="p-1 border-r border-black font-bold">6. CUTI DI LUAR TANGGUNGAN NEGARA</td>
                  <td className="p-1 text-center font-bold">{request.jenisCuti === 'Cuti di Luar Tanggungan Negara' ? '√' : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VI. ALAMAT & TANDA TANGAN */}
          <div className="mb-2">
            <table className="w-full border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100 border-b border-black font-bold">
                  <td className="w-1/2 p-1 border-r border-black">VI. ALAMAT SELAMA MENJALANKAN CUTI</td>
                  <td className="w-1/2 p-1">TANDA TANGAN PEMOHON</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1.5 border-r border-black">
                    <p>Alamat: <span className="font-bold">{request.alamatCuti}</span></p>
                    <p className="mt-1">TELP: <span className="font-bold font-mono">{request.telp}</span></p>
                  </td>
                  <td className="p-2 text-center">
                    <p>Hormat saya,</p>
                    <div className="h-8 flex items-center justify-center italic text-blue-700 font-sans font-semibold text-[11px] select-none">
                      {request.employeeName.split(',')[0]}
                    </div>
                    <p className="font-bold underline">{request.employeeName}</p>
                    <p className="text-[8px] text-gray-500">NIP. {request.employeeNip}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VII. PERTIMBANGAN ATASAN LANGSUNG */}
          <div className="mb-2">
            <div className="bg-gray-100 font-bold border border-black p-1">VII. PERTIMBANGAN ATASAN LANGSUNG**</div>
            <table className="w-full border-collapse border-l border-r border-b border-black text-center">
              <tbody>
                <tr className="font-bold bg-slate-50 border-b border-black text-[9px]">
                  <td className="w-[25%] p-0.5 border-r border-black">DISETUJUI</td>
                  <td className="w-[25%] p-0.5 border-r border-black">PERUBAHAN****</td>
                  <td className="w-[25%] p-0.5 border-r border-black">DITANGGUHKAN****</td>
                  <td className="w-[25%] p-0.5">TIDAK DISETUJUI****</td>
                </tr>
                <tr className="border-b border-black text-xs font-bold h-5">
                  <td className="border-r border-black">{request.status === 'Disetujui' ? '√' : ''}</td>
                  <td className="border-r border-black">{request.status === 'Perubahan' ? '√' : ''}</td>
                  <td className="border-r border-black">{request.status === 'Ditangguhkan' ? '√' : ''}</td>
                  <td>{request.status === 'Ditolak' ? '√' : ''}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-left p-1.5">
                    <div className="flex justify-between items-end">
                      <div className="w-[50%]">
                        <p className="font-bold text-[9px]">Catatan Atasan:</p>
                        <p className="italic text-gray-600">"{request.catatanAtasan || 'Sesuai dengan hak cuti tahunan berjalan.'}"</p>
                      </div>
                      <div className="w-[45%] text-center">
                        <p>Kepala Sub Bagian Umum,</p>
                        <div className="h-6 flex items-center justify-center text-emerald-600 font-bold text-[8px] border border-dashed border-emerald-300 rounded bg-emerald-50 scale-90 select-none my-0.5">
                          {request.status !== 'Pending' ? 'SIGNED DIGITAL' : 'WAITING'}
                        </div>
                        <p className="font-bold underline">Mila Yasni Morintoh</p>
                        <p className="text-[7px] text-gray-500">NIP. 19801212 200501 2 001</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VIII. KEPUTUSAN PEJABAT YANG BERWENANG */}
          <div>
            <div className="bg-gray-100 font-bold border border-black p-1">VIII. KEPUTUSAN PEJABAT YANG BERWENANG MEMBERIKAN CUTI**</div>
            <table className="w-full border-collapse border-l border-r border-b border-black text-center">
              <tbody>
                <tr className="font-bold bg-slate-50 border-b border-black text-[9px]">
                  <td className="w-[25%] p-0.5 border-r border-black">DISETUJUI</td>
                  <td className="w-[25%] p-0.5 border-r border-black">PERUBAHAN****</td>
                  <td className="w-[25%] p-0.5 border-r border-black">DITANGGUHKAN****</td>
                  <td className="w-[25%] p-0.5">TIDAK DISETUJUI****</td>
                </tr>
                <tr className="border-b border-black text-xs font-bold h-5">
                  <td className="border-r border-black">{request.status === 'Disetujui' ? '√' : ''}</td>
                  <td className="border-r border-black">{request.status === 'Perubahan' ? '√' : ''}</td>
                  <td className="border-r border-black">{request.status === 'Ditangguhkan' ? '√' : ''}</td>
                  <td>{request.status === 'Ditolak' ? '√' : ''}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-left p-1.5">
                    <div className="flex justify-between items-end">
                      <div className="w-[50%]">
                        <p className="font-bold text-[9px]">Catatan Kepala Balai:</p>
                        <p className="italic text-gray-600">"{request.catatanPimpinan || 'Disetujui.'}"</p>
                      </div>
                      <div className="w-[45%] text-center">
                        <p>Kepala Balai,</p>
                        <div className="h-6 flex items-center justify-center text-emerald-600 font-bold text-[8px] border border-dashed border-emerald-300 rounded bg-emerald-50 scale-90 select-none my-0.5">
                          {request.status === 'Disetujui' ? 'APPROVED' : request.status !== 'Pending' ? 'COMPLETED' : 'WAITING'}
                        </div>
                        <p className="font-bold underline">I Wayan Kertanegara</p>
                        <p className="text-[7px] text-gray-500">NIP. 19740520 199903 1 002</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};
