import React, { useState } from 'react';
import { compoundData } from '../data/compoundData';
import { sideEffectCategories } from '../data/sideFxAndAncillaries';

/**
 * Side Effect Profile Component
 * Displays detailed side effect breakdown for a selected compound
 */
const SideEffectProfile = () => {
  const [selectedCompound, setSelectedCompound] = useState('testosterone');
  
  const compound = compoundData[selectedCompound];
  const sideEffects = compound?.sideEffectProfile;
  
  if (!compound || !sideEffects) {
    return (
      <div className="w-full p-6 bg-physio-bg-secondary rounded-lg shadow-sm border border-physio-bg-border">
        <p className="text-physio-text-tertiary">Select a compound to view its side effect profile.</p>
      </div>
    );
  }
  
  // Separate compounds into injectables and orals
  const compounds = Object.keys(compoundData);
  const injectables = compounds.filter(key => compoundData[key].type === 'injectable');
  const orals = compounds.filter(key => compoundData[key].type === 'oral');
  
  return (
    <div className="w-full space-y-6">
      {/* Compound Selector */}
      <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
        <label className="block text-sm font-medium text-physio-text-secondary mb-2">
          Select Compound
        </label>
        <select
          value={selectedCompound}
          onChange={(e) => setSelectedCompound(e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 border border-physio-bg-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <optgroup label="Injectable Compounds">
            {injectables.map(key => (
              <option key={key} value={key}>
                {compoundData[key].name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Oral Compounds">
            {orals.map(key => (
              <option key={key} value={key}>
                {compoundData[key].name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      
      {/* Compound Header */}
      <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: compound.color }}
          ></div>
          <h2 className="text-3xl font-bold text-physio-text-primary">{compound.name}</h2>
          <span className="px-3 py-1 bg-physio-bg-tertiary rounded-full text-sm font-medium text-physio-text-secondary">
            {compound.type === 'oral' ? 'Oral' : 'Injectable'}
          </span>
        </div>
        {compound.usagePattern && (
          <p className="text-physio-text-secondary">
            <strong>Typical Usage:</strong> {compound.usagePattern}
          </p>
        )}
      </div>
      
      {/* Common Side Effects */}
      {sideEffects.common && sideEffects.common.length > 0 && (
        <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
          <h3 className="text-xl font-semibold mb-4 text-physio-text-primary">Common Side Effects</h3>
          <div className="space-y-4">
            {sideEffects.common.map((side, idx) => (
              <div key={idx} className="p-4 bg-physio-bg-core rounded-lg border border-physio-bg-border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-physio-text-primary text-lg">{side.name}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      side.severity === 'positive' ? 'bg-physio-accent-mint text-physio-bg-core' :
                      side.severity === 'low' ? 'bg-physio-accent-cyan text-physio-bg-core' :
                      side.severity === 'low-medium' || side.severity === 'medium' ? 'bg-physio-warning text-physio-bg-core' :
                      side.severity === 'medium-high' || side.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {side.severity}
                  </span>
                </div>
                <div className="text-sm text-physio-text-secondary space-y-1">
                  <div><strong>Onset:</strong> {side.onset}</div>
                  {side.doseDependent !== undefined && (
                    <div>
                      <strong>Dose-Dependent:</strong> {
                        side.doseDependent === true ? 'Yes' :
                        side.doseDependent === false ? 'No' :
                        side.doseDependent
                      }
                    </div>
                  )}
                  <div className="mt-2 text-physio-text-primary">
                    <strong>Management:</strong> {side.management}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Lipid Profile Impact */}
      {sideEffects.lipidProfile && (
        <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
          <h3 className="text-xl font-semibold mb-4 text-physio-text-primary">Lipid Profile Impact</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">HDL Decline:</span>
              <span className="text-physio-text-primary">{sideEffects.lipidProfile.hdlDecline}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">LDL Increase:</span>
              <span className="text-physio-text-primary">{sideEffects.lipidProfile.ldlIncrease}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">Triglycerides:</span>
              <span className="text-physio-text-primary">{sideEffects.lipidProfile.triglycerides}</span>
            </div>
            <div className="mt-4 p-3 bg-physio-bg-tertiary rounded">
              <strong className="text-blue-900">Management:</strong>
              <p className="text-physio-text-secondary mt-1">{sideEffects.lipidProfile.management}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Cardiovascular Impact */}
      {sideEffects.cardiovascular && (
        <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
          <h3 className="text-xl font-semibold mb-4 text-physio-text-primary">Cardiovascular Impact</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">Blood Pressure:</span>
              <span className="text-physio-text-primary">{sideEffects.cardiovascular.bloodPressure}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">LVH (Left Ventricular Hypertrophy):</span>
              <span className="text-physio-text-primary">{sideEffects.cardiovascular.lvh}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">RBC/Hematocrit:</span>
              <span className="text-physio-text-primary">{sideEffects.cardiovascular.rbc}</span>
            </div>
            <div className="mt-4 p-3 bg-physio-bg-tertiary rounded">
              <strong className="text-blue-900">Management:</strong>
              <p className="text-physio-text-secondary mt-1">{sideEffects.cardiovascular.management}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Hepatic Impact (Orals) */}
      {sideEffects.hepatic && (
        <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
          <h3 className="text-xl font-semibold mb-4 text-red-800">⚠️ Hepatic (Liver) Impact</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">ALT/AST Elevation:</span>
              <span className="text-red-700 font-semibold">{sideEffects.hepatic.altAstElevation}</span>
            </div>
            {sideEffects.hepatic.cholestasis && (
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary font-medium">Cholestasis Risk:</span>
                <span className="text-red-700 font-semibold">{sideEffects.hepatic.cholestasis}</span>
              </div>
            )}
            <div className="mt-4 p-3 bg-physio-bg-tertiary rounded">
              <strong className="text-red-900">Management:</strong>
              <p className="text-physio-text-secondary mt-1">{sideEffects.hepatic.management}</p>
            </div>
            {sideEffects.hepatic.reversibility && (
              <div className="p-3 bg-physio-bg-tertiary rounded">
                <strong className="text-yellow-900">Reversibility:</strong>
                <p className="text-physio-text-secondary mt-1">{sideEffects.hepatic.reversibility}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Psychological Impact (Tren, Halo, etc) */}
      {sideEffects.psychological && (
        <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
          <h3 className="text-xl font-semibold mb-4 text-purple-800">Psychological Impact</h3>
          <div className="space-y-3">
            {sideEffects.psychological.aggression && (
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary font-medium">Aggression:</span>
                <span className="text-physio-text-primary">{sideEffects.psychological.aggression}</span>
              </div>
            )}
            {sideEffects.psychological.mood && (
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary font-medium">Mood:</span>
                <span className="text-physio-text-primary">{sideEffects.psychological.mood}</span>
              </div>
            )}
            {sideEffects.psychological.sleep && (
              <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
                <span className="text-physio-text-secondary font-medium">Sleep:</span>
                <span className="text-physio-text-primary">{sideEffects.psychological.sleep}</span>
              </div>
            )}
            <div className="mt-4 p-3 bg-purple-50 rounded">
              <strong className="text-purple-900">Management:</strong>
              <p className="text-physio-text-secondary mt-1">{sideEffects.psychological.management}</p>
            </div>
            {sideEffects.psychological.note && (
              <div className="p-3 bg-physio-bg-tertiary rounded">
                <strong className="text-yellow-900">Note:</strong>
                <p className="text-physio-text-secondary mt-1">{sideEffects.psychological.note}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* HPTA Suppression */}
      {sideEffects.hpta && (
        <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
          <h3 className="text-xl font-semibold mb-4 text-physio-text-primary">HPTA Suppression & Recovery</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">Suppression Level:</span>
              <span className="text-physio-text-primary">{sideEffects.hpta.suppression}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">Recovery Timeline:</span>
              <span className="text-physio-text-primary">{sideEffects.hpta.recovery}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-physio-bg-border">
              <span className="text-physio-text-secondary font-medium">PCT Required:</span>
              <span className={`font-semibold ${sideEffects.hpta.pctRequired ? 'text-physio-error' : 'text-physio-accent-mint'}`}>
                {sideEffects.hpta.pctRequired ? 'Yes (Essential)' : 'No'}
              </span>
            </div>
            <div className="mt-4 p-3 bg-physio-bg-tertiary rounded">
              <strong className="text-blue-900">PCT Management:</strong>
              <p className="text-physio-text-secondary mt-1">{sideEffects.hpta.management}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Related Categories */}
      <div className="bg-physio-bg-secondary p-6 rounded-lg shadow-sm border border-physio-bg-border">
        <h3 className="text-xl font-semibold mb-4 text-physio-text-primary">Side Effect Category Context</h3>
        <div className="space-y-4">
          {Object.entries(sideEffectCategories).map(([key, category]) => {
            const isRelevant = category.compounds.includes(selectedCompound) || category.compounds.includes('all_compounds');
            if (!isRelevant) return null;
            
            return (
              <div key={key} className="p-4 bg-physio-bg-core rounded-lg border border-physio-bg-border">
                <h4 className="font-semibold text-physio-text-primary mb-2">{category.name}</h4>
                <p className="text-sm text-physio-text-secondary mb-3">{category.description}</p>
                {category.sides && category.sides.length > 0 && (
                  <div className="text-sm text-physio-text-secondary">
                    <strong>Key Concerns:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {category.sides.slice(0, 3).map((side, idx) => (
                        <li key={idx}>{side.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SideEffectProfile;

