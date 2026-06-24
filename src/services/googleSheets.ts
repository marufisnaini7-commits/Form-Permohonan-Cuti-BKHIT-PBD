import { Employee, LeaveRequest, JenisCuti, StatusCuti } from '../types';

export interface SheetData {
  employees: Employee[];
  requests: LeaveRequest[];
}

/**
 * Create a new Spreadsheet in user's Google Drive with "Pegawai" and "Permohonan Cuti" sheets
 */
export async function createSpreadsheet(accessToken: string): Promise<string> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'Database Cuti BKHIT Papua Barat Daya'
      },
      sheets: [
        {
          properties: {
            title: 'Pegawai'
          }
        },
        {
          properties: {
            title: 'Permohonan Cuti'
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const data = await response.json();
  return data.spreadsheetId;
}

/**
 * Clear data inside ranges
 */
async function clearRange(spreadsheetId: string, range: string, accessToken: string) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    console.warn(`Gagal membersihkan range ${range}`);
  }
}

/**
 * Push entire state of employees and requests to Google Sheet (Overwriting completely)
 */
export async function syncToGoogleSheet(
  spreadsheetId: string,
  employees: Employee[],
  requests: LeaveRequest[],
  accessToken: string
): Promise<void> {
  // First clear potential excess rows
  await clearRange(spreadsheetId, 'Pegawai!A1:I2000', accessToken);
  await clearRange(spreadsheetId, 'Permohonan Cuti!A1:T3000', accessToken);

  // Prep Pegawai values
  const pegawaiHeaders = ["ID", "NIP", "Nama", "Jabatan", "Masa Kerja", "Unit Kerja", "Sisa Cuti N", "Sisa Cuti N-1", "Sisa Cuti N-2"];
  const pegawaiRows = employees.map(emp => [
    emp.id,
    emp.nip,
    emp.nama,
    emp.jabatan,
    emp.masaKerja,
    emp.unitKerja,
    emp.sisaCutiN.toString(),
    emp.sisaCutiN1.toString(),
    emp.sisaCutiN2.toString()
  ]);

  // Prep Permohonan Cuti values
  const permohonanHeaders = [
    "ID",
    "EmployeeID",
    "EmployeeNIP",
    "EmployeeNama",
    "EmployeeJabatan",
    "EmployeeMasaKerja",
    "EmployeeUnitKerja",
    "Jenis Cuti",
    "Tanggal Mulai",
    "Tanggal Selesai",
    "Alasan",
    "Alamat",
    "No Kontak",
    "Durasi Hari",
    "Status",
    "Catatan Atasan",
    "Catatan Pimpinan",
    "Tanggal Persetujuan",
    "Tanggal Pengajuan"
  ];
  const permohonanRows = requests.map(r => [
    r.id,
    r.employeeId,
    r.employeeNip,
    r.employeeName,
    r.employeeJabatan,
    r.employeeMasaKerja,
    r.employeeUnitKerja,
    r.jenisCuti,
    r.tanggalMulai,
    r.tanggalSelesai,
    r.alasan,
    r.alamatCuti,
    r.telp,
    r.durasiHari.toString(),
    r.status,
    r.catatanAtasan || '',
    r.catatanPimpinan || '',
    r.tanggalPersetujuan || '',
    r.tanggalPengajuan
  ]);

  // Write values using batchUpdate
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Pegawai!A1',
          values: [pegawaiHeaders, ...pegawaiRows]
        },
        {
          range: 'Permohonan Cuti!A1',
          values: [permohonanHeaders, ...permohonanRows]
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal menyinkronkan data ke Google Sheet.');
  }
}

/**
 * Fetch and parse data from Google Sheet
 */
