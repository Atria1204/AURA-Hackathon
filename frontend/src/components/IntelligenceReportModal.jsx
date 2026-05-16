import React, { useState, useEffect } from 'react';

const IntelligenceReportModal = ({ claim: initialClaim, onClose }) => {
  const [claim, setClaim] = useState(initialClaim);
  const [view, setView] = useState('detail');
  const [rejectReason, setRejectReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('50000');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setClaim(initialClaim);
  }, [initialClaim]);

  // Auto-analyze + polling: jika klaim masih Pending (score=0), trigger analisis
  // lalu poll backend tiap 3 detik hingga hasil analisis masuk
  useEffect(() => {
    if (initialClaim.score !== 0 || initialClaim.status_klaim !== 'PENDING_REVIEW') return;

    let pollInterval = null;
    let stopped = false;

    const triggerAndPoll = async () => {
      setIsAnalyzing(true);
      try {
        // Trigger analisis AI (backend akan proses di background)
        fetch('http://127.0.0.1:8080/api/analyze_claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claim_id: initialClaim.id })
        }).catch(() => {});

        // Poll /api/claims setiap 3 detik sampai score berubah dari 0
        pollInterval = setInterval(async () => {
          if (stopped) return;
          try {
            const res = await fetch('http://127.0.0.1:8080/api/claims');
            const data = await res.json();
            const updated = (data.data || []).find(c => c.id === initialClaim.id);
            if (updated && updated.score !== 0) {
              setClaim(updated);
              setIsAnalyzing(false);
              clearInterval(pollInterval);
            }
          } catch (_) {}
        }, 3000);

        // Timeout setelah 60 detik
        setTimeout(() => {
          if (!stopped) {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
          }
        }, 60000);

      } catch (e) {
        console.error('[A.U.R.A] Auto-analyze gagal:', e);
        setIsAnalyzing(false);
      }
    };

    triggerAndPoll();

    return () => {
      stopped = true;
      clearInterval(pollInterval);
    };
  }, [initialClaim.id, initialClaim.score, initialClaim.status_klaim]);


  const handleApproveClick = () => {
    setView('exiting');
    setTimeout(() => {
      setView('refund_prompt');
    }, 50);
  };

  const handleCancelRefund = () => {
    setView('exiting');
    setTimeout(() => {
      setView('detail');
    }, 50);
  };

  const handleConfirmRefund = async () => {
    setIsUpdating(true);
    try {
      await fetch('http://127.0.0.1:8080/api/update_claim_status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id, status_klaim: 'APPROVED', refund_amount: refundAmount })
      });

      // Kirim email konfirmasi APPROVED
      fetch('http://127.0.0.1:8080/api/send_confirmation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: claim.email || '',
          claim_id: claim.id,
          status: 'APPROVED',
          produk: claim.product || claim.produk || '',
        })
      }).catch(err => console.warn('[A.U.R.A] Email APPROVED gagal:', err));

      setView('exiting');
      setTimeout(() => {
        setView('success');
      }, 50);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectClick = () => {
    setView('exiting');
    setTimeout(() => {
      setView('reject_prompt');
    }, 50);
  };

  const handleCancelReject = () => {
    setView('exiting');
    setTimeout(() => {
      setView('detail');
    }, 50);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return;
    setIsUpdating(true);
    try {
      await fetch('http://127.0.0.1:8080/api/update_claim_status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id, status_klaim: 'REJECTED', reject_reason: rejectReason })
      });

      // Kirim email konfirmasi REJECTED
      fetch('http://127.0.0.1:8080/api/send_confirmation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: claim.email || '',
          claim_id: claim.id,
          status: 'REJECTED',
          produk: claim.product || claim.produk || '',
          reason: rejectReason,
        })
      }).catch(err => console.warn('[A.U.R.A] Email REJECTED gagal:', err));

      setView('exiting');
      setTimeout(() => {
        setView('rejected');
      }, 50);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!claim) return null;

  const riskScore = Math.floor((100 - claim.score) / 10);
  const isHighRisk = riskScore > 5;
  const isMediumRisk = riskScore > 2 && riskScore <= 5;
  const riskLabel = isHighRisk ? 'High Risk' : isMediumRisk ? 'Medium Risk' : 'Low Risk';
  const riskColor = isHighRisk ? 'text-red-500' : isMediumRisk ? 'text-amber-500' : 'text-[#059669]';
  const riskBg = isHighRisk ? 'bg-red-50 text-red-600 border-red-200' : isMediumRisk ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-[#059669]/10 text-[#059669] border-[#059669]/20';

  const getSignalProps = (status) => status === 'Flagged' ? { status, width: '40%', color: '#d97706' } : { status, width: '90%', color: '#059669' };
  const s = claim.signals || {};
  const signals = [
    { label: 'S1 (Time Gap)', ...getSignalProps(s.S1 || 'Pending') },
    { label: 'S2 (Repeat Claim)', ...getSignalProps(s.S2 || 'Pending') },
    { label: 'S3 (Visual Inconsistency)', ...getSignalProps(s.S3 || 'Pending') },
    { label: 'S4 (Text-Visual Mismatch)', ...getSignalProps(s.S4 || 'Pending') },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col border border-slate-200/40"
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >

        {view === 'success' && (
          <div
            className="flex-1 overflow-y-auto scroll-smooth overscroll-contain p-8 sm:p-12 relative bg-transparent flex flex-col items-center justify-center"
            style={{
              animation: 'swipeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              willChange: 'transform, opacity'
            }}
          >
            <style>{`
              @keyframes swipeIn {
                0% { transform: translate3d(30px, 0, 0); opacity: 0; }
                100% { transform: translate3d(0, 0, 0); opacity: 1; }
              }
            `}</style>
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-300/15 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center my-auto w-full max-w-full" style={{ width: '450px' }}>
              {/* Checkmark Icon */}
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10 border border-white shrink-0">
                <span className="material-symbols-outlined text-emerald-600 text-[48px]">task_alt</span>
              </div>

              {/* Typography */}
              <h2 className="text-[32px] font-bold text-slate-800 mb-4 tracking-tight leading-tight w-full">Klaim Berhasil Disetujui</h2>
              <p className="text-body-lg text-slate-500 mb-10 w-full leading-relaxed">
                Pengembalian dana untuk klaim <span className="font-bold text-slate-800">{claim.resi}</span> sedang diproses dan akan diteruskan ke sistem.
              </p>

              {/* Receipt Summary Card */}
              <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/50 mb-10 flex flex-col gap-4 text-left relative overflow-hidden">
                {/* Decorative edge line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" />

                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-slate-500 shrink-0">Status</span>
                  <span className="text-[12px] font-bold tracking-wide text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50 uppercase whitespace-nowrap">Refund Diproses</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-slate-500 shrink-0">Nominal Refund</span>
                  <span className="text-label-md text-slate-800 font-bold whitespace-nowrap">
                    Rp {parseInt(refundAmount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-slate-500 shrink-0">Estimasi Selesai</span>
                  <span className="text-label-md text-slate-800 font-bold whitespace-nowrap">1-3 Hari Kerja</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={onClose}
                className="w-full px-10 py-4 rounded-xl text-label-md bg-[#1a3636] text-white hover:bg-[#2d5252] transition-all duration-300 shadow-lg shadow-[#1a3636]/20 flex items-center justify-center gap-2 group shrink-0"
              >
                Kembali ke Dashboard
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {view === 'refund_prompt' && (
          <div
            className="flex-1 overflow-y-auto scroll-smooth overscroll-contain p-8 sm:p-12 relative bg-transparent flex flex-col items-center justify-center"
            style={{
              animation: 'swipeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              willChange: 'transform, opacity'
            }}
          >
            <div className="relative z-10 flex flex-col w-full max-w-full mx-auto bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/50" style={{ width: '550px' }}>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">payments</span>
                </div>
                <div>
                  <h2 className="text-[24px] font-bold text-slate-800 tracking-tight">Setujui Klaim</h2>
                  <p className="text-body-md text-slate-500 mt-1">Klaim <span className="font-bold text-slate-700">{claim.resi}</span> akan disetujui untuk refund.</p>
                </div>
              </div>

              <div className="mb-8 w-full">
                <label className="block text-label-md text-slate-700 mb-3">Nominal Refund (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full p-4 pl-12 border border-slate-300 rounded-xl bg-white text-slate-800 text-lg font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Cacat minor dikompensasi sebagian, cacat mayor full refund.
                </p>
              </div>

              <div className="flex justify-end gap-4 w-full">
                <button
                  onClick={handleCancelRefund}
                  className="px-6 py-3 rounded-xl text-label-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors duration-200 shrink-0 whitespace-nowrap"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmRefund}
                  disabled={!refundAmount || isUpdating}
                  className="px-8 py-3 rounded-xl text-label-md bg-[#059669] text-white hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  {isUpdating ? 'Memproses...' : 'Terima & Proses Refund'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'reject_prompt' && (
          <div
            className="flex-1 overflow-y-auto scroll-smooth overscroll-contain p-8 sm:p-12 relative bg-transparent flex flex-col items-center justify-center"
            style={{
              animation: 'swipeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              willChange: 'transform, opacity'
            }}
          >
            <div className="relative z-10 flex flex-col w-full max-w-full mx-auto bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/50" style={{ width: '550px' }}>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">warning</span>
                </div>
                <div>
                  <h2 className="text-[24px] font-bold text-slate-800 tracking-tight">Konfirmasi Penolakan</h2>
                  <p className="text-body-md text-slate-500 mt-1">Klaim <span className="font-bold text-slate-700">{claim.resi}</span> akan ditutup permanen.</p>
                </div>
              </div>

              <div className="mb-8 w-full">
                <label className="block text-label-md text-slate-700 mb-3">Alasan Penolakan (Wajib)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Bukti video unboxing tidak lengkap, kerusakan tidak sesuai kebijakan..."
                  className="w-full h-36 p-4 border border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-none transition-all shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-4 w-full">
                <button
                  onClick={handleCancelReject}
                  className="px-6 py-3 rounded-xl text-label-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors duration-200 shrink-0 whitespace-nowrap"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim()}
                  className="px-8 py-3 rounded-xl text-label-md bg-[#ba1a1a] text-white hover:bg-[#93000a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 shrink-0 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[20px]">block</span>
                  {isUpdating ? 'Memproses...' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'rejected' && (
          <div
            className="flex-1 overflow-y-auto scroll-smooth overscroll-contain p-8 sm:p-12 relative bg-transparent flex flex-col items-center justify-center"
            style={{
              animation: 'swipeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              willChange: 'transform, opacity'
            }}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-300/15 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center my-auto w-full max-w-full" style={{ width: '450px' }}>
              {/* Icon */}
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-red-500/10 border border-white shrink-0">
                <span className="material-symbols-outlined text-red-600 text-[48px]">block</span>
              </div>

              {/* Typography */}
              <h2 className="text-[32px] font-bold text-slate-800 mb-4 tracking-tight leading-tight w-full">Klaim Ditolak</h2>
              <p className="text-body-lg text-slate-500 mb-10 w-full leading-relaxed">
                Permintaan pengembalian dana untuk klaim <span className="font-bold text-slate-800">{claim.resi}</span> tidak dapat disetujui karena tidak memenuhi syarat kebijakan.
              </p>

              {/* Receipt Summary Card */}
              <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/50 mb-10 flex flex-col gap-4 text-left relative overflow-hidden">
                {/* Decorative edge line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400" />

                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-slate-500 shrink-0">Status</span>
                  <span className="text-[12px] font-bold tracking-wide text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-100/50 uppercase whitespace-nowrap">Ditolak</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-slate-500 shrink-0">Nominal Refund</span>
                  <span className="text-label-md text-slate-800 font-bold whitespace-nowrap">Rp 0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-slate-500 shrink-0">Tindakan</span>
                  <span className="text-label-md text-slate-800 font-bold whitespace-nowrap">Klaim Ditutup</span>
                </div>
                <div className="pt-4 border-t border-slate-200/60 flex flex-col gap-2">
                  <span className="text-body-sm text-slate-500 shrink-0">Catatan Penolakan:</span>
                  <p className="text-body-md text-slate-800 font-medium italic break-words leading-relaxed">
                    "{rejectReason}"
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={onClose}
                className="w-full px-10 py-4 rounded-xl text-label-md bg-[#1a3636] text-white hover:bg-[#2d5252] transition-all duration-300 shadow-lg shadow-[#1a3636]/20 flex items-center justify-center gap-2 group shrink-0"
              >
                Kembali ke Dashboard
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {(view === 'detail' || view === 'exiting') && (
          <div
            className={`flex-1 overflow-y-auto scroll-smooth overscroll-contain p-8 transition-[transform,opacity] duration-100 ease-out transform-gpu ${view === 'exiting' ? '-translate-x-8 opacity-0' : 'translate-x-0 opacity-100'}`}
            style={{ willChange: 'transform, opacity' }}
          >

            <div className="flex items-center justify-between mb-8 bg-white p-6 border border-[#cbd5e1]/50 rounded-2xl shadow-sm">
              <div>
                <h1 className="text-h1 text-[#0f172a]">Claim Detail Panel</h1>
                <p className="text-body-md text-[#475569] mt-2 flex items-center gap-2">
                  Claim ID: {claim.resi} • {claim.product}
                  {isAnalyzing && (
                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-medium">
                      <span className="material-symbols-outlined animate-spin text-[14px]">sync</span> AI Analyzing...
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#0f172a] transition-colors duration-200 text-label-md rounded-xl"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
                Close Panel
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left Col: Visual Evidence (2/3) */}
              <div className="lg:col-span-2 flex flex-col gap-8">

                {/* Image Comparison */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                  <h3 className="text-h3 text-on-background mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a3636]">image_search</span>
                    Visual Evidence
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                    {/* Customer Photo */}
                    <div className="flex flex-col gap-3">
                      <div className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square border border-slate-200/60">
                        <img
                          alt="Customer uploaded photo"
                          className="w-full h-full object-cover"
                          src={claim.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuC0H4P2MD_-CKMW9_X2SbZloOsOvqzdeJVHOAIHfnC3Xs6oNiJGiqOw4143FEdQKi0sLHpSCHApSaF-zqcKL87jD5IPq4HC1Ys7ShD5TBnS_sBlgGmP6xcvW9c-x0Jq_iABaSqmLywaOje1N4z_055dFFXaDfJxmZv5sK53FQ980MIgMrOPE3EDuBHzAL3lgeSgcsQykgLrseakP6nBw2ORpv_DgljG6q2riTWZPgxbFizXgKHT_8vh7I1PwZtQ6fGmkC3sGA6mE7TB"}
                        />
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-label-md text-on-background">Customer Upload</span>
                        <span className="text-body-sm text-outline">{claim.date}, {claim.time}</span>
                      </div>
                    </div>

                    {/* Catalog Photo */}
                    <div className="flex flex-col gap-3">
                      <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square border border-slate-200/60">
                        <img
                          alt="Catalog reference photo"
                          className="w-full h-full object-cover"
                          src={claim.foto_katalog_url || "https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=600&auto=format&fit=crop"}
                        />
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-label-md text-on-background">Catalog Reference</span>
                        <span className="text-body-sm text-outline">SKU: SNK-RD-042</span>
                      </div>
                    </div>

                    {/* Unboxing Video */}
                    <div className="flex flex-col gap-3">
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-square border border-slate-200/60 flex items-center justify-center group">
                        {claim.video_url ? (
                          <video
                            src={claim.video_url}
                            controls
                            controlsList="nodownload"
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                            }}
                          />
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-white text-[64px] opacity-80 group-hover:opacity-100 transition-opacity">videocam_off</span>
                            <div className="absolute bottom-3 right-3 bg-black/80 text-white text-label-sm px-2 py-1 rounded-lg">No Video</div>
                          </>
                        )}
                        {claim.video_url && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                            <span className="material-symbols-outlined text-[12px]">cloud_done</span>
                            Supabase
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-label-md text-on-background">Unboxing Video</span>
                        <span className="text-body-sm text-outline">
                          {claim.video_url
                            ? <a href={claim.video_url} target="_blank" rel="noopener noreferrer" className="text-[#1a4742] hover:underline flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>Buka
                              </a>
                            : 'Tidak ada'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Customer Complaint */}
                <div className="bg-red-50 rounded-2xl p-6 shadow-sm border-l-4 border-red-500 relative overflow-hidden">
                  <h3 className="text-h3 text-red-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600">record_voice_over</span>
                    Keluhan Pelanggan
                  </h3>
                  <div className="flex gap-4 items-start">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-red-100/50 flex-shrink-0">
                      <span className="material-symbols-outlined text-red-500 text-[24px]">format_quote</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-body-lg text-slate-800 bg-white p-4 rounded-xl border border-red-100/50 shadow-sm leading-relaxed">
                        "{claim.teks_keluhan || "Tidak ada keluhan tertulis."}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation — bg-surface-dim with left border matching reference */}
                <div className="bg-[#f1f5f9] rounded-2xl p-6 shadow-sm border-l-4 border-[#1a3a3a] relative overflow-hidden">
                  <h3 className="text-h3 text-[#0f172a] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1a3a3a]">auto_awesome</span>
                    A.U.R.A Recommendation
                  </h3>
                  <div className="flex gap-4 items-start">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-[#cbd5e1]/30">
                      <span className="material-symbols-outlined text-[#1a3a3a] text-[24px]">insights</span>
                    </div>
                    <div>
                      <p className="text-body-lg text-[#0f172a]">
                        <span className="font-bold text-[#1a3a3a]">{claim.ai_analysis || "Membutuhkan analisa lebih lanjut."}</span>
                      </p>
                      <p className="text-body-sm text-[#475569] mt-2">
                        Policy: {claim.policy_quote || "Kebijakan standar A.U.R.A berlaku."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Intelligence Report (1/3) */}
              <div className="flex flex-col gap-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200/60">
                    <h3 className="text-h3 text-on-background flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1a3636]">policy</span>
                      Intelligence Report
                    </h3>
                  </div>

                  {/* Risk Score — bg-surface-dim matching reference */}
                  <div className="flex flex-col items-center justify-center py-6 mb-8 bg-[#f1f5f9] rounded-xl border border-[#cbd5e1]/30">
                    <span className="text-label-sm text-[#475569] uppercase tracking-wider mb-2">Overall Risk Score</span>
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center text-amber-600">
                        <span className="material-symbols-outlined animate-spin text-4xl mb-2">autorenew</span>
                        <span className="text-sm font-medium">Menghitung...</span>
                      </div>
                    ) : (
                      <>
                        <div className={`text-[48px] leading-none font-bold ${riskColor} flex items-baseline gap-1`}>
                          {riskScore}<span className="text-[24px] text-[#94a3b8] font-medium">/10</span>
                        </div>
                        <span className={`text-label-md px-3 py-1 rounded-lg mt-3 border ${riskBg}`}>{riskLabel}</span>
                      </>
                    )}
                  </div>

                  {/* Trust Signals */}
                  <div className="flex flex-col gap-5 flex-1">
                    <span className="text-label-md text-[#0f172a] mb-1">Trust Signals Breakdown</span>
                    {signals.map(({ label, status, width, color }) => (
                      <div key={label} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-label-sm text-[#475569]">{label}</span>
                          <span className={`text-label-sm font-bold ${status === 'Flagged' ? 'text-[#0f172a]' : 'text-[#0f172a]'}`}>{status}</span>
                        </div>
                        {/* bg-surface-variant for track matching reference */}
                        <div className="h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width, backgroundColor: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row justify-end gap-4">
              {claim.status_klaim === 'APPROVED' || claim.status_klaim === 'REJECTED' ? (
                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 bg-slate-50 p-2 pl-6 rounded-xl border border-slate-200/60">
                  <div className="text-label-md text-slate-700 font-bold flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[20px] ${claim.status_klaim === 'APPROVED' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {claim.status_klaim === 'APPROVED' ? 'check_circle' : 'cancel'}
                    </span>
                    Status: {claim.status_klaim === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                  </div>
                  <button
                    onClick={() => setClaim({ ...claim, status_klaim: 'PENDING_REVIEW' })}
                    className="px-4 py-2 rounded-lg text-label-sm bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors duration-200 shadow-sm flex items-center gap-2 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Ubah Keputusan
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleRejectClick}
                    disabled={isUpdating || isAnalyzing}
                    className="px-6 py-3 rounded-xl text-label-md bg-white text-[#ba1a1a] border border-[#ba1a1a] hover:bg-red-50 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">block</span>
                    Tolak Klaim
                  </button>
                  <button
                    onClick={handleApproveClick}
                    disabled={isUpdating || isAnalyzing}
                    className="px-8 py-3 rounded-xl text-label-md bg-[#059669] text-white hover:bg-[#047857] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#059669]/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    {isUpdating ? 'Memproses...' : 'Terima & Refund'}
                  </button>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceReportModal;
