import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUsersApi, createUserApi, updateUserApi, deleteUserApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../constants/roles';
import './UserManagement.css';

function UserEditor({ target, currentUser, onSaved, onCancel }) {
  const [values, setValues] = useState({ nipp: target?.nipp || '', nama: target?.nama || '', email: target?.email || '',
    jabatan: target?.jabatan || '', role: target?.role || 'petugas', is_active: target?.is_active ?? true, password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const firstInput = useRef(null);
  const ownAccount = target?.id === currentUser.id;
  useEffect(() => { firstInput.current?.focus(); }, []);
  const setField = (name, value) => setValues((previous) => ({ ...previous, [name]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = target ? await updateUserApi(target.id, values) : await createUserApi(values);
      const relogin = ownAccount && (values.nipp !== target.nipp || Boolean(values.password));
      await onSaved(response.data.message, relogin, ownAccount);
    } catch (err) { setError(err.response?.data?.message || 'User belum berhasil disimpan. Coba kembali.'); }
    finally { setBusy(false); }
  };

  return <form className="card user-editor" onSubmit={save} aria-labelledby="user-editor-title">
    <h2 id="user-editor-title" className="section-title">{target ? 'Edit User' : 'Tambah User'}</h2>
    {error && <p role="alert" className="account-error">{error}</p>}
    <div className="form-row">
      <div className="form-group">
        <label className="form-label" htmlFor="user-nipp">Username / NIPP / NIPKWT</label>
        <input ref={firstInput} id="user-nipp" className="form-control" required minLength={3} maxLength={20} autoComplete="off"
          pattern="[a-zA-Z0-9._\-]{3,20}" disabled={busy} value={values.nipp} onChange={(event) => setField('nipp', event.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="user-name">Nama</label>
        <input id="user-name" className="form-control" required maxLength={100} disabled={busy} value={values.nama} onChange={(event) => setField('nama', event.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="user-role">Role</label>
        <select id="user-role" className="form-control" disabled={busy || ownAccount} value={values.role} onChange={(event) => setField('role', event.target.value)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="user-job">Jabatan (opsional)</label>
        <input id="user-job" className="form-control" maxLength={100} disabled={busy} value={values.jabatan} onChange={(event) => setField('jabatan', event.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="user-email">Email (opsional)</label>
        <input id="user-email" className="form-control" type="email" maxLength={100} disabled={busy} value={values.email} onChange={(event) => setField('email', event.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="user-password">{target ? 'Password baru (opsional)' : 'Password awal (opsional)'}</label>
        <input id="user-password" className="form-control" type="password" autoComplete="new-password" minLength={8} maxLength={72}
          disabled={busy} value={values.password} onChange={(event) => setField('password', event.target.value)} aria-describedby="user-password-help" />
        <p id="user-password-help" className="account-note">{target ? 'Kosongkan untuk mempertahankan password saat ini.' : 'Jika kosong, password awal sama dengan username/NIPP.'}</p>
      </div>
    </div>
    <label className="user-active-label"><input type="checkbox" checked={values.is_active} disabled={busy || ownAccount} onChange={(event) => setField('is_active', event.target.checked)} /> Akun aktif</label>
    {ownAccount && <p className="account-note">Role dan status akun Admin sendiri tidak dapat diubah.</p>}
    <div className="account-actions">
      <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={busy}>Batal</button>
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan User'}</button>
    </div>
  </form>;
}

export default function UserMasterPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const addButton = useRef(null);

  useEffect(() => {
    let active = true;
    getUsersApi().then((response) => { if (active) setUsers(response.data.data); })
      .catch(() => { if (active) setError('Daftar user gagal dimuat. Klik Coba Lagi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try { const response = await getUsersApi(); setUsers(response.data.data); }
    catch { setError('Daftar user gagal dimuat. Klik Coba Lagi.'); }
    finally { setLoading(false); }
  };
  const closeEditor = () => { setEditingUser(undefined); requestAnimationFrame(() => addButton.current?.focus()); };
  const onSaved = async (message, relogin, ownAccount) => {
    toast.success(message);
    if (relogin) { logout(); navigate('/login', { replace: true }); return; }
    if (ownAccount) await refreshUser();
    closeEditor();
    await loadUsers();
  };
  const remove = async (target) => {
    if (!window.confirm(`Hapus akun ${target.nama} (${target.nipp}) secara permanen?`)) return;
    setDeleting(target.id);
    try { const response = await deleteUserApi(target.id); toast.success(response.data.message); await loadUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'User gagal dihapus. Coba kembali.'); }
    finally { setDeleting(null); }
  };
  const filtered = users.filter((item) => `${item.nipp} ${item.nama} ${ROLE_LABELS[item.role]} ${item.jabatan || ''}`.toLowerCase().includes(search.trim().toLowerCase()));

  return <div className="user-management-page">
    <div className="toolbar">
      <div><h1 className="page-title">Kelola User</h1><p className="page-subtitle">Atur akun, role, status aktif, dan password pengguna.</p></div>
      <button ref={addButton} className="btn btn-primary" disabled={editingUser !== undefined} onClick={() => setEditingUser(null)}>Tambah User</button>
    </div>
    {editingUser !== undefined && <UserEditor key={editingUser?.id || 'new'} target={editingUser} currentUser={user} onSaved={onSaved} onCancel={closeEditor} />}
    <div className="user-search form-group"><label className="form-label" htmlFor="user-search">Cari user</label>
      <input id="user-search" className="form-control" type="search" placeholder="Nama, nomor pegawai, atau role" value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    {loading ? <p role="status">Memuat daftar user...</p> : error ? <div role="alert" className="card"><p>{error}</p><button className="btn btn-secondary" onClick={loadUsers}>Coba Lagi</button></div> :
      <div className="table-container mobile-card-container"><table className="data-table mobile-cards"><thead><tr><th>No.</th><th>Username / NIPP / NIPKWT</th><th>Nama</th><th>Role</th><th>Jabatan</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>{filtered.length ? filtered.map((item, index) => <tr key={item.id}>
          <td data-label="No.">{index + 1}</td><td data-label="Username">{item.nipp}</td><td data-label="Nama">{item.nama}</td><td data-label="Role">{ROLE_LABELS[item.role]}</td><td data-label="Jabatan">{item.jabatan || '-'}</td><td data-label="Status">{item.is_active ? 'Aktif' : 'Nonaktif'}</td>
          <td data-label="Aksi"><div className="account-actions">
            <button className="btn btn-secondary" disabled={editingUser !== undefined || deleting !== null} onClick={() => setEditingUser(item)} aria-label={`Edit ${item.nama}`}>Edit</button>
            <button className="btn btn-danger" disabled={item.id === user.id || deleting !== null || editingUser !== undefined} onClick={() => remove(item)} title={item.id === user.id ? 'Akun sendiri tidak dapat dihapus.' : undefined} aria-label={`Hapus ${item.nama}`}>{deleting === item.id ? 'Menghapus...' : 'Hapus'}</button>
          </div></td>
        </tr>) : <tr><td colSpan={7}>{search ? 'Tidak ada user yang cocok. Ubah kata pencarian.' : 'Belum ada user. Gunakan Tambah User untuk membuat akun.'}</td></tr>}</tbody>
      </table></div>}
  </div>;
}
