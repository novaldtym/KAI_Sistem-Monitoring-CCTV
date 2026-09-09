import React, { useEffect, useState } from 'react';
import {
  getStationsApi,
  getCCTVPointsByStationApi,
  createCCTVPointApi,
  updateCCTVPointApi,
  deleteCCTVPointApi,
} from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const CCTVMasterPage = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [namaTitik, setNamaTitik] = useState('');
  const [nomorUrut, setNomorUrut] = useState(1);

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
    setShowModal(true);
  };

  const handleOpenEdit = (point) => {
    setEditingPoint(point);
    setNamaTitik(point.nama_titik);
    setNomorUrut(point.nomor_urut);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingPoint) {
        await updateCCTVPointApi(editingPoint.id, { nama_titik: namaTitik, nomor_urut: parseInt(nomorUrut) });
        toast.success('Titik CCTV diperbarui.');
      } else {
        await createCCTVPointApi({
          station_id: parseInt(selectedStation),
          nama_titik: namaTitik,
          nomor_urut: parseInt(nomorUrut),
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

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Master Data Titik CCTV</h1>
          <p className="page-subtitle">Kelola daftar lokasi dan posisi kamera CCTV per stasiun</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" disabled={!selectedStation}>
          <FiPlus /> Tambah Titik CCTV
        </button>
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
                <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '700' }}>{p.nomor_urut}</td>
                  <td>{p.nama_titik}</td>
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
    </div>
  );
};

export default CCTVMasterPage;
