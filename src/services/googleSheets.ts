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
  const employeesUrl = `/api/public-sheet?id=${spreadsheetId}&sheet=Pegawai`;
  const requestsUrl = `/api/public-sheet?id=${spreadsheetId}&sheet=Permohonan%20Cuti`;

  // Fetch both concurrently
  const [empResponse, reqResponse] = await Promise.all([
    fetch(employeesUrl),
    fetch(requestsUrl)
  ]);

  if (!empResponse.ok) {
    let errorMsg = `Gagal mengambil data Pegawai dari Google Sheet publik (Kode Status: ${empResponse.status}).`;
    try {
      const errText = await empResponse.text();
      try {
        const errJson = JSON.parse(errText);
        if (errJson && errJson.error) {
          errorMsg = errJson.error;
        }
      } catch (e) {
        // Not a JSON response, maybe HTML or plain text
        if (errText && errText.trim()) {
          // If it's HTML, extract the title or just show a snippet
          if (errText.includes('<title>')) {
            const titleMatch = errText.match(/<title>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              errorMsg += ` Detail: ${titleMatch[1].trim()}`;
            } else {
              errorMsg += ` Detail: ${errText.slice(0, 150).replace(/<[^>]*>/g, '').trim()}...`;
            }
          } else {
            errorMsg += ` Detail: ${errText.slice(0, 150).trim()}`;
          }
        }
      }
    } catch (e) {
      // Fetch text failed
    }
    throw new Error(errorMsg);
  }

  if (!reqResponse.ok) {
    let errorMsg = `Gagal mengambil data Permohonan Cuti dari Google Sheet publik (Kode Status: ${reqResponse.status}).`;
    try {
      const errText = await reqResponse.text();
      try {
        const errJson = JSON.parse(errText);
        if (errJson && errJson.error) {
          errorMsg = errJson.error;
        }
      } catch (e) {
        // Not a JSON response
        if (errText && errText.trim()) {
          if (errText.includes('<title>')) {
            const titleMatch = errText.match(/<title>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              errorMsg += ` Detail: ${titleMatch[1].trim()}`;
            } else {
              errorMsg += ` Detail: ${errText.slice(0, 150).replace(/<[^>]*>/g, '').trim()}...`;
            }
          } else {
            errorMsg += ` Detail: ${errText.slice(0, 150).trim()}`;
          }
        }
      }
    } catch (e) {
      // Fetch text failed
    }
    throw new Error(errorMsg);
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

/**
 * Fetch and parse data from Google Sheet using Google Apps Script Web App Bridge via local backend proxy
 */
export async function fetchFromAppsScript(
  appscriptUrl: string,
  spreadsheetId: string
): Promise<SheetData> {
  const cleanUrl = appscriptUrl.trim();
  const cleanId = spreadsheetId.trim();
  
  if (!cleanUrl) {
    throw new Error('URL Jembatan Apps Script kosong. Silakan atur di panel.');
  }
  if (!cleanId) {
    throw new Error('ID Spreadsheet kosong. Silakan atur di panel.');
  }

  try {
    const response = await fetch('/api/apps-script-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: cleanUrl,
        id: cleanId,
        action: 'pull'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try { parsedErr = JSON.parse(errText); } catch (e) {}
      throw new Error(parsedErr?.error || `Koneksi ke Google Apps Script via Proxy gagal (Kode Status: ${response.status}).`);
    }

    const resData = await response.json();
    if (resData && resData.error) {
      throw new Error(`Kendala Apps Script: ${resData.error}`);
    }

    return {
      employees: resData.employees || [],
      requests: resData.requests || []
    };
  } catch (err: any) {
    console.error('Error fetching from Apps Script via proxy:', err);
    throw new Error(err.message || 'Gagal menghubungi Google Apps Script melalui server proxy. Pastikan URL Web App benar dan telah diset ke akses "Siapa saja (Anyone)".');
  }
}

/**
 * Push data to Google Sheet using Google Apps Script Web App Bridge via local backend proxy
 */
export async function syncToAppsScript(
  appscriptUrl: string,
  spreadsheetId: string,
  employees: Employee[],
  requests: LeaveRequest[]
): Promise<void> {
  const cleanUrl = appscriptUrl.trim();
  const cleanId = spreadsheetId.trim();
  
  if (!cleanUrl) {
    throw new Error('URL Jembatan Apps Script kosong.');
  }
  if (!cleanId) {
    throw new Error('ID Spreadsheet kosong.');
  }

  try {
    const response = await fetch('/api/apps-script-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: cleanUrl,
        id: cleanId,
        action: 'push',
        data: { employees, requests }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try { parsedErr = JSON.parse(errText); } catch (e) {}
      throw new Error(parsedErr?.error || `Gagal mengirim data ke Apps Script via Proxy (Kode Status: ${response.status})`);
    }

    const resData = await response.json();
    if (resData && resData.error) {
      throw new Error(`Kendala Apps Script saat menyimpan: ${resData.error}`);
    }
  } catch (err: any) {
    console.error('Error syncing to Apps Script via proxy:', err);
    throw new Error(err.message || 'Gagal mengirim data ke Google Apps Script melalui server proxy. Pastikan konfigurasi Web App Anda sudah benar.');
  }
}

