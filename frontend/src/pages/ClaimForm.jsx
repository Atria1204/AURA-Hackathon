import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, X, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const ClaimForm = () => {
  const [complaint, setComplaint] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { type: 'success' | 'error', message: string }
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    
    // Ensure it's an image
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      setAlertInfo({ type: 'error', message: 'Hanya file JPG atau PNG yang diperbolehkan.' });
      return;
    }

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
      setAlertInfo(null);
    };
    reader.onerror = () => {
      setAlertInfo({ type: 'error', message: 'Gagal membaca file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImageBase64(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaint || !imageBase64) {
      setAlertInfo({ type: 'error', message: 'Harap lengkapi detail keluhan dan unggah foto bukti.' });
      return;
    }

    setIsLoading(true);
    setAlertInfo(null);

    const payload = {
      nomor_resi: 'TKP-2026-001', // Dummy order
      teks_keluhan: complaint,
      foto_base64: imageBase64,
    };

    try {
      // Mocking fetch logic as requested
      // In a real environment this hits the backend, but we'll simulate a fetch delay
      // and random 429 error if it can't connect, or just hit the real URL.
      const response = await fetch('http://127.0.0.1:8080/api/analyze_claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(err => {
        // If server is not running, we mock a response for demonstration
        throw new Error('NetworkError');
      });

      if (response && response.status === 429) {
        setAlertInfo({ type: 'error', message: 'Rate Limit Tercapai (429). Sistem sedang sibuk, mohon coba lagi beberapa saat.' });
      } else if (response && response.ok) {
        setIsSuccess(true);
      } else {
        setAlertInfo({ type: 'error', message: `Terjadi kesalahan saat mengirim klaim. (Status: ${response?.status})` });
      }
    } catch (error) {
      // Handle when the python backend isn't running - simulate randomly
      console.warn("Backend not reachable. Simulating response...");
      await new Promise(r => setTimeout(r, 1500)); // simulate network delay
      
      const isRateLimited = Math.random() < 0.3; // 30% chance to simulate 429
      
      if (isRateLimited) {
        setAlertInfo({ type: 'error', message: '[Mock] Rate Limit Tercapai (429). Mohon coba lagi beberapa saat.' });
      } else {
        setIsSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-surface font-body-md text-on-surface min-h-screen flex justify-center p-gutter pt-[15vh]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/ADBb0uhnQhjM8nmNOslFRIjJ94d0CfEA93YIjLikKhjBcN2cG3TLuEKjPzlX0cBYQi4XN0xoJ4iTJ9d3QRn67CjPXo8I3GWqmRXaBdRyMOhKP-NLvVKfheIrOQSVHhojadQIK1F9G_PmVe34AgtviYFdsvcRzzUcr8ibAPL2mPD2A9w7tXX6bGYaIauU8XQQWIYDVj574WbRR3e7zGOk_8d53PVnDBzGCpKNtG_4sHqplGVaO-IHsEwAm1fIBIyp')", backgroundSize: "auto", backgroundPosition: "top left", backgroundRepeat: "repeat" }}>
        <main className="max-w-[640px] w-full bg-surface-container-lowest antigravity-shadow rounded-[24px] p-xl flex flex-col items-center text-center">
          {/* Illustration/Icon Area */}
          <div className="mb-lg relative">
            <div className="absolute inset-0 bg-success/5 rounded-full scale-150 blur-xl"></div>
            <div className="relative w-24 h-24 bg-success/10 rounded-full flex items-center justify-center text-success">
              <span className="material-symbols-outlined !text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
          </div>
          
          {/* Claim ID Badge */}
          <div className="mb-sm px-4 py-1.5 bg-surface-container-high text-on-surface-variant font-label-md rounded-full border border-outline-variant/30">
            Claim ID: <span className="text-primary font-bold">#RET-2023-8942</span>
          </div>
          
          {/* Heading */}
          <h1 className="font-h1 text-h1 text-on-background mb-sm">
            Laporan Berhasil Terkirim
          </h1>
          
          {/* Subtext */}
          <p className="font-body-md text-body-md text-on-surface-variant max-w-[480px] mb-xl leading-relaxed">
            Terima kasih telah memberikan informasi detail. Tim A.U.R.A sedang menganalisis klaim Anda. Anda akan menerima notifikasi status dalam waktu kurang dari 10 menit.
          </p>
          
          {/* Action Area */}
          <div className="w-full flex flex-col gap-sm">
            <button 
              onClick={() => { setIsSuccess(false); setComplaint(''); removeImage(); setAlertInfo(null); }}
              className="w-full py-4 bg-primary-container text-on-primary font-label-md rounded-xl shadow-lg shadow-primary-container/20 hover:opacity-90 active:scale-95 transition-all duration-200"
            >
              Kembali ke Beranda
            </button>
            <button className="w-full py-4 text-on-surface-variant font-label-md rounded-xl hover:bg-surface-container-low transition-colors">
              Lihat Rincian Klaim
            </button>
          </div>
          
          {/* Support Link */}
          <div className="mt-lg pt-lg border-t border-surface-container-highest w-full">
            <p className="font-body-sm text-body-sm text-outline">
              Membutuhkan bantuan lebih lanjut?{' '}
              <a className="text-primary font-medium hover:underline" href="#">Hubungi Support</a>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Ajukan Klaim Pengembalian</h1>
          <p className="text-slate-500">Lengkapi form di bawah ini agar A.U.R.A dapat segera menganalisis keluhan Anda.</p>
        </div>

        {/* Dummy Order Details */}
        <div className="glass-card p-6 border-l-4 border-l-primary-500">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Detail Pesanan</p>
              <p className="text-lg font-medium text-slate-800">Sepatu Sneakers Putih - Size 42</p>
              <p className="text-sm text-slate-500">No. Resi: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">TKP-2026-001</span></p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Terkirim
              </span>
              <p className="text-xs text-slate-400 mt-1">Diterima: 12 Mei 2026</p>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alertInfo && (
          <div className={`p-4 rounded-xl flex items-start gap-3 transition-all ${alertInfo.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {alertInfo.type === 'error' ? <AlertCircle className="shrink-0 mt-0.5" size={20} /> : <CheckCircle2 className="shrink-0 mt-0.5" size={20} />}
            <p className="text-sm font-medium">{alertInfo.message}</p>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          
          <div className="space-y-2">
            <label htmlFor="complaint" className="block text-sm font-medium text-slate-700">Detail Keluhan</label>
            <textarea
              id="complaint"
              rows="4"
              className="block w-full p-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
              placeholder="Jelaskan secara detail apa yang salah dengan pesanan Anda..."
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Unggah Foto Bukti (.jpg, .png)</label>
            
            {!imageBase64 ? (
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                  isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                  <div className={`p-4 rounded-full ${isDragging ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
                    <UploadCloud size={32} />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-primary-600">Klik untuk mengunggah</span> atau seret dan lepas
                  </div>
                  <p className="text-xs text-slate-500">Maks. 5MB (JPG/PNG)</p>
                </div>
              </div>
            ) : (
              <div className="relative border border-slate-200 rounded-2xl p-4 flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-800 truncate">{fileName}</p>
                    <p className="text-xs text-slate-500">Gambar siap dikirim</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`py-3 px-8 rounded-xl font-medium transition-all duration-200 flex justify-center items-center gap-2 ${
                isLoading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Kirim Klaim</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimForm;
