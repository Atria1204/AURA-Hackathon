import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Hard-coded credentials (demo only) ── */
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'aura2026';

/* ── WhatsApp-style doodle motif for background ── */
const BG_DOODLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-linecap='round' stroke-linejoin='round' opacity='0.12'%3E%3C!-- box --%3E%3Crect x='12' y='12' width='16' height='14' rx='2'/%3E%3Cline x1='12' y1='18' x2='28' y2='18'/%3E%3C!-- shield --%3E%3Cpath d='M70 10 L70 20 Q70 28 80 32 Q90 28 90 20 L90 10 Z'/%3E%3Cpath d='M76 19 L79 22 L85 16'/%3E%3C!-- checkmark circle --%3E%3Ccircle cx='150' cy='20' r='10'/%3E%3Cpath d='M145 20 L148 23 L155 16'/%3E%3C!-- star --%3E%3Cpath d='M30 70 L32 76 L38 76 L33 80 L35 86 L30 82 L25 86 L27 80 L22 76 L28 76 Z'/%3E%3C!-- clock --%3E%3Ccircle cx='90' cy='75' r='10'/%3E%3Cline x1='90' y1='75' x2='90' y2='69'/%3E%3Cline x1='90' y1='75' x2='95' y2='77'/%3E%3C!-- chat bubble --%3E%3Cpath d='M140 65 L165 65 Q168 65 168 68 L168 80 Q168 83 165 83 L152 83 L148 88 L148 83 L143 83 Q140 83 140 80 L140 68 Q140 65 143 65 Z'/%3E%3Cline x1='146' y1='72' x2='162' y2='72'/%3E%3Cline x1='146' y1='77' x2='157' y2='77'/%3E%3C!-- tag --%3E%3Cpath d='M20 135 L30 125 L40 125 L40 135 L30 145 Z'/%3E%3Ccircle cx='36' cy='129' r='2'/%3E%3C!-- document --%3E%3Crect x='80' y='125' width='14' height='18' rx='2'/%3E%3Cline x1='84' y1='131' x2='90' y2='131'/%3E%3Cline x1='84' y1='135' x2='90' y2='135'/%3E%3Cline x1='84' y1='139' x2='88' y2='139'/%3E%3C!-- return arrow --%3E%3Cpath d='M140 140 Q140 130 150 130 L155 130'/%3E%3Cpath d='M152 126 L156 130 L152 134'/%3E%3C!-- camera --%3E%3Crect x='15' y='170' width='18' height='13' rx='2'/%3E%3Ccircle cx='24' cy='177' r='4'/%3E%3Cpath d='M20 170 L22 166 L26 166 L28 170'/%3E%3C!-- lock --%3E%3Crect x='82' y='176' width='12' height='10' rx='2'/%3E%3Cpath d='M84 176 L84 172 Q84 168 88 168 Q92 168 92 172 L92 176'/%3E%3C!-- thumbs up --%3E%3Cpath d='M145 175 L150 170 L153 170 L153 182 L148 182'/%3E%3Crect x='140' y='175' width='5' height='8' rx='1'/%3E%3C/g%3E%3C/svg%3E")`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const isFormValid = username.trim() !== '' && password.trim() !== '';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError('');

    // Simulate a brief network call
    await new Promise((r) => setTimeout(r, 800));

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem('aura_admin_auth', 'true');
      navigate('/admin', { replace: true });
    } else {
      setError('Username atau password salah.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }

    setIsLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes loginFadeIn {
          from { transform: translateY(24px) scale(0.97); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%  { transform: translateX(-8px); }
          30%  { transform: translateX(8px); }
          45%  { transform: translateX(-6px); }
          60%  { transform: translateX(6px); }
          75%  { transform: translateX(-3px); }
          90%  { transform: translateX(3px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .login-card-enter {
          animation: loginFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-shake {
          animation: shake 0.5s ease;
        }
        .login-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.75rem;
          border: 1.5px solid #d1d5db;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          background-color: rgba(255,255,255,0.9);
          color: #111827;
          box-sizing: border-box;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          font-family: 'Inter', sans-serif;
        }
        .login-input:focus {
          border-color: #1a4742;
          box-shadow: 0 0 0 3px rgba(26,71,66,0.12);
          background-color: #fff;
        }
        .login-input::placeholder {
          color: #9ca3af;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a3636',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Static WhatsApp-style doodle motif overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: BG_DOODLE,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
            pointerEvents: 'none',
          }}
        />

        {/* Login Card */}
        <div
          className={`login-card-enter ${shake ? 'login-shake' : ''}`}
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '420px',
            margin: '0 1rem',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
            padding: '2.5rem 2rem',
          }}
        >
          {/* Logo / Brand */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 1rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1a3636 0%, #2d5252 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(26,54,54,0.3)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '28px' }}>
                shield_lock
              </span>
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.02em',
                margin: '0 0 0.35rem',
              }}
            >
              A.U.R.A Admin
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Masuk untuk mengakses Intelligence Dashboard
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
                error
              </span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username */}
            <div>
              <label
                htmlFor="admin-username"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#9ca3af',
                    pointerEvents: 'none',
                  }}
                >
                  person
                </span>
                <input
                  id="admin-username"
                  type="text"
                  className="login-input"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#9ca3af',
                    pointerEvents: 'none',
                  }}
                >
                  lock
                </span>
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isFormValid && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                background: isFormValid
                  ? 'linear-gradient(135deg, #1a3636 0%, #2d5252 100%)'
                  : '#e5e7eb',
                color: isFormValid ? '#fff' : '#9ca3af',
                boxShadow: isFormValid
                  ? '0 4px 14px rgba(26,54,54,0.35)'
                  : 'none',
                transform: isLoading ? 'scale(0.98)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (isFormValid && !isLoading) {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,54,54,0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (isFormValid && !isLoading) {
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,54,54,0.35)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}
                  >
                    sync
                  </span>
                  Memverifikasi...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    login
                  </span>
                  Masuk ke Dashboard
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
              Akses terbatas hanya untuk admin yang berwenang.
            </p>
          </div>
        </div>

        {/* Bottom attribution */}
        <div
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '12px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            encrypted
          </span>
          Secured by A.U.R.A Intelligence
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
