import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessScreen from '../components/SuccessScreen';

const ClaimPortal = () => {
  // Gatekeeper state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [resi, setResi] = useState('');
  const [phone, setPhone] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Claim Form state
  const [complaint, setComplaint] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoFileName, setPhotoFileName] = useState('');
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  
  const [videoBase64, setVideoBase64] = useState(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const isFormValid = customerName.trim() !== '' && customerEmail.trim() !== '' && resi.trim() !== '' && phone.trim().length === 4;

  const handleVerify = () => {
    if (isFormValid) {
      setIsVerified(true);
    }
  };

  const processPhoto = (file) => {
    if (!file) return;
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      setAlertInfo({ type: 'error', message: 'Hanya file JPG atau PNG yang diperbolehkan untuk foto.' });
      return;
    }
    setPhotoFileName(file.name);
    setIsPhotoLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setPhotoBase64(reader.result); setAlertInfo(null); setIsPhotoLoading(false); };
    reader.onerror = () => { setAlertInfo({ type: 'error', message: 'Gagal membaca file foto.' }); setIsPhotoLoading(false); };
    reader.readAsDataURL(file);
  };

  const processVideo = (file) => {
    if (!file) return;
    if (!file.type.match('video/mp4')) {
      setAlertInfo({ type: 'error', message: 'Hanya file MP4 yang diperbolehkan untuk video.' });
      return;
    }
    setVideoFileName(file.name);
    setIsVideoLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setVideoBase64(reader.result); setAlertInfo(null); setIsVideoLoading(false); };
    reader.onerror = () => { setAlertInfo({ type: 'error', message: 'Gagal membaca file video.' }); setIsVideoLoading(false); };
    reader.readAsDataURL(file);
  };

  const handlePhotoDragOver = useCallback((e) => { e.preventDefault(); setIsPhotoDragging(true); }, []);
  const handlePhotoDragLeave = useCallback((e) => { e.preventDefault(); setIsPhotoDragging(false); }, []);
  const handlePhotoDrop = useCallback((e) => {
    e.preventDefault(); setIsPhotoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processPhoto(e.dataTransfer.files[0]);
  }, []);
  const handlePhotoChange = (e) => { if (e.target.files && e.target.files.length > 0) processPhoto(e.target.files[0]); };
  const removePhoto = () => { setPhotoBase64(null); setPhotoFileName(''); if (photoInputRef.current) photoInputRef.current.value = ''; };

  const handleVideoDragOver = useCallback((e) => { e.preventDefault(); setIsVideoDragging(true); }, []);
  const handleVideoDragLeave = useCallback((e) => { e.preventDefault(); setIsVideoDragging(false); }, []);
  const handleVideoDrop = useCallback((e) => {
    e.preventDefault(); setIsVideoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processVideo(e.dataTransfer.files[0]);
  }, []);
  const handleVideoChange = (e) => { if (e.target.files && e.target.files.length > 0) processVideo(e.target.files[0]); };
  const removeVideo = () => { setVideoBase64(null); setVideoFileName(''); if (videoInputRef.current) videoInputRef.current.value = ''; };

  const handleSubmitClaim = async () => {
    if (!complaint || !photoBase64) {
      setAlertInfo({ type: 'error', message: 'Harap lengkapi detail keluhan dan unggah setidaknya foto bukti.' });
      return;
    }

    setIsLoading(true);
    setAlertInfo(null);

    const payload = {
      nomor_resi: resi,
      teks_keluhan: complaint,
      foto_base64: photoBase64,
      video_base64: videoBase64,
      nama_customer: customerName,
      email_customer: customerEmail,
    };

    try {
      const response = await fetch('http://127.0.0.1:8080/api/submit_claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        throw new Error('NetworkError');
      });

      if (response && response.status === 429) {
        setAlertInfo({ type: 'error', message: 'Rate Limit Tercapai (429). Sistem sedang sibuk.' });
      } else if (response && response.ok) {
        setIsSuccess(true);
        setComplaint('');
        removePhoto();
        removeVideo();
        setIsVerified(false);
        setResi('');
        setPhone('');
        setCustomerName('');
        setCustomerEmail('');
      } else {
        setAlertInfo({ type: 'error', message: `Terjadi kesalahan. (Status: ${response?.status})` });
      }
    } catch (error) {
      // Mock logic
      await new Promise(r => setTimeout(r, 1500));

      setIsSuccess(true);
      setComplaint('');
      removePhoto();
      removeVideo();
      setIsVerified(false);
      setResi('');
      setPhone('');
      setCustomerName('');
      setCustomerEmail('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col antialiased">
      {isSuccess && <SuccessScreen onReturnHome={() => setIsSuccess(false)} />}
      <header className="w-full py-6 px-8 flex justify-center items-center absolute top-0 z-10">
        <div className="text-xl font-bold tracking-tight text-on-surface">A.U.R.A</div>
      </header>

      <main className="flex-grow flex items-center justify-center p-8 pt-24 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-surface-variant rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-surface-container rounded-full blur-3xl opacity-50 z-0"></div>

        <div className="w-full max-w-[1000px] mx-auto flex justify-center z-10 px-4">
          
          {/* Step 1: The Gatekeeper */}
          {!isVerified && (
            <div className="w-full max-w-[600px] bg-surface-container-lowest rounded-[24px] p-8 antigravity-shadow border border-surface-container relative transition-all duration-300">
            {/* Progress Indicator */}
            <div className="flex gap-2 mb-8">
              <div className="h-1 flex-1 bg-primary-container rounded-full"></div>
              <div className="h-1 flex-1 bg-surface-container rounded-full"></div>
            </div>

            <div className="mb-8">
              <h1 className="text-h1 text-on-surface mb-2">Portal Retur & Garansi Pelanggan</h1>
              <p className="text-body-md text-on-surface-variant">Proses cepat kurang dari 10 menit.</p>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label-md text-on-surface mb-2" htmlFor="customer-name">Nama Lengkap</label>
                  <input 
                    id="customer-name" 
                    type="text" 
                    placeholder="Contoh: Budi Santoso"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-label-md text-on-surface mb-2" htmlFor="customer-email">Alamat Email</label>
                  <input 
                    id="customer-email" 
                    type="email" 
                    placeholder="Contoh: budi@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label-md text-on-surface mb-2" htmlFor="receipt-number">Nomor Resi / Pesanan</label>
                  <input 
                    id="receipt-number" 
                    type="text" 
                    placeholder="Contoh: INV-2023-XYZ"
                    value={resi}
                    onChange={(e) => setResi(e.target.value.toUpperCase())}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-label-md text-on-surface mb-2" htmlFor="phone-digits">4 Digit Terakhir Nomor HP</label>
                  <input 
                    id="phone-digits" 
                    type="text" 
                    maxLength="4" 
                    placeholder="Contoh: 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" 
                  />
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleVerify}
                disabled={!isFormValid}
                className={`w-full font-label-md text-label-md py-3 px-6 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2 ${
                  isFormValid 
                    ? 'bg-primary-container hover:bg-surface-tint text-on-primary' 
                    : 'bg-surface-container text-outline cursor-not-allowed'
                }`}
              >
                Verifikasi Pesanan
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </form>

            {/* Display Success Alert if present */}
            {alertInfo && alertInfo.type === 'success' && !isVerified && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-start gap-3">
                <span className="material-symbols-outlined">check_circle</span>
                <span className="text-body-sm font-medium">{alertInfo.message}</span>
              </div>
            )}
            </div>
          )}

          {/* Step 2: Evidence Submission */}
          {isVerified && (
            <div className="w-full max-w-[600px] bg-surface-container-lowest rounded-[24px] p-8 antigravity-shadow border border-surface-container transition-all duration-300">
            <div className="flex gap-2 mb-8">
              <div className="h-1 flex-1 bg-primary-fixed rounded-full"></div>
              <div className="h-1 flex-1 bg-primary-container rounded-full"></div>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setIsVerified(false)} 
                className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors cursor-pointer -ml-2"
              >
                arrow_back
              </button>
              <h2 className="text-h2 text-on-surface">Detail Klaim</h2>
            </div>

            {/* Order Summary Card */}
            <div className="flex gap-4 p-4 rounded-xl bg-surface-container-low mb-6 border border-surface-container-high">
              <div className="w-16 h-16 rounded-lg bg-surface-variant flex-shrink-0 overflow-hidden relative">
                <img 
                  alt="Blue Denim Jacket" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx6GqDNQdZQ2d4SDRD6NKVh0wVLq0hDOmtluo2eyXjD-xwsn_Wxtc0jOQISC_dsfrQssmNyEf4uPnrgm33bxTxsCL28K67Ci7GZBv4AnGogBWx3fDAvd7PsXbVGsDQ7OsH1-HR0mWeB8G0UmY3IM8sDWokFyt6cD1OrYeeYScmcLJmd-9t-AZFGHRZfTEufEIkHhLAS6kYUblzdoYv_W5R5VNk6VlIrPNepEk4RlJ1uWWIMJ3vVASgNVtdVJtKcPwmlRZbOuaewF0b"
                />
              </div>
              <div>
                <div className="text-h3 text-on-surface">Blue Denim Jacket</div>
                <div className="text-body-sm text-on-surface-variant mt-1">Pesanan: {resi || 'INV-2023-XYZ'}</div>
              </div>
            </div>

            {/* Alert Error display */}
            {alertInfo && alertInfo.type === 'error' && isVerified && (
              <div className="mb-4 p-4 rounded-xl bg-error-container text-on-error-container flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[20px]">error</span>
                <span className="text-body-sm font-medium">{alertInfo.message}</span>
              </div>
            )}

            <form className="space-y-6">
              <div>
                <label className="block text-label-md text-on-surface mb-2" htmlFor="problem-desc">Deskripsi Masalah</label>
                <textarea 
                  id="problem-desc" 
                  rows="3"
                  placeholder="Jelaskan kendala yang Anda alami..."
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="w-full p-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors resize-none" 
                ></textarea>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-label-md text-on-surface mb-2">Unggah Bukti Foto (Wajib)</label>
                  {isPhotoLoading ? (
                    <div className="w-full border-2 border-dashed border-primary-container rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-low h-[180px]">
                      <span className="material-symbols-outlined animate-spin text-primary-container text-[32px] mb-2">sync</span>
                      <div className="text-label-md text-on-surface">Memproses foto...</div>
                    </div>
                  ) : !photoBase64 ? (
                    <div 
                      className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer relative ${
                        isPhotoDragging ? 'border-primary-container bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest hover:border-primary-container hover:bg-surface-container-low'
                      }`}
                      onDragOver={handlePhotoDragOver}
                      onDragLeave={handlePhotoDragLeave}
                      onDrop={handlePhotoDrop}
                    >
                      <input
                        type="file"
                        ref={photoInputRef}
                        onChange={handlePhotoChange}
                        accept="image/jpeg, image/png"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 pointer-events-none">
                        <span className="material-symbols-outlined text-primary-container text-[24px]">add_a_photo</span>
                      </div>
                      <div className="text-label-md text-on-surface mb-1 pointer-events-none">Tarik & Lepas foto di sini</div>
                      <div className="text-body-sm text-on-surface-variant pointer-events-none">atau klik untuk menelusuri (JPG, PNG)</div>
                    </div>
                  ) : (
                    <div className="relative border border-outline-variant rounded-xl p-4 flex items-center justify-between bg-surface-container-lowest shadow-sm">
                      <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="w-16 h-16 rounded-lg bg-surface-variant overflow-hidden shrink-0 border border-outline-variant/30 flex items-center justify-center">
                          <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <p className="text-body-md font-medium text-on-surface truncate">{photoFileName}</p>
                          <p className="text-body-sm text-on-surface-variant">Foto siap dikirim</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="p-2 text-outline hover:text-error hover:bg-error-container rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-label-md text-on-surface mb-2">Unggah Bukti Video Unboxing (Opsional)</label>
                  {isVideoLoading ? (
                    <div className="w-full border-2 border-dashed border-primary-container rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-low h-[180px]">
                      <span className="material-symbols-outlined animate-spin text-primary-container text-[32px] mb-2">sync</span>
                      <div className="text-label-md text-on-surface">Memproses video...</div>
                    </div>
                  ) : !videoBase64 ? (
                    <div 
                      className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer relative ${
                        isVideoDragging ? 'border-primary-container bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest hover:border-primary-container hover:bg-surface-container-low'
                      }`}
                      onDragOver={handleVideoDragOver}
                      onDragLeave={handleVideoDragLeave}
                      onDrop={handleVideoDrop}
                    >
                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoChange}
                        accept="video/mp4"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 pointer-events-none">
                        <span className="material-symbols-outlined text-primary-container text-[24px]">videocam</span>
                      </div>
                      <div className="text-label-md text-on-surface mb-1 pointer-events-none">Tarik & Lepas video di sini</div>
                      <div className="text-body-sm text-on-surface-variant pointer-events-none">atau klik untuk menelusuri (MP4 max 50MB)</div>
                    </div>
                  ) : (
                    <div className="relative border border-outline-variant rounded-xl p-4 flex items-center justify-between bg-surface-container-lowest shadow-sm">
                      <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="w-16 h-16 rounded-lg bg-surface-variant overflow-hidden shrink-0 border border-outline-variant/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[32px] text-primary">play_circle</span>
                        </div>
                        <div className="truncate">
                          <p className="text-body-md font-medium text-on-surface truncate">{videoFileName}</p>
                          <p className="text-body-sm text-on-surface-variant">Video siap dikirim</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="p-2 text-outline hover:text-error hover:bg-error-container rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Information Alert */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-variant text-on-surface-variant border border-surface-container-high">
                <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0 mt-0.5">info</span>
                <div className="text-body-sm">
                  Untuk mempercepat proses, kami sangat menyarankan untuk menyertakan video unboxing sebagai bukti utama.
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleSubmitClaim}
                disabled={isLoading}
                className="w-full bg-primary-container hover:bg-surface-tint text-on-primary text-label-md py-3 px-6 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    Memproses Klaim...
                  </>
                ) : (
                  <>
                    Kirim Klaim ke A.U.R.A
                  </>
                )}
              </button>
            </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ClaimPortal;
