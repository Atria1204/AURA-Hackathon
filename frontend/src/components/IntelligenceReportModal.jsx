import React from 'react';

const IntelligenceReportModal = ({ claim, onClose }) => {
  if (!claim) return null;

  // Derive some values from the dummy claim or use defaults
  const riskScore = Math.floor((100 - claim.score) / 10); // 1-10 scale based on 100% trust score
  const isHighRisk = riskScore > 5;
  const isMediumRisk = riskScore > 2 && riskScore <= 5;
  const riskLabel = isHighRisk ? 'High Risk' : (isMediumRisk ? 'Medium Risk' : 'Low Risk');
  const riskColor = isHighRisk ? 'text-[#ef4444]' : (isMediumRisk ? 'text-[#eab308]' : 'text-[#16a34a]');
  const riskBg = isHighRisk ? 'bg-[#ef4444]/10' : (isMediumRisk ? 'bg-[#eab308]/10' : 'bg-[#16a34a]/10');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-background rounded-[32px] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-h1 text-on-background">Claim Detail Panel</h1>
              <p className="text-body-md text-on-surface-variant mt-2">Claim ID: {claim.resi} • User: Budi Santoso</p>
            </div>
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-outline hover:text-primary transition-colors duration-200 text-label-md bg-surface-container-low px-4 py-2 rounded-full"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
              Close Panel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Visual Evidence (2/3 width) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Image Comparison Card */}
              <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-outline-variant/20">
                <h3 className="text-h3 text-on-background mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">image_search</span>
                  Visual Evidence
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  
                  {/* Customer Photo */}
                  <div className="flex flex-col gap-3">
                    <div className="relative group rounded-xl overflow-hidden bg-surface-container aspect-square border border-outline-variant/30">
                      <img alt="Customer uploaded photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0H4P2MD_-CKMW9_X2SbZloOsOvqzdeJVHOAIHfnC3Xs6oNiJGiqOw4143FEdQKi0sLHpSCHApSaF-zqcKL87jD5IPq4HC1Ys7ShD5TBnS_sBlgGmP6xcvW9c-x0Jq_iABaSqmLywaOje1N4z_055dFFXaDfJxmZv5sK53FQ980MIgMrOPE3EDuBHzAL3lgeSgcsQykgLrseakP6nBw2ORpv_DgljG6q2riTWZPgxbFizXgKHT_8vh7I1PwZtQ6fGmkC3sGA6mE7TB" />
                      <div className="absolute top-3 left-3 bg-error text-on-error text-label-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
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
                    <div className="relative rounded-xl overflow-hidden bg-surface-container aspect-square border border-outline-variant/30">
                      <img alt="Catalog reference photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjrfxsiea34M4FhzGGbtTytniuozxDRP6Js4zpkreRf46dHPqpHecZrHe5HAP2JbY6GdzSQEfc9f7G_wR92OwAOdoz_T-tkjkVoDMRjGR943Pn1Ybd3FigNh1SlyrbzHqBjzsNWPu5DscbDDyyIN-AdMNIJFY_9MnqSHsf0if7KUfdD6JcjW-s5VLLSIebyu7-3amOA8YLX-7rSb3nlwTwiVHiSXLjBoLqdhX_ysbWLJWF634f1SHiWTwlD3k3ZPLLyDKdJ3kSYCB8" />
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-label-md text-on-background">Catalog Reference</span>
                      <span className="text-body-sm text-outline">SKU: SNK-RD-042</span>
                    </div>
                  </div>

                  {/* Unboxing Video */}
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-square border border-outline-variant/30 flex items-center justify-center group cursor-pointer">
                      <span className="material-symbols-outlined text-white text-[64px] opacity-80 group-hover:opacity-100 transition-opacity">play_circle</span>
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-label-sm px-2 py-1 rounded">0:45</div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-label-md text-on-background">Unboxing Video</span>
                      <span className="text-body-sm text-outline">Oct 24, 14:32</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* AI Recommendation Box */}
              <div className="bg-surface-container-low rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-primary/20 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                <h3 className="text-h3 text-on-background mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  A.U.R.A Recommendation
                </h3>
                <div className="flex gap-4 items-start">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[24px]">insights</span>
                  </div>
                  <div>
                    <p className="text-body-lg text-on-background">
                      Cacat minor terdeteksi. Rekomendasi: <span className="font-bold text-primary">Kompensasi Parsial Rp 50.000</span>
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      Analysis indicates visual inconsistency matches customer description, but does not warrant full return based on low risk score.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Intelligence Report (1/3 width) */}
            <div className="flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-outline-variant/20 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-outline-variant/20">
                  <h3 className="text-h3 text-on-background flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">policy</span>
                    Intelligence Report
                  </h3>
                </div>

                {/* Risk Score */}
                <div className="flex flex-col items-center justify-center py-6 mb-8 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <span className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Overall Risk Score</span>
                  <div className={`text-[48px] leading-none font-bold ${riskColor} flex items-baseline gap-1`}>
                    {riskScore}<span className="text-[24px] text-outline font-medium">/10</span>
                  </div>
                  <span className={`text-label-md ${riskColor} ${riskBg} px-3 py-1 rounded-full mt-3`}>{riskLabel}</span>
                </div>

                {/* Trust Signals */}
                <div className="flex flex-col gap-5 flex-1">
                  <span className="text-label-md text-on-background mb-1">Trust Signals Breakdown</span>
                  
                  {/* S1 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-label-sm text-on-surface-variant">S1 (Time Gap)</span>
                      <span className="text-label-sm text-on-background">Pass</span>
                    </div>
                    <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#16a34a] rounded-full w-[90%]"></div>
                    </div>
                  </div>

                  {/* S2 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-label-sm text-on-surface-variant">S2 (Repeat Claim)</span>
                      <span className="text-label-sm text-on-background">Pass</span>
                    </div>
                    <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#16a34a] rounded-full w-[100%]"></div>
                    </div>
                  </div>

                  {/* S3 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-label-sm text-on-surface-variant">S3 (Visual Inconsistency)</span>
                      <span className="text-label-sm text-error">Flagged</span>
                    </div>
                    <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#eab308] rounded-full w-[40%]"></div>
                    </div>
                  </div>

                  {/* S4 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-label-sm text-on-surface-variant">S4 (Text-Visual Mismatch)</span>
                      <span className="text-label-sm text-on-background">Pass</span>
                    </div>
                    <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div className="h-full bg-[#16a34a] rounded-full w-[85%]"></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row justify-end gap-4 pb-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-label-md bg-white text-error border border-error/20 hover:bg-error/5 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">block</span>
              Tolak Klaim
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-3 rounded-xl text-label-md bg-[#16a34a] text-white shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:bg-[#15803d] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Terima & Refund
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IntelligenceReportModal;
