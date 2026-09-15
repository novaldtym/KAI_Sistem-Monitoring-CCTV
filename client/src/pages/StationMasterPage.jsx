import React, { useEffect, useState } from 'react';
import {
  getStationsApi,
  createStationApi,
  updateStationApi,
  deleteStationApi,
  importStationsApi
} from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';
import * as xlsx from 'xlsx';


const StationMasterPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [namaStasiun, setNamaStasiun] = useState('');
  const [businessArea, setBusinessArea] = useState('');
  const [kodeStasiun, setKodeStasiun] = useState('');
  const [hariMulaiM1, setHariMulaiM1] = useState(1);

  const fetchStations = () => {
    setLoading(true);
    getStationsApi()
      .then((res) => setStations(res.data.data))
      .catch(() => toast.error('Gagal memuat stasiun.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleOpenAdd = () => {
    setEditingStation(null);
    setNamaStasiun('');
    setBusinessArea('B060');
    setKodeStasiun('');
    setHariMulaiM1(1);
    setShowModal(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStation(st);
    setNamaStasiun(st.nama_stasiun);
    setBusinessArea(st.business_area);
    setKodeStasiun(st.kode_stasiun || '');
    setHariMulaiM1(st.hari_mulai_m1 || 1);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingStation) {
        await updateStationApi(editingStation.id, {
          nama_stasiun: namaStasiun,
          business_area: businessArea,
          kode_stasiun: kodeStasiun,
          hari_mulai_m1: parseInt(hariMulaiM1),
        });
        toast.success('Stasiun diperbarui.');
      } else {
        await createStationApi({
          nama_stasiun: namaStasiun,
          business_area: businessArea,
          kode_stasiun: kodeStasiun,
          hari_mulai_m1: parseInt(hariMulaiM1),
        });
        toast.success('Stasiun ditambahkan.');
      }
      setShowModal(false);
      fetchStations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menonaktifkan stasiun ini?')) return;
    try {
      await deleteStationApi(id);
      toast.success('Stasiun dinonaktifkan.');
      fetchStations();
    } catch {
      toast.error('Gagal menghapus.');
    }
  };

  const handleOpenImport = () => {
    setImportFile(null);
    setPreviewData([]);
    setImportErrors([]);
    setShowImportModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws);
        setPreviewData(data.slice(0, 5));
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      toast.error('Pilih file terlebih dahulu.');
      return;
    }
    setImporting(true);
    setImportErrors([]);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const res = await importStationsApi(formData);
      toast.success(res.data.message || 'Impor selesai.');
      if (res.data.data && res.data.data.errors && res.data.data.errors.length > 0) {
        setImportErrors(res.data.data.errors);
      } else {
        setShowImportModal(false);
      }
      fetchStations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengimpor data.');
      if (err.response?.data?.data?.errors) {
        setImportErrors(err.response.data.data.errors);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Master Data Stasiun & Business Area</h1>
          <p className="page-subtitle">Kelola unit stasiun kerja KAI</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleOpenImport} className="btn btn-secondary">
            <FiUpload /> Impor
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <FiPlus /> Tambah Stasiun
          </button>
        </div>
      </div>


      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : stations.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business Area</th>
                <th>Nama Stasiun</th>
                <th>Kode Stasiun</th>
                <th>Hari Mulai M1</th>
                <th>Jumlah CCTV</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((st) => (
                <tr key={st.id}>
                  <td style={{ fontWeight: '700', color: 'var(--kai-orange)' }}>{st.business_area}</td>
                  <td>{st.nama_stasiun}</td>
                  <td>{st.kode_stasiun || '-'}</td>
                  <td>Tanggal {st.hari_mulai_m1 || 1}</td>
                  <td>{st.cctvPoints?.length || 0} Titik</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenEdit(st)}
                      className="btn btn-secondary btn-sm btn-icon"
                      style={{ marginRight: '6px' }}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(st.id)}
                      className="btn btn-secondary btn-sm btn-icon"
                      style={{ color: 'var(--status-danger)' }}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state">
          <p>Belum ada stasiun yang terdaftar.</p>
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{editingStation ? 'Edit Stasiun' : 'Tambah Stasiun Baru'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nama Stasiun</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: Stasiun Lempuyangan"
                  value={namaStasiun}
                  onChange={(e) => setNamaStasiun(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Area</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: B060"
                  value={businessArea}
                  onChange={(e) => setBusinessArea(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kode Stasiun (Singkatan)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: LPN"
                  value={kodeStasiun}
                  onChange={(e) => setKodeStasiun(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hari Mulai M1 (tanggal 1-28)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="28"
                  value={hariMulaiM1}
                  onChange={(e) => setHariMulaiM1(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  M2 = M1+7 hari, M3 = M1+14 hari, M4 = M1+21 hari
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px', width: '100%' }}>
            <h2 className="modal-title">Impor Data Stasiun</h2>
            <div className="form-group">
              <label className="form-label">Upload File Excel (.xlsx) / CSV</label>
              <input
                type="file"
                className="form-control"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Format kolom wajib: Nama Stasiun, Business Area, Kode Stasiun, Hari Mulai M1
              </small>
            </div>

            {previewData.length > 0 && (
              <div className="form-group">
                <label className="form-label">Preview Data (5 baris pertama)</label>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        {Object.keys(previewData[0]).map((key, i) => (
                          <th key={i}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => (
                            <td key={j}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="alert alert-danger" style={{ marginTop: '16px', background: '#fdf2f2', border: '1px solid #f9cccc', color: 'var(--status-danger)', padding: '12px', borderRadius: '4px' }}>
                <p style={{ fontWeight: '600', marginBottom: '8px' }}>Terdapat Error pada Impor:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button type="button" onClick={() => setShowImportModal(false)} className="btn btn-secondary">
                Batal
              </button>
              <button 
                type="button" 
                onClick={handleImportSubmit} 
                className="btn btn-primary"
                disabled={!importFile || importing}
              >
                {importing ? 'Mengimpor...' : 'Mulai Impor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default StationMasterPage;
