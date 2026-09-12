import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiUser } from 'react-icons/fi';

const LoginPage = () => {
  const [nipp, setNipp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(nipp, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal login. Periksa NIPP dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="login-logo">
          <img src="/logo-kai.webp" alt="PT Kereta Api Indonesia" className="login-logo-img" />
          <div className="login-logo-badge">SISTEM INFORMASI</div>
        </div>

        <h1 className="login-title">Monitoring CCTV</h1>
        <p className="login-subtitle">Masuk untuk mengakses sistem monitoring digital</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">NIPP (Nomor Induk Pegawai)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Masukkan NIPP (contoh: 30566)"
                value={nipp}
                onChange={(e) => setNipp(e.target.value)}
                required
              />
              <FiUser style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FiLock style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
