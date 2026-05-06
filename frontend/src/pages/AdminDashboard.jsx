import React, { useState } from 'react';
import IntelligenceReportModal from '../components/IntelligenceReportModal';

const dummyClaims = [
  { id: 1, resi: '#CLM-9921', receipt: 'RCPT-445102', product: 'Pro Audio ANC Headphones', category: 'Electronics', date: 'Oct 24, 2023', time: '10:42 AM', score: 96, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCb8q4jqUsa_lDSQUkuCDJlzouO1I5MC08C3C14vYtU9sput3hg-YAva44R0CCQgYYXsHUtXIoaI69g_lPsGRsmIaGaUFEyeY5F5sV3wkjgcfb3ByCeakX1BbDRsSGfYox4gyrhmt7tD8CslZTTX5_NSwEazpoqONjIegtDqDXO_5ZFkAvnZkqBlJlNY-xYKqJ85jWqHlBimYbqGJGmKgL88bfvqxq8IXaorAgGDwZlKE9pbgfO7X47bYmplqgzjLtsXMDEXHHjA3TT' },
  { id: 2, resi: '#CLM-9920', receipt: 'RCPT-445088', product: 'AeroRun Elite Sneakers', category: 'Footwear', date: 'Oct 24, 2023', time: '09:15 AM', score: 65, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA91gOX-A3MJE4hDAfX6fNyPTYG21d7ZoVSJhh8WyrsFFq31e8saVVnErAEBHZTj7b3WGt_EC4wpaOeCPnuQ6h9G-eru98KM1HInfAwxKDuNANFQTwZ43L99SsGCQ0UGcID1SKtgU4H7oAYvnqAeINiel_K25smmITU9al8d2rsvsU35y_yaMvDuKUwbkCVoPY4EWkDprxCrsOS2kHTK3v3g3TY2URUDMQS4k8-SJLrgdC4Hj8cpnrWYpgdQbnjmXZjaW_ST925EYdJ' },
  { id: 3, resi: '#CLM-9918', receipt: 'RCPT-444901', product: 'Mystery Box Premium', category: 'Misc', date: 'Oct 23, 2023', time: '04:30 PM', score: 22, image: null },
  { id: 4, resi: '#CLM-9915', receipt: 'RCPT-444822', product: 'Minimalist Smartwatch V2', category: 'Wearables', date: 'Oct 23, 2023', time: '02:15 PM', score: 88, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBnkMjPJJ4ItHbb8Pw8h5zCN8JS6K3FqLMFLRkr6fQuNGh6EB-91BrxcCiZ2Z-j04JgqKu3YnBpoDijIb8k8CiL22ZC97E1k57acFo83lNDkaR-jKNTHSeyH406oxS6nW-aF7oSbRCz-x9Q1g0mbCOBy3Di-Tdh7t8V3_qrMXwXPqDE3KWr1cUL43T-GuSVCHZnrMbhVylgQ5AsrlgRbeNz5y23eVx3SgHXURZmSOmr11gFc_Nv_5VGbyo9XeD_v4yuRSsm79Bj2Pa' },
];

const AdminDashboard = () => {
  const [selectedClaim, setSelectedClaim] = useState(null);

  const getScoreColorClass = (score) => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-800', lightBg: 'bg-emerald-100' };
    if (score >= 50) return { bg: 'bg-amber-400', text: 'text-amber-800', lightBg: 'bg-amber-100' };
    return { bg: 'bg-error', text: 'text-on-error-container', lightBg: 'bg-error-container' };
  };

  return (
    <div className="bg-background text-on-background min-h-screen">
      
      {/* TopNavBar (Mobile) */}
      <header className="md:hidden fixed top-0 w-full flex justify-between items-center px-8 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm z-40 text-primary">
        <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">A.U.R.A</div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined cursor-pointer text-outline hover:bg-surface-container p-2 rounded-full transition-colors">notifications</span>
          <span className="material-symbols-outlined cursor-pointer text-outline hover:bg-surface-container p-2 rounded-full transition-colors">help</span>
          <img alt="Admin profile avatar" className="w-8 h-8 rounded-full ml-2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiS7Q4htnrFZC8z4wgIx0438cQxNS6MuJAgmwBLpNkZVghYdv7zOHZVVXKkowRWQTJZFfndPr-YKmlMg42A66-xr9jg2EtquRKRffTEvOauFlJCUz-Km4WRBM1ye80lt5PUe7Mtmg7c43WMkch3jox458zKqo7NlA7j3lE3NSO6NFLBLyH7xmtENfy2Enrn1ebav0BcF677VeC-Ab5vKWFK5AK416zx61t2xfRNqE1EDBl6z0L8HcibgzOreciKT6lf6IEIr-8YZDB" />
        </div>
      </header>

      {/* SideNavBar (Desktop) */}
      <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-primary font-medium p-6 gap-8 z-50">
        <div className="flex items-center gap-3">
          <img alt="A.U.R.A" className="w-10 h-10 rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtzPxdVqHqAof3GNcyMXyZMu_1sYtup3B55J5XKGHRu9zWxJWxNIS679nRCMjUmnHWrMKX1Clq0Jpvvl_mJibkhWa--uphecLyC-9heLoCrWEE8z65c91ijFfKOJPSgXmIHB_XP08vT9k7L7ELnF9feIG88_f8FRm_WzxWC5DbTkUTvupUR9Lzev6UL2HIa3aiJkU3uwr6URDYZUgXDVvVZ0CCpzGnSafD-zzwqzm_9XtnWmVdEbWoYO4QFLB7ibnIdIeFiAQMFL4b" />
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">A.U.R.A</div>
            <div className="text-[10px] text-outline uppercase tracking-wider">Intelligence Report</div>
          </div>
        </div>
        
        <button className="bg-primary-container text-on-primary w-full py-3 rounded-lg text-label-md hover:bg-surface-tint transition-colors shadow-sm">
          New Return Claim
        </button>
        
        <div className="flex flex-col gap-2 flex-grow">
          <a className="flex items-center gap-3 px-4 py-3 text-primary bg-primary-fixed/30 rounded-xl hover:bg-primary-fixed/50 transition-all duration-200" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-outline hover:bg-surface-container hover:text-primary transition-all duration-200 rounded-xl" href="#">
            <span className="material-symbols-outlined">assignment</span>
            Claim List
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-outline hover:bg-surface-container hover:text-primary transition-all duration-200 rounded-xl" href="#">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </a>
        </div>
        
        <div className="flex flex-col gap-2 mt-auto border-t border-slate-100 pt-6">
          <a className="flex items-center gap-3 px-4 py-3 text-outline hover:bg-surface-container hover:text-primary transition-all duration-200 rounded-xl" href="#">
            <span className="material-symbols-outlined">contact_support</span>
            Support
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-outline hover:bg-surface-container hover:text-primary transition-all duration-200 rounded-xl" href="#">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 md:pt-8 pb-24 md:pb-8 px-6 md:pl-72 md:pr-12 min-h-screen">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-h1 text-on-surface">Dashboard Overview</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Real-time intelligence and claim processing metrics.</p>
          </div>
          <div className="flex items-center gap-3 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant">
            <button className="px-4 py-1.5 text-sm font-medium bg-white rounded-md shadow-sm text-on-surface">Today</button>
            <button className="px-4 py-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface">7 Days</button>
            <button className="px-4 py-1.5 text-sm font-medium text-on-surface-variant hover:text-on-surface">30 Days</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          <div className="bg-surface-container-lowest p-6 rounded-[24px] antigravity-shadow border border-slate-100 flex flex-col justify-between h-[160px] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-fixed rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-on-surface-variant text-label-md">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Total Claims Today
              </div>
              <div className="text-h1 text-on-surface">142</div>
            </div>
            <div className="flex items-center text-emerald-600 text-label-sm gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-md">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12% vs yesterday
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-[24px] antigravity-shadow border border-slate-100 flex flex-col justify-between h-[160px] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary-fixed rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-on-surface-variant text-label-md">
                <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                Claims Pending Decision
              </div>
              <div className="text-h1 text-on-surface">28</div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-auto mb-1">
              <div className="bg-tertiary-container h-1.5 rounded-full w-[20%]"></div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-[24px] antigravity-shadow border border-slate-100 flex flex-col justify-between h-[160px] relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-variant rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-on-surface-variant text-label-md">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                Avg. Resolution Time
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-h1 text-on-surface">8</div>
                <div className="text-body-sm text-on-surface-variant">Mins</div>
              </div>
            </div>
            <div className="flex items-center text-emerald-600 text-label-sm gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-md">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              -2 mins vs avg
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-[24px] antigravity-shadow border border-slate-100 flex flex-col justify-between h-[160px] relative overflow-hidden group bg-gradient-to-br from-white to-primary-fixed/20">
            <div>
              <div className="flex items-center gap-2 mb-2 text-primary text-label-md">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Avg. Trust Score
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-h1 text-primary">94</div>
                <div className="text-body-sm text-primary">/100</div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-primary h-full w-[94%] rounded-full"></div>
            </div>
          </div>

        </div>

        {/* Table Area */}
        <div className="bg-surface-container-lowest rounded-[24px] antigravity-shadow border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h2 className="text-h2 text-on-surface">Daftar Klaim</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Recent return requests requiring review or automated processing.</p>
            </div>
            <button className="flex items-center gap-2 text-primary-container text-label-md hover:bg-primary-fixed/30 px-4 py-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
                  <th className="px-8 py-4 font-medium border-b border-slate-200">Claim ID</th>
                  <th className="px-8 py-4 font-medium border-b border-slate-200">Receipt No</th>
                  <th className="px-8 py-4 font-medium border-b border-slate-200">Product</th>
                  <th className="px-8 py-4 font-medium border-b border-slate-200">Date</th>
                  <th className="px-8 py-4 font-medium border-b border-slate-200">AI Trust Score</th>
                  <th className="px-8 py-4 font-medium border-b border-slate-200 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-body-sm text-on-surface divide-y divide-slate-100">
                {dummyClaims.map((claim) => {
                  const colors = getScoreColorClass(claim.score);
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedClaim(claim)}>
                      <td className="px-8 py-5 font-medium text-primary">{claim.resi}</td>
                      <td className="px-8 py-5 text-on-surface-variant">{claim.receipt}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden ${!claim.image ? 'text-slate-400' : ''}`}>
                            {claim.image ? (
                              <img src={claim.image} alt={claim.product} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined">inventory_2</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-on-surface">{claim.product}</div>
                            <div className="text-[12px] text-on-surface-variant">{claim.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-on-surface-variant">
                        {claim.date} <br /><span className="text-[12px]">{claim.time}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`${colors.bg} h-full`} style={{ width: `${claim.score}%` }}></div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${colors.lightBg} ${colors.text}`}>
                            {claim.score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-on-surface-variant hover:text-primary transition-colors p-2">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-surface-bright">
            <div className="text-sm text-on-surface-variant">Showing <span className="font-medium">1</span> to <span className="font-medium">4</span> of <span className="font-medium">28</span> results</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-outline-variant rounded-md text-sm text-on-surface-variant hover:bg-surface-container disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-outline-variant rounded-md text-sm text-on-surface-variant hover:bg-surface-container">Next</button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Overlay for Intelligence Report */}
      {selectedClaim && (
        <IntelligenceReportModal claim={selectedClaim} onClose={() => setSelectedClaim(null)} />
      )}
    </div>
  );
};

export default AdminDashboard;
