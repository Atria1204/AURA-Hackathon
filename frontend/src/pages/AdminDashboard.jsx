import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IntelligenceReportModal from '../components/IntelligenceReportModal';

const scoreStyle = (s) => {
  if (s >= 80) return { bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' };
  if (s >= 50) return { bar: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700' };
  return { bar: 'bg-red-500', pill: 'bg-red-50 text-red-700' };
};

/* ── WhatsApp-style doodle motif for sidebar ── */
const SIDEBAR_DOODLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-linecap='round' stroke-linejoin='round' opacity='1'%3E%3C!-- box --%3E%3Crect x='12' y='12' width='16' height='14' rx='2'/%3E%3Cline x1='12' y1='18' x2='28' y2='18'/%3E%3C!-- shield --%3E%3Cpath d='M70 10 L70 20 Q70 28 80 32 Q90 28 90 20 L90 10 Z'/%3E%3Cpath d='M76 19 L79 22 L85 16'/%3E%3C!-- checkmark circle --%3E%3Ccircle cx='150' cy='20' r='10'/%3E%3Cpath d='M145 20 L148 23 L155 16'/%3E%3C!-- star --%3E%3Cpath d='M30 70 L32 76 L38 76 L33 80 L35 86 L30 82 L25 86 L27 80 L22 76 L28 76 Z'/%3E%3C!-- clock --%3E%3Ccircle cx='90' cy='75' r='10'/%3E%3Cline x1='90' y1='75' x2='90' y2='69'/%3E%3Cline x1='90' y1='75' x2='95' y2='77'/%3E%3C!-- chat bubble --%3E%3Cpath d='M140 65 L165 65 Q168 65 168 68 L168 80 Q168 83 165 83 L152 83 L148 88 L148 83 L143 83 Q140 83 140 80 L140 68 Q140 65 143 65 Z'/%3E%3Cline x1='146' y1='72' x2='162' y2='72'/%3E%3Cline x1='146' y1='77' x2='157' y2='77'/%3E%3C!-- tag --%3E%3Cpath d='M20 135 L30 125 L40 125 L40 135 L30 145 Z'/%3E%3Ccircle cx='36' cy='129' r='2'/%3E%3C!-- document --%3E%3Crect x='80' y='125' width='14' height='18' rx='2'/%3E%3Cline x1='84' y1='131' x2='90' y2='131'/%3E%3Cline x1='84' y1='135' x2='90' y2='135'/%3E%3Cline x1='84' y1='139' x2='88' y2='139'/%3E%3C!-- return arrow --%3E%3Cpath d='M140 140 Q140 130 150 130 L155 130'/%3E%3Cpath d='M152 126 L156 130 L152 134'/%3E%3C!-- camera --%3E%3Crect x='15' y='170' width='18' height='13' rx='2'/%3E%3Ccircle cx='24' cy='177' r='4'/%3E%3Cpath d='M20 170 L22 166 L26 166 L28 170'/%3E%3C!-- lock --%3E%3Crect x='82' y='176' width='12' height='10' rx='2'/%3E%3Cpath d='M84 176 L84 172 Q84 168 88 168 Q92 168 92 172 L92 176'/%3E%3C!-- thumbs up --%3E%3Cpath d='M145 175 L150 170 L153 170 L153 182 L148 182'/%3E%3Crect x='140' y='175' width='5' height='8' rx='1'/%3E%3C/g%3E%3C/svg%3E")`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeFilter, setTimeFilter] = useState('today');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isSorting, setIsSorting] = useState(false);
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8080/api/claims');
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        setClaims(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleSort = () => {
    setIsSorting(true);
    setTimeout(() => {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
      setIsSorting(false);
    }, 150);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('aura_admin_auth');
    navigate('/login', { replace: true });
  };

  const filteredClaims = claims.filter(claim => {
    if (activeTab === 'accepted') return claim.status_klaim === 'APPROVED';
    if (activeTab === 'rejected') return claim.status_klaim === 'REJECTED';
    return true;
  });

  const sortedClaims = [...filteredClaims].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalClaims = sortedClaims.length;
  const totalPages = Math.max(1, Math.ceil(totalClaims / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalClaims);
  const currentClaims = sortedClaims.slice(startIndex, endIndex);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f1ea] text-on-surface">

      {/* Sidebar — w-72 matching Claim Detail reference */}
      <nav className="flex flex-col h-full w-72 bg-[#1a3636] text-white fixed left-0 top-0 z-20 shadow-xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: SIDEBAR_DOODLE, backgroundSize: '200px 200px', backgroundRepeat: 'repeat' }} />

        <div className="relative z-10 p-6 flex flex-col h-full">
          <div className="flex flex-col mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-white text-3xl">insights</span>
              <h2 className="text-xl font-black text-white uppercase tracking-widest">A.U.R.A</h2>
            </div>
            <p className="text-xs text-white/50 font-medium ml-9">Intelligence Report</p>
          </div>


          <ul className="space-y-1 flex-1">
            {[
              { tab: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
              { tab: 'claims', icon: 'assignment', label: 'Semua Klaim' },
              { tab: 'accepted', icon: 'check_circle', label: 'Klaim Diterima' },
              { tab: 'rejected', icon: 'cancel', label: 'Klaim Ditolak' },
            ].map(({ tab, icon, label }) => (
              <li key={tab}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white/10 text-white border-l-4 border-white rounded-l-none'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}>
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-6 border-t border-white/20 space-y-1">
            <a href="#"
              className="flex items-center gap-3 px-4 py-3 text-white/60 hover:bg-white/10 hover:text-white transition-all rounded-xl text-[13px] font-medium">
              <span className="material-symbols-outlined text-[20px]">contact_support</span>
              Support
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}
              className="flex items-center gap-3 px-4 py-3 text-white/60 hover:bg-white/10 hover:text-red-300 transition-all rounded-xl text-[13px] font-medium">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Logout
            </a>
          </div>
        </div>
      </nav>

      {/* Top Header — fixed to the right of sidebar */}
      <header className="fixed top-0 right-0 w-[calc(100%-18rem)] flex justify-end items-center px-8 h-16 bg-white/90 backdrop-blur-md z-40 border-b border-slate-200/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-slate-400">
            <button className="cursor-pointer active:scale-95 duration-200 hover:bg-slate-100 transition-colors p-2 rounded-xl">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="cursor-pointer active:scale-95 duration-200 hover:bg-slate-100 transition-colors p-2 rounded-xl">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
          <img
            alt="Admin profile avatar"
            className="h-8 w-8 rounded-full border border-slate-200 object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAieXVlEmjpFxMZxsues_GI7P1JHImjB0ufTV4f8kSrZjZcgTeGA7g4Y4fAdoZiA_fWBHYa8c3jB-KyPkxLZMq8IL3gQdrk7-CS-lyhKlVw8eiDaa5v924xC7NS4GSLpYpgIfzQcwxqC-FjBDLnjmVkKbiW1g8WdPVPYTQEgHetMIhKAsNcLmMBQYbpfRsupwOOz16017GbApApxX2EQ0YJKrkE2HkRT-ENCPENMOMSV3I6HJuoMIMEZnvJcsk52j5tT-bMnemE7-gw"
          />
        </div>
      </header>

      {/* Main — offset by sidebar width, with top padding for header */}
      <main className="flex-1 ml-72 pt-24 px-8 pb-12 overflow-y-auto bg-white min-h-screen bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="max-w-6xl mx-auto">

          {/* Page Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-h1 text-on-surface">
                {activeTab === 'dashboard' ? 'Dashboard Overview' : 'Claim Management'}
              </h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                {activeTab === 'dashboard'
                  ? 'Real-time intelligence and claim processing metrics.'
                  : 'Manage and process customer return claims.'}
              </p>
            </div>
            {activeTab === 'dashboard' && (
              <div className="flex bg-white rounded-lg p-1 shadow-sm border border-outline-variant/30">
                {[['today','Today'],['7days','7 Days'],['30days','30 Days']].map(([val, label]) => (
                  <button key={val} onClick={() => setTimeFilter(val)}
                    className={`px-4 py-1.5 text-label-sm rounded-md transition-colors ${
                      timeFilter === val ? 'bg-[#f0f3ff] text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                    }`}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Metric Cards */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { icon: 'receipt_long', label: 'Total Claims', value: claims.length.toString(), footer: <span className="flex items-center gap-1 text-teal-700 bg-teal-50 w-fit px-2 py-1 rounded-md text-xs font-medium"><span className="material-symbols-outlined text-[14px]">trending_up</span>+12% vs yesterday</span> },
                { icon: 'pending_actions', label: 'Claims Pending Decision', value: claims.filter(c => c.status_klaim !== 'APPROVED' && c.status_klaim !== 'REJECTED').length.toString(), footer: <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-[#2d5252] h-1.5 rounded-full w-[30%]" /></div> },
                { icon: 'timer', label: 'Avg. Resolution Time', value: <><span className="text-h1">8</span><span className="text-body-sm text-on-surface-variant ml-1">Mins</span></>, footer: <span className="flex items-center gap-1 text-teal-700 bg-teal-50 w-fit px-2 py-1 rounded-md text-xs font-medium"><span className="material-symbols-outlined text-[14px]">trending_down</span>-2 mins vs avg</span> },
                { icon: 'verified_user', label: 'Avg. Trust Score', value: <><span className="text-h1">94</span><span className="text-body-sm text-on-surface-variant ml-1">/100</span></>, footer: <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-[#2d5252] h-1.5 rounded-full w-[94%]" /></div> },
              ].map(({ icon, label, value, footer }, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-card relative overflow-hidden flex flex-col justify-between h-40 border border-white">
                  {/* All cards use the same teal-50 accent blob — matching reference */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-10 -mt-10 opacity-70" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                      <span className="material-symbols-outlined text-sm">{icon}</span>
                      <span className="text-label-sm">{label}</span>
                    </div>
                    <div className="mt-2">{typeof value === 'string' ? <span className="text-h1">{value}</span> : value}</div>
                  </div>
                  <div className="relative z-10">{footer}</div>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-white/80">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-h2 text-on-surface">Daftar Klaim</h2>
                <p className="text-body-sm text-on-surface-variant mt-1">Recent return requests requiring review or automated processing.</p>
              </div>
              <button 
                onClick={handleSort}
                className="bg-[#2d5252] hover:bg-[#1a3636] text-white px-4 py-2 rounded-lg text-label-md flex items-center gap-2 transition-colors duration-200 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">sort</span>
                Urutkan Tanggal ({sortOrder === 'desc' ? 'Terbaru' : 'Terlama'})
              </button>
            </div>

            <div 
              className={`overflow-x-auto transition-opacity duration-200 ease-in-out ${isSorting ? 'opacity-0' : 'opacity-100'}`}
              style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfbf9] text-on-surface-variant text-label-sm border-b border-gray-100">
                    {['Claim ID','Receipt No','Product','Date','Status','AI Trust Score',''].map((h, i) => (
                      <th key={i} className={`py-4 px-6 font-medium tracking-wider uppercase ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-2xl mb-2 text-[#1a4742]">sync</span>
                        <p>Memuat data klaim...</p>
                      </td>
                    </tr>
                  ) : sortedClaims.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                        Tidak ada data klaim.
                      </td>
                    </tr>
                  ) : (
                    currentClaims.map((claim) => {
                      const st = scoreStyle(claim.score);
                      return (
                        <tr key={claim.id} className="hover:bg-gray-50/70 transition-colors cursor-pointer" onClick={() => setSelectedClaim(claim)}>
                          <td className="py-4 px-6 text-label-md text-[#2d5252] hover:underline">{claim.resi}</td>
                          <td className="py-4 px-6 text-body-sm text-on-surface-variant">{claim.receipt}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {claim.image ? <img src={claim.image} alt={claim.product} className="w-full h-full object-cover" />
                                  : <span className="material-symbols-outlined text-gray-400">inventory_2</span>}
                              </div>
                              <div>
                                <div className="text-label-md text-on-surface">{claim.product}</div>
                                <div className="text-xs text-on-surface-variant">{claim.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-body-sm text-on-surface">{claim.date}</div>
                            <div className="text-xs text-on-surface-variant">{claim.time}</div>
                          </td>
                          <td className="py-4 px-6">
                            {claim.status_klaim === 'APPROVED' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Disetujui</span>
                            ) : claim.status_klaim === 'REJECTED' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10">Ditolak</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">Pending</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div className={`${st.bar} h-1.5 rounded-full`} style={{ width: `${claim.score}%` }} />
                              </div>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${st.pill}`}>{claim.score}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-gray-100 transition-colors"
                              onClick={(e) => { e.stopPropagation(); setSelectedClaim(claim); }}>
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 bg-[#fcfbf9] flex justify-between items-center">
              <div className="text-body-sm text-on-surface-variant">
                Showing <span className="font-medium text-on-surface">{totalClaims > 0 ? startIndex + 1 : 0}</span> to{' '}
                <span className="font-medium text-on-surface">{endIndex}</span> of{' '}
                <span className="font-medium text-on-surface">{totalClaims}</span> results
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={validCurrentPage === 1 || totalClaims === 0}
                  className="px-3 py-1.5 border border-outline-variant rounded-md text-on-surface-variant text-label-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={validCurrentPage === totalPages || totalClaims === 0}
                  className="px-3 py-1.5 border border-outline-variant rounded-md text-on-surface text-label-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedClaim && <IntelligenceReportModal claim={selectedClaim} onClose={() => { setSelectedClaim(null); fetchClaims(); }} />}
    </div>
  );
};

export default AdminDashboard;
