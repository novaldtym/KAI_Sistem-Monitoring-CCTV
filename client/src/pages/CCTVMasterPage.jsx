import React, { useEffect, useState } from 'react';
import {
  getStationsApi,
  getCCTVPointsByStationApi,
  createCCTVPointApi,
  updateCCTVPointApi,
  deleteCCTVPointApi,
} from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';
import InventoryImportModal from '../components/InventoryImportModal';

const CCTV_TYPES = ['IP Camera', 'Analog Camera', 'Standalone Camera'];

const CCTVMasterPage = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);


  const [editingPoint, setEditingPoint] = useState(null);
  const [namaTitik, setNamaTitik] = useState('');
  const [nomorUrut, setNomorUrut] = useState(1);
  const [merk, setMerk] = useState('');
  const [modelCctv, setModelCctv] = useState('');
  const [jenis, setJenis] = useState('');
  const [tipeLokasi, setTipeLokasi] = useState('');
  const [resolusi, setResolusi] = useState('');
  const [jumlahKamera, setJumlahKamera] = useState(1);
  const [unitPengelola, setUnitPengelola] = useState('');
  const [kategori, setKategori] = useState('');
  const [fungsiAi, setFungsiAi] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const fetchStations = () => {
    getStationsApi().then((res) => {
      const data = res.data.data;
      setStations(data);
      setSelectedStation((current) => data.some((station) => String(station.id) === String(current))
        ? current : data[0]?.id || '');
    }).catch(() => toast.error('Gagal memuat stasiun.'));
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchPoints = (stationId) => {
    if (!stationId) {
      setPoints([]);
      return;
    }
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
    setNomorUrut(Math.max(0, ...points.map((point) => point.nomor_urut)) + 1);
    setMerk('');
    setModelCctv('');
    setJenis('');
    setTipeLokasi('');
    setResolusi('');
    setJumlahKamera(1);
    setUnitPengelola('');
    setKategori('');
    setFungsiAi('');
    setKeterangan('');
    setShowModal(true);
  };

  const handleOpenEdit = (point) => {
    setEditingPoint(point);
    setNamaTitik(point.nama_titik);
    setNomorUrut(point.nomor_urut);
    setMerk(point.merk || '');
    setModelCctv(point.model_cctv || '');
    setJenis(CCTV_TYPES.includes(point.jenis) ? point.jenis : '');
    setTipeLokasi(point.tipe_lokasi || '');
    setResolusi(point.resolusi || '');
    setJumlahKamera(point.jumlah_kamera || 1);
    setUnitPengelola(point.unit_pengelola || '');
    setKategori(point.kategori || '');
    setFungsiAi(point.fungsi_ai || '');
    setKeterangan(point.keterangan || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      nama_titik: namaTitik,
      nomor_urut: Number(nomorUrut),
      merk,
      model_cctv: modelCctv,
      jenis,
      tipe_lokasi: tipeLokasi,
      resolusi,
      jumlah_kamera: Number(jumlahKamera),
      unit_pengelola: unitPengelola,
      kategori,
      fungsi_ai: fungsiAi,
      keterangan,
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
    if (!window.confirm('Hapus titik CCTV ini secara permanen?')) return;
    try {
      await deleteCCTVPointApi(id);
      toast.success('Titik CCTV dihapus.');
      fetchPoints(selectedStation);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus titik CCTV.');
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
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
            <FiUpload /> Impor Excel KAI
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary" disabled={!selectedStation}>
            <FiPlus /> Tambah Titik CCTV
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group" style={{ marginBottom: 0, maxWidth: '300px' }}>
          <label className="form-label" htmlFor="cctv-station">Pilih Stasiun</label>
          <select
            id="cctv-station"
            className="form-control"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
          >
            {stations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.nama_stasiun}
              </option>
            ))}
          </select>
        </div>
        <p className="page-subtitle" style={{ marginTop: '12px' }}>
          {points.length} kelompok lokasi, {points.reduce((sum, point) => sum + (point.jumlah_kamera || 1), 0)} kamera.
          Setiap kelompok menjadi satu baris pemeriksaan.
        </p>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : points.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>No. Urut</th>
                <th>Penempatan / Objek Pantau</th>
                <th>Unit Pengelola</th>
                <th>Kategori</th>
                <th>Jenis CCTV</th>
                <th>Merek</th>
                <th>Fungsi AI</th>
                <th>Jumlah Kamera</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '700' }}>{p.nomor_urut}</td>
                  <td style={{ minWidth: '200px' }}>
                    {p.nama_titik}
                  </td>
                  <td>{p.unit_pengelola || '-'}</td>
                  <td>{p.kategori || '-'}</td>
                  <td>{p.jenis || '-'}</td>
                  <td>{p.merk || '-'}</td>
                  <td>{p.fungsi_ai || '-'}</td>
                  <td>{p.jumlah_kamera || 1}</td>
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
                  min="1"
                  step="1"
                  className="form-control"
                  value={nomorUrut}
                  onChange={(e) => setNomorUrut(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Penempatan / Objek Pantau</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: LPN - Sandal Mushola"
                  value={namaTitik}
                  onChange={(e) => setNamaTitik(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
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

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Jenis Kamera</label>
                  <select
                    className="form-control"
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                  >
                    <option value="">Pilih Jenis</option>
                    {CCTV_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
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

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Jumlah Kamera dalam Kelompok</label>
                  <input type="number" className="form-control" min="1" step="1" required value={jumlahKamera}
                    onChange={(e) => setJumlahKamera(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Pemilik/Pengelola</label>
                  <input className="form-control" maxLength={100} value={unitPengelola}
                    onChange={(e) => setUnitPengelola(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kategori CCTV</label>
                  <input className="form-control" maxLength={100} value={kategori} onChange={(e) => setKategori(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fungsi AI</label>
                  <input className="form-control" maxLength={255} value={fungsiAi} onChange={(e) => setFungsiAi(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Keterangan</label>
                <textarea className="form-control" rows={3} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
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

      {showImportModal && (
        <InventoryImportModal onClose={() => setShowImportModal(false)} onImported={() => { fetchStations(); fetchPoints(selectedStation); }} />
      )}
    </div>

  );
};

export default CCTVMasterPage;
