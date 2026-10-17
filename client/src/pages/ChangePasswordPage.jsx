import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { changePasswordApi } from '../services/api';
import './UserManagement.css';

export default function ChangePasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (event) => {
    event.preventDefault();
    setError('');
    if (values.new_password !== values.confirm_password) { setError('Konfirmasi password baru tidak sama.'); return; }
    setBusy(true);
    try {
      const response = await changePasswordApi(values);
      logout();
      toast.success(response.data.message);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Password belum berhasil diganti. Coba kembali.');
    } finally { setBusy(false); }
  };

  return <div className="user-management-page">
    <div className="page-header">
      <h1 className="page-title">Ganti Password</h1>
      <p className="page-subtitle">Ubah password akun yang sedang kamu gunakan.</p>
    </div>
    <form className="card password-form" onSubmit={save}>
      <p className="account-note">Password baru minimal 8 karakter. Setelah berhasil, semua sesi akun ini akan keluar dan kamu perlu login kembali.</p>
      {error && <p className="account-error" role="alert">{error}</p>}
      {[
        ['current_password', 'Password saat ini'], ['new_password', 'Password baru'], ['confirm_password', 'Konfirmasi password baru'],
      ].map(([name, label]) => <div className="form-group" key={name}>
        <label className="form-label" htmlFor={name}>{label}</label>
        <input id={name} className="form-control" type="password" required disabled={busy}
          autoComplete={name === 'current_password' ? 'current-password' : 'new-password'}
          minLength={name === 'current_password' ? undefined : 8} maxLength={72}
          value={values[name]} onChange={(event) => setValues((previous) => ({ ...previous, [name]: event.target.value }))} />
      </div>)}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan Password Baru'}</button>
    </form>
  </div>;
}
