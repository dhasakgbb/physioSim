import React, { useState } from 'react';
import { ancillaries } from '../data/sideFxAndAncillaries';

/**
 * Ancillary Calculator Component
 * Reference guide for ancillary medications with detailed information
 */
const AncillaryCalculator = () => {
  const [expandedDrug, setExpandedDrug] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Get unique categories
  const categories = [...new Set(Object.values(ancillaries).map(drug => drug.category))];
  
  // Filter drugs by category
  const filteredDrugs = Object.entries(ancillaries).filter(([key, drug]) => {
    if (filterCategory === 'all') return true;
    return drug.category === filterCategory;
  });
  
  // Group by category for display
  const drugsByCategory = {};
  filteredDrugs.forEach(([key, drug]) => {
    if (!drugsByCategory[drug.category]) {
      drugsByCategory[drug.category] = [];
    }
    drugsByCategory[drug.category].push({ key, ...drug });
  });
  
  const getCategoryColor = (category) => {
    const colors = {
      aromatase_inhibitor: 'blue',
      serm: 'purple',
      dopamine_agonist: 'green',
      liver_support: 'red',
      blood_pressure: 'orange',
      lipid_support: 'yellow',
      hpta_support: 'indigo'
    };
    return colors[category] || 'gray';
  };
  
  const getCategoryLabel = (category) => {
    const labels = {
      aromatase_inhibitor: 'Aromatase Inhibitors (AI)',
      serm: 'SERMs (PCT & Gyno)',
      dopamine_agonist: 'Dopamine Agonists (Prolactin)',
      liver_support: 'Liver Support (Orals)',
      blood_pressure: 'Blood Pressure Management',
      lipid_support: 'Lipid Support',
      hpta_support: 'HPTA Support (HCG)'
    };
    return labels[category] || category;
  };
  
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
        <h2 className="text-3xl font-bold mb-3 text-physio-text-primary">Ancillary Medications Reference</h2>
        <p className="text-physio-text-secondary">
          Comprehensive guide to ancillary medications used for harm reduction during AAS cycles.
          Click any drug for detailed information including dosing, mechanism, sides, and cost.
        </p>
      </div>
      
      {/* Category Filter */}
      <div className="bg-physio-bg-secondary p-4 rounded-lg shadow-sm border border-physio-bg-border">
        <label className="block text-sm font-medium text-physio-text-secondary mb-2">
          Filter by Category
        </label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 bg-physio-bg-tertiary text-physio-text-primary border border-physio-bg-border rounded-md focus:outline-none focus:ring-2 focus:ring-physio-accent-cyan transition-standard"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {getCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>
      
      {/* Drugs by Category */}
      {Object.entries(drugsByCategory).map(([category, drugs]) => {
        const color = getCategoryColor(category);
        
        return (
          <div key={category} className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
            <h3 className={`text-2xl font-semibold mb-4 text-${color}-700`}>
              {getCategoryLabel(category)}
            </h3>
            <div className="space-y-3">
              {drugs.map(drug => {
                const isExpanded = expandedDrug === drug.key;
                
                return (
                  <div
                    key={drug.key}
                    className={`border-2 rounded-lg transition-all ${
                      isExpanded
                        ? `border-${color}-400 shadow-md`
                        : 'border-physio-bg-border hover:border-physio-bg-border'
                    }`}
                  >
                    {/* Drug Header (Collapsible) */}
                    <div
                      onClick={() => setExpandedDrug(isExpanded ? null : drug.key)}
                      className={`p-4 cursor-pointer flex justify-between items-center ${
                        isExpanded ? `bg-${color}-50` : 'bg-physio-bg-secondary hover:bg-physio-bg-tertiary'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-physio-text-primary">{drug.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium bg-${color}-100 text-${color}-800`}>
                            {drug.type || getCategoryLabel(drug.category)}
                          </span>
                        </div>
                        {drug.cost && (
                          <p className="text-sm text-physio-text-secondary mt-1">
                            Estimated Cost: <strong>${drug.cost.weekly}/week</strong>
                            {drug.cost.note && ` • ${drug.cost.note}`}
                          </p>
                        )}
                      </div>
                      <button className="ml-4 text-2xl text-physio-text-tertiary">
                        {isExpanded ? '−' : '+'}
                      </button>
                    </div>
                    
                    {/* Expanded Drug Details */}
                    {isExpanded && (
                      <div className="p-4 border-t border-physio-bg-border space-y-4">
                        {/* Mechanism */}
                        {drug.mechanism && (
                          <div>
                            <h5 className="font-semibold text-physio-text-primary mb-2">Mechanism of Action</h5>
                            <p className="text-physio-text-secondary text-sm">{drug.mechanism}</p>
                          </div>
                        )}
                        
                        {/* Dosing */}
                        {drug.dosing && (
                          <div className={`p-3 bg-${color}-50 rounded-lg`}>
                            <h5 className="font-semibold text-physio-text-primary mb-2">Dosing Protocols</h5>
                            {typeof drug.dosing === 'object' ? (
                              <div className="space-y-2">
                                {Object.entries(drug.dosing).map(([level, dose]) => (
                                  <div key={level} className="text-sm">
                                    <span className="font-medium capitalize text-physio-text-secondary">
                                      {level.replace(/_/g, ' ')}:
                                    </span>
                                    <span className="ml-2 text-physio-text-primary">{dose}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-physio-text-secondary">{drug.dosing}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Side Effects */}
                        {drug.sides && (
                          <div>
                            <h5 className="font-semibold text-physio-text-primary mb-2">Potential Side Effects</h5>
                            <p className="text-physio-text-secondary text-sm">{drug.sides}</p>
                          </div>
                        )}
                        
                        {/* Caution */}
                        {drug.caution && (
                          <div className="p-3 bg-physio-bg-tertiary border-l-4 border-physio-warning">
                            <h5 className="font-semibold text-physio-warning mb-1">⚠️ Caution</h5>
                            <p className="text-physio-text-secondary text-sm">{drug.caution}</p>
                          </div>
                        )}
                        
                        {/* Availability */}
                        {drug.availability && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-physio-text-secondary">Availability:</span>
                            <span className="text-physio-text-primary">{drug.availability}</span>
                          </div>
                        )}
                        
                        {/* Bloodwork Target */}
                        {drug.bloodworkTarget && (
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <h5 className="font-semibold text-purple-900 mb-1">Bloodwork Target</h5>
                            <p className="text-physio-text-secondary text-sm">{drug.bloodworkTarget}</p>
                          </div>
                        )}
                        
                        {/* Advantages */}
                        {drug.advantages && (
                          <div className="p-3 bg-physio-bg-tertiary rounded-lg">
                            <h5 className="font-semibold text-green-900 mb-1">Advantages</h5>
                            <p className="text-physio-text-secondary text-sm">{drug.advantages}</p>
                          </div>
                        )}
                        
                        {/* Protocol/Note */}
                        {drug.protocol && (
                          <div className="text-sm text-physio-text-secondary">
                            <strong>Protocol Note:</strong> {drug.protocol}
                          </div>
                        )}
                        
                        {/* Purpose/Note */}
                        {drug.note && !drug.caution && (
                          <div className="p-3 bg-physio-bg-core rounded">
                            <p className="text-physio-text-secondary text-sm">{drug.note}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {/* General Guidelines */}
      <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
        <h3 className="text-xl font-semibold mb-4 text-physio-text-primary">General Harm Reduction Guidelines</h3>
        <div className="space-y-4 text-physio-text-secondary">
          <div className="p-4 bg-physio-bg-tertiary rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Aromatase Inhibitors (AI)</h4>
            <p className="text-sm">
              Essential for compounds that aromatize (Test, Dbol, Anadrol). Start low and titrate based on symptoms
              and bloodwork. Crashing estrogen (E2) causes worse sides than high E2. Target E2: 20-30 pg/mL (sensitive assay).
            </p>
          </div>
          
          <div className="p-4 bg-physio-bg-tertiary rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Dopamine Agonists</h4>
            <p className="text-sm">
              Mandatory for 19-nor compounds (NPP, Tren) to prevent prolactin-induced sexual dysfunction ("deca dick").
              Cabergoline is gold standard. Monitor prolactin levels via bloodwork (target &lt;15 ng/mL).
            </p>
          </div>
          
          <div className="p-4 bg-physio-bg-tertiary rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">Liver Support (Orals)</h4>
            <p className="text-sm">
              TUDCA is NON-NEGOTIABLE for all oral AAS use. Take 3 hours after oral dose for maximum effectiveness.
              NAC is excellent adjunct. Monitor ALT/AST every 3-4 weeks on orals. Discontinue if &gt;3x upper limit.
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">Cardiovascular Support</h4>
            <p className="text-sm">
              Blood pressure management (ARBs, ACE inhibitors) essential if BP &gt;140/90. Lipid support (fish oil, statins)
              critical for all cycles, especially orals and Tren. Monitor BP 3x/week at home. Lipid panels every 6-8 weeks.
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">PCT (Post-Cycle Therapy)</h4>
            <p className="text-sm">
              SERMs (Nolvadex, Clomid) essential for HPTA restart after cycle. HCG during cycle makes PCT easier and faster.
              Extended PCT needed for 19-nors (4-6 months recovery typical). Bloodwork post-cycle to verify recovery (Total T, Free T, LH, FSH).
            </p>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="bg-physio-bg-tertiary border-l-4 border-physio-warning p-4">
        <h3 className="text-lg font-semibold text-physio-warning mb-2">⚠️ Important Disclaimer</h3>
        <p className="text-physio-text-secondary text-sm">
          This information is for educational purposes only and does not constitute medical advice.
          Ancillary medications may require prescriptions and should be used under medical supervision.
          Individual responses vary significantly. Consult a healthcare provider before using any medications.
          Dosing information represents harm reduction guidelines, not medical recommendations.
        </p>
      </div>
    </div>
  );
};

export default AncillaryCalculator;

