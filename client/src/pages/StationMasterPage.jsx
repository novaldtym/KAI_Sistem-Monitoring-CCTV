import React, { useEffect, useState } from 'react';
import {
  getStationsApi,
  createStationApi,
  updateStationApi,
  deleteStationApi,
} from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const StationMasterPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [namaStasiun, setNamaStasiun] = useState('');
  const [businessArea, setBusinessArea] = useState('');
  const [kodeStasiun, setKodeStasiun] = useState('');

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
    setShowModal(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStation(st);
    setNamaStasiun(st.nama_stasiun);
    setBusinessArea(st.business_area);
    setKodeStasiun(st.kode_stasiun || '');
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
        });
        toast.success('Stasiun diperbarui.');
      } else {
        await createStationApi({
          nama_stasiun: namaStasiun,
          business_area: businessArea,
          kode_stasiun: kodeStasiun,
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

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Master Data Stasiun & Business Area</h1>
          <p className="page-subtitle">Kelola unit stasiun kerja KAI</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <FiPlus /> Tambah Stasiun
        </button>
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

export default StationMasterPage;
