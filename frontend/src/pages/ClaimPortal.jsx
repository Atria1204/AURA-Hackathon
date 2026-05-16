import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/* ─── Swipe animation styles injected once ─────────────────────────── */
const ANIM_CSS = `
@keyframes slideOutLeft {
  from { transform: translate3d(0, 0, 0); opacity: 1; }
  to   { transform: translate3d(-30px, 0, 0); opacity: 0; }
}
@keyframes slideInRight {
  from { transform: translate3d(30px, 0, 0); opacity: 0; }
  to   { transform: translate3d(0, 0, 0); opacity: 1; }
}
@keyframes fadeInUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
.slide-out { animation: slideOutLeft 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.slide-in  { animation: slideInRight 0.2s cubic-bezier(0.0, 0, 0.2, 1) forwards; }
.fade-up   { animation: fadeInUp 0.5s ease forwards; }

/* ── Responsive overrides ── */
.portal-root {
  font-family: 'Inter', sans-serif;
  height: 100vh; width: 100vw; overflow: hidden;
  display: flex; flex-direction: row; margin: 0; padding: 0;
}
.portal-left {
  display: flex; width: 45%; height: 100%;
  background-color: #f9fbfb; flex-direction: column;
  justify-content: center; padding: 3rem 3.5rem; overflow-y: auto;
}
.portal-right {
  width: 55%; height: 100%; background-color: #1a4742;
  overflow-y: auto; display: flex; align-items: center;
  justify-content: center; padding: 2rem;
}
.portal-stepper {
  display: flex; align-items: center; justify-content: center;
  gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;
}
.mobile-header { display: none; }

@media (max-width: 768px) {
  .portal-root { flex-direction: column; }
  .portal-left { display: none; }
  .portal-right {
    width: 100%; height: 100%; padding: 1rem 1rem 2rem;
    align-items: flex-start;
  }
  .mobile-header {
    display: flex; align-items: center; gap: 0.75rem;
    margin-bottom: 1.25rem; padding: 0.5rem 0;
  }
  .portal-stepper { gap: 0.5rem; margin-bottom: 1rem; }
  .portal-stepper .step-label { display: none; }
  .portal-stepper .step-line { width: 20px; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .portal-left { width: 40%; padding: 2rem; }
  .portal-right { width: 60%; padding: 1.5rem; }
}
`;

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '12px',
  fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#111827', boxSizing: 'border-box',
  transition: 'all 0.2s', fontFamily: 'inherit',
};