export async function fetchFromGoogleSheet(spreadsheetId: string, accessToken: string): Promise<SheetData> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=Pegawai!A1:I2000&ranges=Permohonan%20Cuti!A1:T3000`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal mengambil data dari Google Sheet.');
  }

  const data = await response.json();
  const valueRanges = data.valueRanges || [];

  const pegawaiRange = valueRanges.find((vr: any) => vr.range && vr.range.includes('Pegawai'));
  const permohonanRange = valueRanges.find((vr: any) => vr.range && vr.range.includes('Permohonan'));

  const employees: Employee[] = [];
  const requests: LeaveRequest[] = [];

  // Parse Pegawai
  if (pegawaiRange && pegawaiRange.values && pegawaiRange.values.length > 1) {
    // Skip headers at index 0
    for (let i = 1; i < pegawaiRange.values.length; i++) {
      const row = pegawaiRange.values[i];
      // A row is valid if it has at least NIP or Nama filled. If both are blank, skip.
      if (!row[1] && !row[2]) continue;

      // Auto-generate ID if Column A is missing (happens when manually adding names directly in sheets)
      const empId = row[0] || 'emp-' + (row[1] || '').trim().replace(/[^a-zA-Z0-9]/g, '') || 'emp-' + Math.random().toString(36).substring(2, 9);

      employees.push({
        id: empId,
        nip: row[1] || '',
        nama: row[2] || '',
        jabatan: row[3] || '',
        masaKerja: row[4] || '',
        unitKerja: row[5] || '',
        sisaCutiN: isNaN(parseInt(row[6])) ? 12 : parseInt(row[6]),
        sisaCutiN1: isNaN(parseInt(row[7])) ? 6 : parseInt(row[7]),
        sisaCutiN2: isNaN(parseInt(row[8])) ? 6 : parseInt(row[8])
      });
    }
  }

  // Parse Permohonan Cuti
  if (permohonanRange && permohonanRange.values && permohonanRange.values.length > 1) {
    // Skip headers at index 0
    for (let i = 1; i < permohonanRange.values.length; i++) {
      const row = permohonanRange.values[i];
      // Skip if it doesn't have an employee id or name
      if (!row[1] && !row[3]) continue;

      const reqId = row[0] || 'req-' + Math.random().toString(36).substring(2, 9);

      requests.push({
        id: reqId,
        employeeId: row[1] || '',
        employeeNip: row[2] || '',
        employeeName: row[3] || '',
        employeeJabatan: row[4] || '',
        employeeMasaKerja: row[5] || '',
        employeeUnitKerja: row[6] || '',
        jenisCuti: (row[7] as JenisCuti) || 'Cuti Tahunan',
        tanggalMulai: row[8] || '',
        tanggalSelesai: row[9] || '',
        alasan: row[10] || '',
        alamatCuti: row[11] || '',
        telp: row[12] || '',
        durasiHari: isNaN(parseInt(row[13])) ? 0 : parseInt(row[13]),
        status: (row[14] as StatusCuti) || 'Pending',
        catatanAtasan: row[15] || '',
        catatanPimpinan: row[16] || '',
        tanggalPersetujuan: row[17] || '',
        tanggalPengajuan: row[18] || ''
      });
    }
  }

  return { employees, requests };
}

/**
 * Simple robust CSV parser for Google Sheets Query CSV output.
 * Handles quoted cells with embedded commas properly.
 */
function parseCsv(csvText: string): string[][] {
  const result: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let currentCell = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    result.push(row);
  }
  return result;
}

/**
 * Fetch and parse data from Google Sheet publicly (Without Access Token / Credentials)
 * Requires the Spreadsheet to be shared as "Anyone with link can view".
 */
export async function fetchFromPublicGoogleSheet(spreadsheetId: string): Promise<SheetData> {
  const employeesUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Pegawai`;
  const requestsUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Permohonan%20Cuti`;

  // Fetch both concurrently
  const [empResponse, reqResponse] = await Promise.all([
    fetch(employeesUrl),
    fetch(requestsUrl)
  ]);

  if (!empResponse.ok || !reqResponse.ok) {
    throw new Error('Gagal mengambil data dari Google Sheet publik. Pastikan Spreadsheet Anda telah disetel ke "Siapa saja yang memiliki link dapat melihat" di menu Bagikan.');
  }

  const empText = await empResponse.text();
  const reqText = await reqResponse.text();

  const empRows = parseCsv(empText);
  const reqRows = parseCsv(reqText);

  const employees: Employee[] = [];
  const requests: LeaveRequest[] = [];

  // Parse Pegawai
  if (empRows.length > 1) {
    // Row 0 is headers: ["ID", "NIP", "Nama", "Jabatan", "Masa Kerja", "Unit Kerja", "Sisa Cuti N", "Sisa Cuti N-1", "Sisa Cuti N-2"]
    for (let i = 1; i < empRows.length; i++) {
      const row = empRows[i];
      if (row.length < 3) continue; // Invalid row

      const empId = row[0] || 'emp-' + Math.random().toString(36).substring(2, 9);
      employees.push({
        id: empId,
        nip: row[1] || '',
        nama: row[2] || '',
        jabatan: row[3] || '',
        masaKerja: row[4] || '',
        unitKerja: row[5] || '',
        sisaCutiN: isNaN(parseInt(row[6])) ? 12 : parseInt(row[6]),
        sisaCutiN1: isNaN(parseInt(row[7])) ? 6 : parseInt(row[7]),
        sisaCutiN2: isNaN(parseInt(row[8])) ? 6 : parseInt(row[8])
      });
    }
  }

  // Parse Permohonan Cuti
  if (reqRows.length > 1) {
    for (let i = 1; i < reqRows.length; i++) {
      const row = reqRows[i];
      if (row.length < 4) continue; // Invalid row

      const reqId = row[0] || 'req-' + Math.random().toString(36).substring(2, 9);
      requests.push({
        id: reqId,
        employeeId: row[1] || '',
        employeeNip: row[2] || '',
        employeeName: row[3] || '',
        employeeJabatan: row[4] || '',
        employeeMasaKerja: row[5] || '',
        employeeUnitKerja: row[6] || '',
        jenisCuti: (row[7] as JenisCuti) || 'Cuti Tahunan',
        tanggalMulai: row[8] || '',
        tanggalSelesai: row[9] || '',
        alasan: row[10] || '',
        alamatCuti: row[11] || '',
        telp: row[12] || '',
        durasiHari: isNaN(parseInt(row[13])) ? 0 : parseInt(row[13]),
        status: (row[14] as StatusCuti) || 'Pending',
        catatanAtasan: row[15] || '',
        catatanPimpinan: row[16] || '',
        tanggalPersetujuan: row[17] || '',
        tanggalPengajuan: row[18] || ''
      });
    }
  }

  return { employees, requests };
}
