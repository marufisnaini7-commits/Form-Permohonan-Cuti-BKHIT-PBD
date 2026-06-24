import React, { useState } from 'react';
import { Employee } from '../types';
import { Users, Plus, RotateCcw, AlertCircle, Edit2, Save, Trash2, Check } from 'lucide-react';

interface DatabaseCutiViewProps {
  employees: Employee[];
  onUpdateEmployees: (updated: Employee[]) => void;
  onResetDatabase: () => void;
}

export const DatabaseCutiView: React.FC<DatabaseCutiViewProps> = ({
  employees,
  onUpdateEmployees,
  onResetDatabase
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Editing state
  const [editSisaN, setEditSisaN] = useState<number>(0);
  const [editSisaN1, setEditSisaN1] = useState<number>(0);
  const [editSisaN2, setEditSisaN2] = useState<number>(0);

  // Form State
  const [nip, setNip] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [masaKerja, setMasaKerja] = useState('');
  const [unitKerja, setUnitKerja] = useState('Balai Karantina Hewan, Ikan dan Tumbuhan Papua Barat Daya');
  const [sisaCutiN, setSisaCutiN] = useState(12);
  const [sisaCutiN1, setSisaCutiN1] = useState(6);
  const [sisaCutiN2, setSisaCutiN2] = useState(0);

  const [error, setError] = useState('');

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip || !nama || !jabatan || !masaKerja || !unitKerja) {
      setError('Harap isi semua kolom formulir.');
      return;
    }

    if (employees.some(emp => emp.nip === nip)) {
      setError('Pegawai dengan NIP tersebut sudah terdaftar.');
      return;
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      nip,
      nama,
      jabatan,
      masaKerja,
      unitKerja,
      sisaCutiN,
      sisaCutiN1,
      sisaCutiN2
    };

    onUpdateEmployees([...employees, newEmp]);
    
    // Reset Form
    setNip('');
    setNama('');
    setJabatan('');
    setMasaKerja('');
    setSisaCutiN(12);
    setSisaCutiN1(6);
    setSisaCutiN2(0);
    setError('');
    setShowAddForm(false);
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditSisaN(emp.sisaCutiN);
    setEditSisaN1(emp.sisaCutiN1);
    setEditSisaN2(emp.sisaCutiN2);
  };

  const saveEdit = (id: string) => {
    const updated = employees.map(emp => {
      if (emp.id === id) {
        return { 
          ...emp, 
          sisaCutiN: editSisaN,
          sisaCutiN1: editSisaN1,
          sisaCutiN2: editSisaN2
        };
      }
      return emp;
    });
    onUpdateEmployees(updated);
    setEditingId(null);
  };

  const deleteEmployee = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pegawai ini dari database sisa cuti?')) {
      const updated = employees.filter(emp => emp.id !== id);
      onUpdateEmployees(updated);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8" id="database-cuti-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Database Sisa Cuti Pegawai BKHIT Papua Barat Daya (Live)</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Data terintegrasi langsung dengan form pengajuan dan preview dokumen resmi (Cuti Tahunan N, N-1, N-2).
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            id="btn-add-employee"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
          <button
            onClick={onResetDatabase}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Reset Database ke Data Contoh"
            id="btn-reset-db"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddEmployee} className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6 animate-fadeIn" id="add-employee-form">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Daftarkan Pegawai Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">NIP (Nomor Induk Pegawai)</label>
              <input
                type="text"
                placeholder="Contoh: 19820514 200902 1 003"
                value={nip}
                onChange={e => setNip(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                id="input-emp-nip"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nama Lengkap (Beserta Gelar)</label>
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={nama}
                onChange={e => setNama(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                id="input-emp-nama"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Jabatan</label>
              <input
                type="text"
                placeholder="Jabatan Fungsional/Struktural"
                value={jabatan}
                onChange={e => setJabatan(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                id="input-emp-jabatan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Masa Kerja</label>
              <input
                type="text"
                placeholder="Contoh: 15 Tahun"
                value={masaKerja}
                onChange={e => setMasaKerja(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                id="input-emp-masakerja"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Unit Kerja</label>
              <input
                type="text"
                placeholder="Unit Kerja"
                value={unitKerja}
                onChange={e => setUnitKerja(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                id="input-emp-unitkerja"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 border-t border-gray-200 pt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sisa Cuti N (Berjalan)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={sisaCutiN}
                onChange={e => setSisaCutiN(parseInt(e.target.value) || 0)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                id="input-sisa-n"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sisa Cuti N-1 (Sebelumnya)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={sisaCutiN1}
                onChange={e => setSisaCutiN1(parseInt(e.target.value) || 0)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                id="input-sisa-n1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sisa Cuti N-2</label>
              <input
                type="number"
                min="0"
                max="30"
                value={sisaCutiN2}
                onChange={e => setSisaCutiN2(parseInt(e.target.value) || 0)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                id="input-sisa-n2"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center space-x-1 mt-4">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}

          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              id="btn-cancel-add-emp"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              id="btn-submit-add-emp"
            >
              Simpan Pegawai
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/75 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold">NIP</th>
              <th className="px-6 py-4 font-semibold">Nama Pegawai</th>
              <th className="px-6 py-4 font-semibold">Jabatan</th>
              <th className="px-6 py-4 font-semibold text-center">Masa Kerja</th>
              <th className="px-6 py-4 font-semibold text-center">Sisa Cuti (N / N-1 / N-2)</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  Tidak ada pegawai terdaftar dalam database.
                </td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors" id={`row-emp-${emp.id}`}>
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">{emp.nip}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{emp.nama}</td>
                  <td className="px-6 py-4 text-xs">{emp.jabatan}</td>
                  <td className="px-6 py-4 text-center text-xs text-gray-500">{emp.masaKerja}</td>
                  <td className="px-6 py-4 text-center">
                    {editingId === emp.id ? (
                      <div className="flex items-center justify-center space-x-1" id={`edit-box-${emp.id}`}>
                        <div className="flex flex-col space-y-1">
                          <label className="text-[8px] text-gray-400">N berjalan</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={editSisaN}
                            onChange={e => setEditSisaN(parseInt(e.target.value) || 0)}
                            className="w-12 text-center text-xs border border-gray-300 rounded py-0.5 outline-none"
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-[8px] text-gray-400">N-1</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={editSisaN1}
                            onChange={e => setEditSisaN1(parseInt(e.target.value) || 0)}
                            className="w-12 text-center text-xs border border-gray-300 rounded py-0.5 outline-none"
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-[8px] text-gray-400">N-2</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={editSisaN2}
                            onChange={e => setEditSisaN2(parseInt(e.target.value) || 0)}
                            className="w-12 text-center text-xs border border-gray-300 rounded py-0.5 outline-none"
                          />
                        </div>
                        <button
                          onClick={() => saveEdit(emp.id)}
                          className="p-1 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors self-end"
                          title="Simpan"
                          id={`btn-save-edit-${emp.id}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-1.5 font-mono text-xs font-semibold">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full" title="Tahun berjalan (N)">
                          N: {emp.sisaCutiN}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-full" title="Tahun N-1">
                          N-1: {emp.sisaCutiN1}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-800 rounded-full" title="Tahun N-2">
                          N-2: {emp.sisaCutiN2}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {editingId !== emp.id && (
                        <button
                          onClick={() => startEdit(emp)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors cursor-pointer"
                          title="Edit Sisa Cuti"
                          id={`btn-edit-emp-${emp.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteEmployee(emp.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Pegawai"
                        id={`btn-delete-emp-${emp.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
