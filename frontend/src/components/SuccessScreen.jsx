import React from 'react';

const SuccessScreen = ({ onReturnHome, claimId = '#RET-2023-8942' }) => {
  return (
    <div 
      className="text-on-surface min-h-screen flex justify-center items-center absolute inset-0 z-50 w-full" 
      style={{ 
        backgroundColor: 'var(--color-surface)',
        backgroundImage: "url('https://lh3.googleusercontent.com/aida/ADBb0uhnQhjM8nmNOslFRIjJ94d0CfEA93YIjLikKhjBcN2cG3TLuEKjPzlX0cBYQi4XN0xoJ4iTJ9d3QRn67CjPXo8I3GWqmRXaBdRyMOhKP-NLvVKfheIrOQSVHhojadQIK1F9G_PmVe34AgtviYFdsvcRzzUcr8ibAPL2mPD2A9w7tXX6bGYaIauU8XQQWIYDVj574WbRR3e7zGOk_8d53PVnDBzGCpKNtG_4sHqplGVaO-IHsEwAm1fIBIyp')", 
        backgroundSize: "auto", 
        backgroundPosition: "top left", 
        backgroundRepeat: "repeat" 
      }}
    >
      <main className="max-w-[640px] w-full bg-surface-container-lowest antigravity-shadow rounded-[24px] p-xl flex flex-col items-center text-center h-fit m-4">
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
          Claim ID: <span className="text-primary font-bold">{claimId}</span>
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
            onClick={onReturnHome}
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
};

export default SuccessScreen;
