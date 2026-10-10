import React, { useEffect, useState } from 'react';
import {
  getStationsApi,
  createStationApi,
  updateStationApi,
  deleteStationApi,
} from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';
import InventoryImportModal from '../components/InventoryImportModal';


const StationMasterPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [editingStation, setEditingStation] = useState(null);
  const [namaStasiun, setNamaStasiun] = useState('');
  const [wilayah, setWilayah] = useState('Daop 6 Yogyakarta');
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
    setWilayah('Daop 6 Yogyakarta');
    setKodeStasiun('');
    setShowModal(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStation(st);
    setNamaStasiun(st.nama_stasiun);
    setWilayah(st.wilayah || '');
    setKodeStasiun(st.kode_stasiun || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingStation) {
        await updateStationApi(editingStation.id, {
          nama_stasiun: namaStasiun,
          wilayah: wilayah.trim() || null,
          kode_stasiun: kodeStasiun,
        });
        toast.success('Stasiun diperbarui.');
      } else {
        await createStationApi({
          nama_stasiun: namaStasiun,
          wilayah: wilayah.trim() || null,
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
    if (!window.confirm('Hapus stasiun ini beserta seluruh titik CCTV-nya secara permanen?')) return;
    try {
      await deleteStationApi(id);
      toast.success('Stasiun dan titik CCTV-nya dihapus.');
      fetchStations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus stasiun.');
    }
  };

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Master Data Stasiun</h1>
          <p className="page-subtitle">Kelola unit stasiun kerja KAI</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
            <FiUpload /> Impor Excel KAI
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
                <th style={{ width: '64px' }}>No.</th>
                <th>Wilayah</th>
                <th>Nama Stasiun</th>
                <th>Kode Stasiun</th>
                <th>Jumlah Kelompok</th>
                <th>Jumlah Kamera</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((st, index) => (
                <tr key={st.id}>
                  <td>{index + 1}</td>
                  <td>{st.wilayah || '-'}</td>
                  <td>{st.nama_stasiun}</td>
                  <td>{st.kode_stasiun || '-'}</td>
                  <td>{st.jumlah_kelompok ?? st.cctvPoints?.length ?? 0}</td>
                  <td>{st.jumlah_kamera ?? 0}</td>
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
                <label className="form-label">Wilayah</label>
                <input type="text" className="form-control" maxLength={100} value={wilayah}
                  placeholder="Contoh: Daop 6 Yogyakarta" onChange={(e) => setWilayah(e.target.value)} />
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

              <p className="page-subtitle">Jadwal seluruh stasiun: M1 dimulai pada Senin pertama bulan tersebut. Setiap minggu berlangsung Senin–Minggu, dengan 4 atau 5 minggu per bulan.</p>

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

      {showImportModal && (
        <InventoryImportModal onClose={() => setShowImportModal(false)} onImported={fetchStations} />
      )}
    </div>

  );
};

export default StationMasterPage;
