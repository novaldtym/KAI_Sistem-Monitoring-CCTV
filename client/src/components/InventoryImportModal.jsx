import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { importInventoryApi, previewInventoryImportApi } from '../services/api';
import './InventoryImportModal.css';

export default function InventoryImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    modalRef.current?.focus();
    return () => previousFocus?.focus();
  }, []);

  const resetPreview = () => {
    setPreview(null);
    setError('');
    setResult(null);
  };
  const formData = () => {
    const data = new FormData();
    data.append('file', file);
    if (preview) data.append('fingerprint', preview.fingerprint);
    return data;
  };
  const handlePreview = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setPreview(null);
    setResult(null);
    try {
      const response = await previewInventoryImportApi(formData());
      setPreview(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Pratinjau gagal dimuat. Periksa file dan koneksi server.');
    } finally {
      setBusy(false);
    }
  };
  const handleImport = async () => {
    if (!preview?.canImport) return;
    setBusy(true);
    setError('');
    try {
      const response = await importInventoryApi(formData());
      setResult(response.data.data);
      setPreview(null);
      toast.success(response.data.message);
      onImported();
    } catch (err) {
      setError(err.response?.data?.message || 'Impor gagal. Data belum disimpan.');
      if (err.response?.status === 409) setPreview(null);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = [...modalRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const outside = !modalRef.current.contains(document.activeElement);
      if (outside || document.activeElement === modalRef.current ||
          (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal inventory-import-modal" ref={modalRef} tabIndex={-1} role="dialog"
        aria-modal="true" aria-labelledby="inventory-import-title">
        <h2 id="inventory-import-title" className="modal-title">Impor Excel KAI — Stasiun dan CCTV</h2>
        <p className="inventory-import-note">
          Membaca sheet <strong>Form Pendataan CCTV</strong> dan mengambil lokasi Stasiun di Daop 6 Yogyakarta.
          Satu baris Excel menjadi satu kelompok pemeriksaan.
        </p>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="inventory-file">File Excel (.xlsx / .xls, maksimal 10 MB)</label>
            <input id="inventory-file" type="file" accept=".xlsx,.xls" className="form-control" disabled={busy}
              onChange={(event) => { resetPreview(); setFile(event.target.files[0] || null); }} />
          </div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handlePreview} disabled={!file || busy}>
          {busy ? 'Memproses...' : 'Buat Pratinjau'}
        </button>

        {error && <p className="inventory-import-error" role="alert">{error}</p>}
        {result && <p className="inventory-import-result" role="status">
          Impor selesai: {result.newStations} stasiun baru, {result.newGroups} kelompok baru, {result.updatedGroups} kelompok diperbarui,
          dan {result.unchangedGroups} kelompok tetap. File memuat {result.cameraCount} kamera.
        </p>}
        {preview && (
          <div aria-live="polite">
            {preview.errors.length > 0 && (
              <div className="inventory-import-error" role="alert">
                <strong>{preview.errors.length} kesalahan. Perbaiki file atau data master, lalu buat pratinjau ulang.</strong>
                <ul>{preview.errors.slice(0, 50).map((item, index) => <li key={index}>Baris {item.row}: {item.message}</li>)}</ul>
                {preview.errors.length > 50 && <p>Menampilkan 50 kesalahan pertama.</p>}
              </div>
            )}
            <h3 className="inventory-import-heading">Contoh data yang akan diimpor (5 baris pertama)</h3>
            <div className="table-container inventory-import-table" tabIndex={0} aria-label="Contoh 5 baris pertama data yang akan diimpor">
              <table className="data-table">
                <thead><tr><th>No.</th><th>Stasiun</th><th>Kode Stasiun</th><th>Penempatan / Objek Pantau</th><th>Unit</th><th>Kategori</th><th>Jenis CCTV</th><th>Merek</th><th>Fungsi AI</th><th>Jumlah Kamera</th></tr></thead>
                <tbody>{preview.sampleRows.slice(0, 5).map((row, index) => (
                  <tr key={row.source_row}><td>{index + 1}</td><td>{row.nama_stasiun}</td>
                    <td>{row.kode_stasiun || preview.stations.find((station) => station.nama_stasiun === row.nama_stasiun)?.kode_stasiun || '-'}</td>
                    <td>{row.nama_titik}</td>
                    <td>{row.unit_pengelola}</td><td>{row.kategori}</td><td>{row.jenis}</td><td>{row.merk || '-'}</td>
                    <td>{row.fungsi_ai || '-'}</td><td>{row.jumlah_kamera}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>{result ? 'Tutup' : 'Batal'}</button>
          {preview && <button type="button" className="btn btn-primary" onClick={handleImport} disabled={busy || !preview.canImport}>
            {busy ? 'Menyimpan...' : 'Simpan Hasil Impor'}
          </button>}
        </div>
      </div>
    </div>
  );
}
