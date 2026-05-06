import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Package } from 'lucide-react';

const Gatekeeper = () => {
  const [resi, setResi] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const isFormValid = resi.trim() !== '' && phone.trim().length === 4;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      navigate('/claim');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Decorative background elements for Antigravity look */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100 blur-3xl opacity-50"></div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 mb-4 shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">A.U.R.A.</h1>
          <p className="text-slate-500 text-sm">The Gatekeeper - Validasi Identitas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="resi" className="block text-sm font-medium text-slate-700">Nomor Resi Pesanan</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Package size={18} />
              </div>
              <input
                type="text"
                id="resi"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                placeholder="Contoh: JX1234567890"
                value={resi}
                onChange={(e) => setResi(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">4 Digit Terakhir No HP</label>
            <input
              type="text"
              id="phone"
              maxLength={4}
              pattern="\d*"
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-center tracking-widest text-lg font-medium"
              placeholder="XXXX"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPhone(val);
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex justify-center items-center gap-2 ${
              isFormValid 
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Verifikasi Pesanan
          </button>
        </form>
      </div>
    </div>
  );
};

export default Gatekeeper;
