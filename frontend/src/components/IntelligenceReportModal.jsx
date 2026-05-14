import React from 'react';

const IntelligenceReportModal = ({ claim, onClose }) => {
  if (!claim) return null;

  const riskScore = Math.floor((100 - claim.score) / 10);
  const isHighRisk = riskScore > 5;
  const isMediumRisk = riskScore > 2 && riskScore <= 5;
  const riskLabel = isHighRisk ? 'High Risk' : isMediumRisk ? 'Medium Risk' : 'Low Risk';
  const riskColor = isHighRisk ? 'text-red-500' : isMediumRisk ? 'text-amber-500' : 'text-[#059669]';
  const riskBg = isHighRisk ? 'bg-red-50 text-red-600 border-red-200' : isMediumRisk ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-[#059669]/10 text-[#059669] border-[#059669]/20';

  const signals = [
    { label: 'S1 (Time Gap)', status: 'Pass', width: '90%', color: '#059669' },
    { label: 'S2 (Repeat Claim)', status: 'Pass', width: '100%', color: '#059669' },
    { label: 'S3 (Visual Inconsistency)', status: 'Flagged', width: '40%', color: '#d97706' },
    { label: 'S4 (Text-Visual Mismatch)', status: 'Pass', width: '85%', color: '#059669' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200/40"
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">

          <div className="flex items-center justify-between mb-8 bg-white p-6 border border-[#cbd5e1]/50 rounded-2xl shadow-sm">
            <div>
              <h1 className="text-h1 text-[#0f172a]">Claim Detail Panel</h1>
              <p className="text-body-md text-[#475569] mt-2">
                Claim ID: {claim.resi} • User: Budi Santoso
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
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0H4P2MD_-CKMW9_X2SbZloOsOvqzdeJVHOAIHfnC3Xs6oNiJGiqOw4143FEdQKi0sLHpSCHApSaF-zqcKL87jD5IPq4HC1Ys7ShD5TBnS_sBlgGmP6xcvW9c-x0Jq_iABaSqmLywaOje1N4z_055dFFXaDfJxmZv5sK53FQ980MIgMrOPE3EDuBHzAL3lgeSgcsQykgLrseakP6nBw2ORpv_DgljG6q2riTWZPgxbFizXgKHT_8vh7I1PwZtQ6fGmkC3sGA6mE7TB"
                      />
                      <div className="absolute top-3 left-3 bg-[#ba1a1a] text-white text-label-sm px-3 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span> Minor Scuff
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-label-md text-on-background">Customer Upload</span>
                      <span className="text-body-sm text-outline">Oct 24, 14:30</span>
                    </div>
                  </div>

                  {/* Catalog Photo */}
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square border border-slate-200/60">
                      <img
                        alt="Catalog reference photo"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjrfxsiea34M4FhzGGbtTytniuozxDRP6Js4zpkreRf46dHPqpHecZrHe5HAP2JbY6GdzSQEfc9f7G_wR92OwAOdoz_T-tkjkVoDMRjGR943Pn1Ybd3FigNh1SlyrbzHqBjzsNWPu5DscbDDyyIN-AdMNIJFY_9MnqSHsf0if7KUfdD6JcjW-s5VLLSIebyu7-3amOA8YLX-7rSb3nlwTwiVHiSXLjBoLqdhX_ysbWLJWF634f1SHiWTwlD3k3ZPLLyDKdJ3kSYCB8"
                      />
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-label-md text-on-background">Catalog Reference</span>
                      <span className="text-body-sm text-outline">SKU: SNK-RD-042</span>
                    </div>
                  </div>

                  {/* Unboxing Video */}
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-square border border-slate-200/60 flex items-center justify-center group cursor-pointer">
                      <span className="material-symbols-outlined text-white text-[64px] opacity-80 group-hover:opacity-100 transition-opacity">play_circle</span>
                      <div className="absolute bottom-3 right-3 bg-black/80 text-white text-label-sm px-2 py-1 rounded-lg">0:45</div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-label-md text-on-background">Unboxing Video</span>
                      <span className="text-body-sm text-outline">Oct 24, 14:32</span>
                    </div>
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
                      Cacat minor terdeteksi. Rekomendasi:{' '}
                      <span className="font-bold text-[#1a3a3a]">Kompensasi Parsial Rp 50.000</span>
                    </p>
                    <p className="text-body-sm text-[#475569] mt-2">
                      Analysis indicates visual inconsistency matches customer description, but does not warrant full return based on low risk score.
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
                  <div className={`text-[48px] leading-none font-bold ${riskColor} flex items-baseline gap-1`}>
                    {riskScore}<span className="text-[24px] text-[#94a3b8] font-medium">/10</span>
                  </div>
                  <span className={`text-label-md px-3 py-1 rounded-lg mt-3 border ${riskBg}`}>{riskLabel}</span>
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
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-label-md bg-white text-[#ba1a1a] border border-[#ba1a1a] hover:bg-red-50 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">block</span>
              Tolak Klaim
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl text-label-md bg-[#059669] text-white hover:bg-[#047857] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#059669]/20"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Terima &amp; Refund
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IntelligenceReportModal;
