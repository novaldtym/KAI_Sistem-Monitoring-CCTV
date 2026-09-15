import React, { useEffect, useState } from 'react';
import {
  getStationsApi,
  getCCTVPointsByStationApi,
  createCCTVPointApi,
  updateCCTVPointApi,
  deleteCCTVPointApi,
  importCCTVPointsApi,
} from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';
import * as xlsx from 'xlsx';

const CCTVMasterPage = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);

  const [editingPoint, setEditingPoint] = useState(null);
  const [namaTitik, setNamaTitik] = useState('');
  const [nomorUrut, setNomorUrut] = useState(1);
  const [merk, setMerk] = useState('');
  const [modelCctv, setModelCctv] = useState('');
  const [jenis, setJenis] = useState('');
  const [tipeLokasi, setTipeLokasi] = useState('');
  const [resolusi, setResolusi] = useState('');

  useEffect(() => {
    getStationsApi().then((res) => {
      const data = res.data.data;
      setStations(data);
      if (data.length > 0) {
        setSelectedStation(data[0].id);
      }
    });
  }, []);

  const fetchPoints = (stationId) => {
    if (!stationId) return;
    setLoading(true);
    getCCTVPointsByStationApi(stationId)
      .then((res) => setPoints(res.data.data))
      .catch(() => toast.error('Gagal memuat titik CCTV.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPoints(selectedStation);
  }, [selectedStation]);

  const handleOpenAdd = () => {
    setEditingPoint(null);
    setNamaTitik('');
    setNomorUrut(points.length + 1);
    setMerk('');
    setModelCctv('');
    setJenis('');
    setTipeLokasi('');
    setResolusi('');
    setShowModal(true);
  };

  const handleOpenEdit = (point) => {
    setEditingPoint(point);
    setNamaTitik(point.nama_titik);
    setNomorUrut(point.nomor_urut);
    setMerk(point.merk || '');
    setModelCctv(point.model_cctv || '');
    setJenis(point.jenis || '');
    setTipeLokasi(point.tipe_lokasi || '');
    setResolusi(point.resolusi || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      nama_titik: namaTitik,
      nomor_urut: parseInt(nomorUrut),
      merk,
      model_cctv: modelCctv,
      jenis,
      tipe_lokasi: tipeLokasi,
      resolusi
    };
    try {
      if (editingPoint) {
        await updateCCTVPointApi(editingPoint.id, payload);
        toast.success('Titik CCTV diperbarui.');
      } else {
        await createCCTVPointApi({
          station_id: parseInt(selectedStation),
          ...payload,
        });
        toast.success('Titik CCTV ditambahkan.');
      }
      setShowModal(false);
      fetchPoints(selectedStation);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menonaktifkan titik CCTV ini?')) return;
    try {
      await deleteCCTVPointApi(id);
      toast.success('Titik CCTV dinonaktifkan.');
      fetchPoints(selectedStation);
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
    formData.append('station_id', selectedStation);
    
    try {
      const res = await importCCTVPointsApi(formData);
      toast.success(res.data.message || 'Impor selesai.');
      if (res.data.data && res.data.data.errors && res.data.data.errors.length > 0) {
        setImportErrors(res.data.data.errors);
      } else {
        setShowImportModal(false);
      }
      fetchPoints(selectedStation);
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
          <h1 className="page-title">Master Data Titik CCTV</h1>
          <p className="page-subtitle">Kelola daftar lokasi dan posisi kamera CCTV per stasiun</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleOpenImport} className="btn btn-secondary" disabled={!selectedStation}>
            <FiUpload /> Impor
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary" disabled={!selectedStation}>
            <FiPlus /> Tambah Titik CCTV
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group" style={{ marginBottom: 0, maxWidth: '300px' }}>
          <label className="form-label">Pilih Stasiun</label>
          <select
            className="form-control"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
          >
            {stations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.nama_stasiun} ({st.business_area})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : points.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>No. Urut</th>
                <th>Nama Titik CCTV</th>
                <th>Jenis</th>
                <th>Lokasi</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '700' }}>{p.nomor_urut}</td>
                  <td>{p.nama_titik}</td>
                  <td>{p.jenis ? p.jenis.toUpperCase() : '-'}</td>
                  <td>{p.tipe_lokasi ? (p.tipe_lokasi === 'indoor' ? 'Indoor' : 'Outdoor') : '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="btn btn-secondary btn-sm btn-icon"
                      style={{ marginRight: '6px' }}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
          <p>Belum ada titik CCTV di stasiun ini.</p>
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{editingPoint ? 'Edit Titik CCTV' : 'Tambah Titik CCTV Baru'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nomor Urut</label>
                <input
                  type="number"
                  className="form-control"
                  value={nomorUrut}
                  onChange={(e) => setNomorUrut(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Titik CCTV</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: LPN - Sandal Mushola"
                  value={namaTitik}
                  onChange={(e) => setNamaTitik(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Merk (Opsional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: Hikvision"
                    value={merk}
                    onChange={(e) => setMerk(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model CCTV (Opsional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: DS-2CD1143"
                    value={modelCctv}
                    onChange={(e) => setModelCctv(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Jenis Kamera</label>
                  <select
                    className="form-control"
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                  >
                    <option value="">Pilih Jenis</option>
                    <option value="dome">Dome</option>
                    <option value="bullet">Bullet</option>
                    <option value="ptz">PTZ</option>
                    <option value="box">Box</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe Lokasi</label>
                  <select
                    className="form-control"
                    value={tipeLokasi}
                    onChange={(e) => setTipeLokasi(e.target.value)}
                  >
                    <option value="">Pilih Lokasi</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resolusi (Opsional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 1080p, 4MP"
                  value={resolusi}
                  onChange={(e) => setResolusi(e.target.value)}
                />
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
            <h2 className="modal-title">Impor Data Titik CCTV</h2>
            <div className="form-group">
              <label className="form-label">Upload File Excel (.xlsx) / CSV</label>
              <input
                type="file"
                className="form-control"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Format kolom wajib: Nomor Urut, Nama Titik.
                <br />
                Kolom opsional: Merk, Model CCTV, Jenis (dome/bullet/ptz/box), Lokasi (indoor/outdoor), Resolusi.
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

export default CCTVMasterPage;
