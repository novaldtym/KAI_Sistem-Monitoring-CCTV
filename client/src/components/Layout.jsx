import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { FiMenu } from 'react-icons/fi';

const Layout = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 960px)').matches);
  const [openedAt, setOpenedAt] = useState(null);
  const menuButton = useRef(null);
  const navigation = useRef(null);
  const closeMenu = useCallback(() => setOpenedAt(null), []);
  const menuOpen = isMobile && openedAt === location.key;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 960px)');
    const resize = (event) => { setIsMobile(event.matches); if (!event.matches) closeMenu(); };
    media.addEventListener('change', resize);
    window.addEventListener('popstate', closeMenu);
    return () => { media.removeEventListener('change', resize); window.removeEventListener('popstate', closeMenu); };
  }, [closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocus = menuButton.current;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...navigation.current.querySelectorAll('a[href], button:not(:disabled)')];
    const focusFrame = window.requestAnimationFrame(() => focusable()[0]?.focus());
    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!navigation.current.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKey);
      if (window.matchMedia('(max-width: 960px)').matches) returnFocus?.focus();
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">Langsung ke konten</a>
      <header className="mobile-header" inert={menuOpen ? true : undefined}>
        <div className="mobile-brand"><img src="/logo-kai.webp" alt="KAI" /><span>Monitoring CCTV</span></div>
        <button type="button" ref={menuButton} className="mobile-menu-button" aria-label="Buka menu navigasi"
          aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setOpenedAt(location.key)}><FiMenu aria-hidden="true" /> Menu</button>
      </header>
      {menuOpen && <button type="button" className="sidebar-backdrop" tabIndex={-1} aria-label="Tutup menu navigasi" onClick={closeMenu} />}
      <Sidebar isMobile={isMobile} isOpen={menuOpen} navigationRef={navigation} onNavigate={closeMenu} onClose={closeMenu} />
      <main id="main-content" className="main-content" tabIndex={-1} inert={menuOpen ? true : undefined}>
        <Outlet />
      </main>
      <Toaster
        position="top-right"
        containerStyle={{ top: 'max(16px, env(safe-area-inset-top))', right: 16, left: 16 }}
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.1)',
            fontWeight: 500,
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
};

export default Layout;