/* ─── Drop zone sub-component ───────────────────────────────────────── */
const DropZone = ({ isDragging, onDragOver, onDragLeave, onDrop, inputRef, onChange, accept, isVideo }) => (
  <div
    className={`w-full border-2 border-dashed rounded-xl flex justify-center px-6 pt-5 pb-6 transition-all cursor-pointer relative ${isDragging ? 'border-[#1a4742] bg-[#1a4742]/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
  >
    <input type="file" ref={inputRef} onChange={onChange} accept={accept}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
    <div className="flex flex-col items-center gap-1 text-center pointer-events-none">
      <svg className="h-6 w-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isVideo
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        }
      </svg>
      <p className="text-sm font-medium text-[#1a4742]">{isVideo ? 'Drag-and-drop video' : 'Drag-and-drop zone'}</p>
    </div>
  </div>
);

/* ─── File preview sub-component ────────────────────────────────────── */
const FilePreview = ({ preview, fileName, label, isVideo, onRemove }) => (
  <div className="border border-gray-200 rounded-xl p-3 flex items-center justify-between bg-white shadow-sm">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
        {isVideo
          ? <svg className="w-6 h-6 text-[#1a4742]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          : <img src={preview} alt="preview" className="w-full h-full object-cover" />
        }
      </div>
      <div className="truncate">
        <p className="text-sm font-semibold text-gray-900 truncate">{fileName}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
    <button type="button" onClick={onRemove}
      className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════ */
const ClaimPortal = () => {
  const [resi, setResi] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  /* 'idle' | 'exiting' | 'entered' | 'exiting2' | 'success' | 'exiting3' | 'details' */
  const [stepState, setStepState] = useState('idle');
  const [claimId, setClaimId] = useState('');
  const [orderData, setOrderData] = useState(null);

  const [complaint, setComplaint] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoFileName, setPhotoFileName] = useState('');
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  const [videoFile, setVideoFile] = useState(null);
  const [videoBase64, setVideoBase64] = useState(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const isVerified = stepState === 'entered' || stepState === 'exiting2' || stepState === 'success';
  const isCompleted = stepState === 'success';
  const isFormValid = resi.trim() !== '' && phone.trim().length === 4 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ── Verify with swipe animation ── */
  const handleVerify = async () => {
    if (!isFormValid) return;
    setIsLoading(true); setAlertInfo(null);
    try {
      const response = await fetch('http://127.0.0.1:8080/api/verify_order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nomor_resi: resi }),
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setOrderData(result.data);
        setStepState('exiting');
        setTimeout(() => setStepState('entered'), 150);
      } else {
        setAlertInfo({ type: 'error', message: result.message || 'Verifikasi gagal.' });
      }
    } catch (error) {
      setAlertInfo({ type: 'error', message: 'Gagal terhubung ke server.' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── File helpers ── */
  const processPhoto = (file) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setAlertInfo({ type: 'error', message: 'Ukuran foto maksimal 1MB (Limit Firestore).' }); return;
    }
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      setAlertInfo({ type: 'error', message: 'Hanya JPG atau PNG.' }); return;
    }
    setPhotoFileName(file.name); setIsPhotoLoading(true);
    const r = new FileReader();
    r.onloadend = () => { setPhotoBase64(r.result); setAlertInfo(null); setIsPhotoLoading(false); };
    r.onerror = () => { setAlertInfo({ type: 'error', message: 'Gagal membaca foto.' }); setIsPhotoLoading(false); };
    r.readAsDataURL(file);
  };
  const processVideo = (file) => {
    if (!file) return;
    const MAX_VIDEO_MB = 10;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setAlertInfo({ type: 'error', message: `Ukuran video maksimal ${MAX_VIDEO_MB}MB.` }); return;
    }
    if (!file.type.match('video/mp4') && !file.type.match('video/webm') && !file.type.match('video/quicktime')) {
      setAlertInfo({ type: 'error', message: 'Format video harus MP4, WebM, atau MOV.' }); return;
    }
    setVideoFile(file);
    setVideoFileName(file.name);
    setVideoBase64('placeholder');
    setAlertInfo(null);
    setVideoUploadProgress(0);
  };

  const handlePhotoDragOver = useCallback((e) => { e.preventDefault(); setIsPhotoDragging(true); }, []);
  const handlePhotoDragLeave = useCallback((e) => { e.preventDefault(); setIsPhotoDragging(false); }, []);
  const handlePhotoDrop = useCallback((e) => { e.preventDefault(); setIsPhotoDragging(false); if (e.dataTransfer.files?.[0]) processPhoto(e.dataTransfer.files[0]); }, []);
  const handlePhotoChange = (e) => { if (e.target.files?.[0]) processPhoto(e.target.files[0]); };
  const removePhoto = () => { setPhotoBase64(null); setPhotoFileName(''); if (photoInputRef.current) photoInputRef.current.value = ''; };

  const handleVideoDragOver = useCallback((e) => { e.preventDefault(); setIsVideoDragging(true); }, []);
  const handleVideoDragLeave = useCallback((e) => { e.preventDefault(); setIsVideoDragging(false); }, []);
  const handleVideoDrop = useCallback((e) => { e.preventDefault(); setIsVideoDragging(false); if (e.dataTransfer.files?.[0]) processVideo(e.dataTransfer.files[0]); }, []);
  const handleVideoChange = (e) => { if (e.target.files?.[0]) processVideo(e.target.files[0]); };
  const removeVideo = () => { setVideoFile(null); setVideoBase64(null); setVideoFileName(''); setVideoUploadProgress(0); if (videoInputRef.current) videoInputRef.current.value = ''; };

  /* ── Reset ── */
  const resetAll = () => {
    setComplaint(''); removePhoto(); removeVideo();
    setStepState('idle'); setResi(''); setPhone(''); setEmail('');
    setClaimId(''); setAlertInfo(null); setOrderData(null);
    setVideoUploadProgress(0);
  };

  /* ── Upload video ke Supabase Storage ── */
  const uploadVideoToSupabase = async (file, claimIdPrefix) => {
    const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'claim-videos';
    const ext = file.name.split('.').pop();
    const filePath = `${claimIdPrefix}_${Date.now()}.${ext}`;

    setVideoUploadProgress(10);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(`Gagal upload video: ${error.message}`);
    }

    // Ambil public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    setVideoUploadProgress(100);
    return urlData?.publicUrl || '';
  };

  /* ── Submit ── */
  const handleSubmitClaim = async () => {
    if (!complaint || !photoBase64) {
      setAlertInfo({ type: 'error', message: 'Lengkapi keluhan dan foto bukti.' }); return;
    }
    setIsLoading(true); setAlertInfo(null);

    try {
      let videoUrl = '';
      if (videoFile) {
        setAlertInfo({ type: 'info', message: 'Mengupload video ke storage...' });
        const tempId = `CLM-${resi}-${Date.now()}`;
        videoUrl = await uploadVideoToSupabase(videoFile, tempId);
        setAlertInfo(null);
      }

      const payload = {
        nomor_resi: resi,
        teks_keluhan: complaint,
        foto_base64: photoBase64,
        video_url: videoUrl,
        email_pelanggan: email,
      };

      const response = await fetch('http://127.0.0.1:8080/api/submit_claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.status === 429) {
        setAlertInfo({ type: 'error', message: 'Rate limit (429). Coba lagi.' });
      } else if (response.ok && result.status === 'success') {
        const newClaimId = result.data.claim_id;
        setClaimId(newClaimId);

        fetch('http://127.0.0.1:8080/api/analyze_claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claim_id: newClaimId, foto_base64: photoBase64 })
        }).catch(() => {});

        fetch('http://127.0.0.1:8080/api/send_confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_email: email,
            claim_id: newClaimId,
            status: 'SUBMITTED',
            produk: orderData?.produk || 'Produk',
          })
        }).catch(() => {});

        setStepState('exiting2');
        setTimeout(() => setStepState('success'), 150);
      } else {
        setAlertInfo({ type: 'error', message: result.message || `Error ${response.status}` });
      }
    } catch (error) {
      setAlertInfo({ type: 'error', message: error.message || 'Gagal mengirim klaim.' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="portal-root">
      <style>{ANIM_CSS}</style>

      {/* ══ LEFT — Welcome Panel ════════════════════════════════════ */}
      <section className="portal-left">
        <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
          {/* Illustration */}
          <div style={{ marginBottom: '1.5rem' }}>
            <img
              alt="A.U.R.A Portal Illustration"
              style={{
                width: '100%', maxWidth: '520px', height: 'auto', objectFit: 'contain',
                margin: '0 auto', display: 'block',
              }}
              src="/4b48f9d5-42e7-47fb-9321-1fc86925071a_removalai_preview.png"
            />
          </div>
          {/* Text — centered */}
          <h1 style={{ fontSize: '2.4rem', fontWeight: 700, color: '#111827', lineHeight: 1.15, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Selamat Datang<br />di Portal A.U.R.A
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.6, maxWidth: '340px', margin: '0 auto 1.25rem' }}>
            Proses cepat kurang dari 10 menit. Sistem AI kami akan menganalisis klaim Anda secara otomatis.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '13px', color: '#1a4742', fontWeight: 500 }}>
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Aman &amp; Terenkripsi
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '13px', color: '#1a4742', fontWeight: 500 }}>
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Respon Cepat
            </div>
          </div>
        </div>
      </section>

      {/* ══ RIGHT — Form Panel ══════════════════════════════════════ */}
      <main className="portal-right">
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {/* Mobile header - only visible on small screens */}
          <div className="mobile-header">
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '20px', height: '20px', color: '#fff' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>A.U.R.A</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Claim Portal</p>
            </div>
          </div>

          {/* ── Horizontal Stepper ── */}
          <div className="portal-stepper">
            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: stepState === 'details' ? 0.4 : 1 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: stepState === 'details' ? 'transparent' : '#fff', border: stepState === 'details' ? '2px solid rgba(255,255,255,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isVerified
                  ? <svg style={{ width: '18px', height: '18px', color: '#1a4742' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  </svg>
                  : <span style={{ fontSize: '14px', fontWeight: 600, color: stepState === 'details' ? 'rgba(255,255,255,0.6)' : '#1a4742' }}>1</span>
                }
              </div>
              <div className="step-label">
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Step 1</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Verifikasi</p>
              </div>
            </div>

            <div className="step-line" style={{ width: '40px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />

            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isVerified ? 1 : 0.4 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isVerified ? '#fff' : 'transparent', border: isVerified ? 'none' : '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isCompleted
                  ? <svg style={{ width: '18px', height: '18px', color: '#1a4742' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                  : <span style={{ fontSize: '14px', fontWeight: 600, color: isVerified ? '#1a4742' : 'rgba(255,255,255,0.6)' }}>2</span>
                }
              </div>
              <div className="step-label">
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Step 2</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Detail Klaim</p>
              </div>
            </div>

            <div className="step-line" style={{ width: '40px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />

            {/* Step 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isCompleted ? 1 : 0.4 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isCompleted ? '#fff' : 'transparent', border: isCompleted ? 'none' : '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isCompleted
                  ? <svg style={{ width: '18px', height: '18px', color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                  : <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>3</span>
                }
              </div>
              <div className="step-label">
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Step 3</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Selesai</p>
              </div>
            </div>
          </div>

          {/* ── Card area — one card visible at a time ── */}
          <div>

            {/* ─ Step 1 Card ─ */}
            {(stepState === 'idle' || stepState === 'exiting') && (
              <div className={stepState === 'exiting' ? 'slide-out' : ''} style={{ backgroundColor: '#fff', padding: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>Verifikasi Pesanan</h2>

                {/* Error alert for Step 1 */}
                {alertInfo?.type === 'error' && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '14px' }}>
                    <svg style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {alertInfo.message}
                  </div>
                )}

                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }} htmlFor="nomorResi">
                      Nomor Resi / Pesanan
                    </label>
                    <input
                      id="nomorResi" type="text" placeholder="Contoh: TKP-2026-001"
                      value={resi} onChange={(e) => setResi(e.target.value.toUpperCase())}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }} htmlFor="emailPelanggan">
                      Email Penerima Konfirmasi
                    </label>
                    <input
                      id="emailPelanggan" type="email" placeholder="contoh@email.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }} htmlFor="digitHp">
                      4 Digit Terakhir Nomor HP
                    </label>
                    <input
                      id="digitHp" type="text" maxLength="4" placeholder="Contoh: 1234"
                      value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      style={inputStyle}
                    />
                  </div>
                  <button
                    type="button" onClick={handleVerify} disabled={!isFormValid || isLoading}
                    style={{
                      width: '100%', fontWeight: 600, padding: '0.75rem 1rem', borderRadius: '12px',
                      transition: 'all 0.2s', border: 'none', cursor: isFormValid && !isLoading ? 'pointer' : 'not-allowed', fontSize: '14px',
                      backgroundColor: isFormValid && !isLoading ? '#1a4742' : '#f3f4f6',
                      color: isFormValid && !isLoading ? '#fff' : '#9ca3af',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                    }}
                  >
                    {isLoading ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>sync</span>Memverifikasi...</> : 'Verifikasi Pesanan'}
                  </button>
                </form>
              </div>
            )}

            {/* ─ Step 2 Card ─ */}
            {(stepState === 'entered' || stepState === 'exiting2') && (
              <div className={stepState === 'exiting2' ? 'slide-out' : 'slide-in'} style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', padding: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '16px' }}>
                {/* Order summary header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '48px', height: '48px', backgroundColor: '#f3f4f6', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                    {orderData?.foto_katalog_url ? (
                      <img
                        alt={orderData?.produk || "Product"}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        src={orderData.foto_katalog_url}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined text-gray-400">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{orderData?.produk || 'Produk Tidak Dikenali'}</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Pesanan: {resi}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStepState('idle')}
                    style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali
                  </button>
                </div>

                {/* Error alert */}
                {alertInfo?.type === 'error' && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '14px' }}>
                    <svg style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {alertInfo.message}
                  </div>
                )}

                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }} htmlFor="deskripsiMasalah">
                      Deskripsi Masalah
                    </label>
                    <textarea
                      id="deskripsiMasalah" rows="3" placeholder="Jelaskan masalah yang Anda alami..."
                      value={complaint} onChange={(e) => setComplaint(e.target.value)}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>Unggah Bukti</label>
                    {isPhotoLoading
                      ? <div style={{ height: '90px', border: '2px dashed rgba(26,71,66,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                        <span className="material-symbols-outlined animate-spin" style={{ color: '#1a4742' }}>sync</span>
                      </div>
                      : !photoBase64
                        ? <DropZone isDragging={isPhotoDragging} onDragOver={handlePhotoDragOver} onDragLeave={handlePhotoDragLeave} onDrop={handlePhotoDrop} inputRef={photoInputRef} onChange={handlePhotoChange} accept="image/jpeg,image/png" isVideo={false} />
                        : <FilePreview preview={photoBase64} fileName={photoFileName} label="Foto siap dikirim" isVideo={false} onRemove={removePhoto} />
                    }
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>Unggah Video Unboxing</label>
                      <span style={{ fontSize: '12px', color: '#1a4742', fontWeight: 500, fontStyle: 'italic' }}>Membantu mempercepat analisis AI</span>
                    </div>
                    {isVideoLoading
                      ? <div style={{ height: '90px', border: '2px dashed rgba(26,71,66,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                        <span className="material-symbols-outlined animate-spin" style={{ color: '#1a4742' }}>sync</span>
                      </div>
                      : !videoBase64
                        ? <DropZone isDragging={isVideoDragging} onDragOver={handleVideoDragOver} onDragLeave={handleVideoDragLeave} onDrop={handleVideoDrop} inputRef={videoInputRef} onChange={handleVideoChange} accept="video/mp4,video/webm,video/quicktime" isVideo={true} />
                        : <>
                            <FilePreview preview={null} fileName={videoFileName} label={`Video siap diupload ke Supabase (${(videoFile?.size / (1024*1024)).toFixed(1)} MB)`} isVideo={true} onRemove={removeVideo} />
                            {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                              <div style={{ marginTop: '0.5rem', backgroundColor: '#e5e7eb', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${videoUploadProgress}%`, backgroundColor: '#1a4742', transition: 'width 0.3s ease' }} />
                              </div>
                            )}
                          </>
                    }
                  </div>

                  <button
                    type="button" onClick={handleSubmitClaim} disabled={isLoading}
                    style={{
                      width: '100%', backgroundColor: '#1a4742', color: '#fff', fontWeight: 600,
                      padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                      opacity: isLoading ? 0.5 : 1, transition: 'all 0.2s',
                    }}
                  >
                    {isLoading
                      ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>sync</span>Memproses...</>
                      : 'Kirim Klaim ke A.U.R.A'
                    }
                  </button>
                </form>
              </div>
            )}

            {/* ─ Step 3 Card — Success ─ */}
            {(stepState === 'success' || stepState === 'exiting3') && (
              <div className={stepState === 'exiting3' ? 'slide-out' : 'slide-in'} style={{ backgroundColor: '#fff', padding: '2.5rem 2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '16px', textAlign: 'center' }}>
                {/* Success Icon */}
                <div style={{ position: 'relative', margin: '0 auto 1.5rem', width: '80px', height: '80px' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,150,105,0.08)', borderRadius: '50%', transform: 'scale(1.5)', filter: 'blur(12px)' }} />
                  <div style={{ position: 'relative', width: '80px', height: '80px', backgroundColor: 'rgba(5,150,105,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '44px', height: '44px', color: '#059669' }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Claim ID Badge */}
                <div style={{ display: 'inline-block', marginBottom: '0.75rem', padding: '0.4rem 1rem', backgroundColor: '#f3f4f6', borderRadius: '999px', fontSize: '13px', fontWeight: 500, color: '#374151', border: '1px solid #e5e7eb' }}>
                  Claim ID: <span style={{ fontWeight: 700, color: '#1a4742' }}>{claimId}</span>
                </div>

                {/* Heading */}
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
                  Laporan Berhasil Terkirim
                </h2>

                {/* Description */}
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                  Terima kasih telah memberikan informasi detail. Tim A.U.R.A sedang menganalisis klaim Anda. Anda akan menerima notifikasi status dalam waktu kurang dari 10 menit.
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={resetAll}
                    style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: '#1a4742', color: '#fff', fontWeight: 600, fontSize: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(26,71,66,0.3)' }}
                  >
                    Kembali ke Beranda
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStepState('exiting3');
                      setTimeout(() => setStepState('details'), 150);
                    }}
                    style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: 'transparent', color: '#6b7280', fontWeight: 500, fontSize: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Lihat Rincian Klaim
                  </button>
                </div>

                {/* Support link */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                    Membutuhkan bantuan lebih lanjut?{' '}
                    <a href="#" style={{ color: '#1a4742', fontWeight: 500, textDecoration: 'none' }}>Hubungi Support</a>
                  </p>
                </div>
              </div>
            )}

            {/* ─ Step 4 Card — Details ─ */}
            {(stepState === 'details') && (
              <div className="slide-in" style={{ backgroundColor: '#fff', padding: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Rincian Klaim</h2>
                  <div style={{ padding: '0.4rem 0.8rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '999px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                    Sedang Dianalisis
                  </div>
                </div>

                {/* Order summary small */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                    {orderData?.foto_katalog_url ? (
                      <img
                        alt={orderData?.produk || "Product"}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        src={orderData.foto_katalog_url}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{orderData?.produk || 'Produk'}</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{resi} • ID: {claimId}</p>
                  </div>
                </div>

                {/* Info List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Deskripsi Masalah</p>
                    <p style={{ fontSize: '14px', color: '#1f2937', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f3f4f6', lineHeight: 1.5 }}>
                      {complaint}
                    </p>
                  </div>

                  {(photoBase64 || videoBase64) && (
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>Bukti Terlampir</p>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {photoBase64 && (
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <img src={photoBase64} alt="Bukti Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        {videoBase64 && (
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                            <span className="material-symbols-outlined" style={{ color: '#fff' }}>play_arrow</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setStepState('success')}
                  style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 600, fontSize: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                  Kembali ke Status
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default ClaimPortal;
