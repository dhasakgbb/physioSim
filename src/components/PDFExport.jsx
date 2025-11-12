import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { compoundData, disclaimerText, tierDescriptions } from '../data/compoundData';
import { getInteraction, getInteractionScore } from '../data/interactionMatrix';
import { getAncillaryProtocol } from '../data/sideFxAndAncillaries';

const PDFExport = ({ chartRef, stackData = null, includeInteractions = false }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      // Page 1: Title + Disclaimer
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AAS Dose-Response Models', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(14);
      pdf.text('Benefit vs. Risk Analysis', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 15;
      
      // Disclaimer
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 140, 0); // Orange
      pdf.text('⚠ HARM REDUCTION MODELING, NOT MEDICAL ADVICE', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const disclaimerLines = pdf.splitTextToSize(disclaimerText, pageWidth - 2 * margin);
      pdf.text(disclaimerLines, margin, yPosition);
      
      // Page 2: Chart
      pdf.addPage();
      yPosition = margin;
      
      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, pageHeight - 2 * margin));
        } catch (error) {
          console.error('Error capturing chart:', error);
          pdf.setFontSize(10);
          pdf.text('Chart capture failed. Please try again.', margin, yPosition);
        }
      }

      // Stack Analysis (if provided)
      if (stackData && stackData.compounds && stackData.compounds.length > 0) {
        pdf.addPage();
        yPosition = margin;
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Stack Analysis', margin, yPosition);
        yPosition += 10;
        
        // Stack composition
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Compounds & Dosing:', margin, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        stackData.compounds.forEach(comp => {
          const compound = compoundData[comp.id];
          if (compound) {
            pdf.text(`• ${compound.name}: ${comp.dose}mg/week`, margin + 3, yPosition);
            yPosition += 5;
          }
        });
        yPosition += 5;
        
        // Stack metrics
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Stack Metrics:', margin, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Benefit Score: ${stackData.totalBenefit.toFixed(1)}`, margin + 3, yPosition);
        yPosition += 5;
        pdf.text(`Total Risk Score: ${stackData.totalRisk.toFixed(1)}`, margin + 3, yPosition);
        yPosition += 5;
        pdf.text(`Benefit Synergy: ${stackData.benefitSynergy > 0 ? '+' : ''}${stackData.benefitSynergy.toFixed(1)}%`, margin + 3, yPosition);
        yPosition += 5;
        pdf.text(`Risk Synergy: ${stackData.riskSynergy > 0 ? '+' : ''}${stackData.riskSynergy.toFixed(1)}%`, margin + 3, yPosition);
        yPosition += 5;
        
        const adjustedBenefit = stackData.totalBenefit * (1 + stackData.benefitSynergy / 100);
        const adjustedRisk = stackData.totalRisk * (1 + stackData.riskSynergy / 100);
        const ratio = adjustedRisk > 0 ? (adjustedBenefit / adjustedRisk).toFixed(2) : 'N/A';
        
        pdf.text(`Adjusted Benefit/Risk Ratio: ${ratio}`, margin + 3, yPosition);
        yPosition += 10;
        
        // Interaction Matrix (if multiple compounds)
        if (includeInteractions && stackData.compounds.length > 1) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Compound Interactions:', margin, yPosition);
          yPosition += 6;
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          for (let i = 0; i < stackData.compounds.length; i++) {
            for (let j = i + 1; j < stackData.compounds.length; j++) {
              const comp1 = compoundData[stackData.compounds[i].id];
              const comp2 = compoundData[stackData.compounds[j].id];
              
              if (comp1 && comp2) {
                const interaction = getInteraction(stackData.compounds[i].id, stackData.compounds[j].id);
                const score = getInteractionScore(stackData.compounds[i].id, stackData.compounds[j].id);
                
                if (interaction) {
                  pdf.setFont('helvetica', 'bold');
                  pdf.text(`${comp1.abbreviation} + ${comp2.abbreviation}: ${score.label}`, margin + 3, yPosition);
                  yPosition += 5;
                  
                  pdf.setFont('helvetica', 'normal');
                  const descLines = pdf.splitTextToSize(interaction.description, pageWidth - 2 * margin - 6);
                  pdf.text(descLines, margin + 6, yPosition);
                  yPosition += descLines.length * 4 + 5;
                  
                  if (yPosition > pageHeight - 40) {
                    pdf.addPage();
                    yPosition = margin;
                  }
                }
              }
            }
          }
        }
        
        // Ancillary Protocol
        if (stackData.ancillaryProtocol && stackData.ancillaryProtocol.length > 0) {
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Required Ancillary Medications:', margin, yPosition);
          yPosition += 6;
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          let totalWeeklyCost = 0;
          
          stackData.ancillaryProtocol.forEach(anc => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${anc.name} (${anc.category})`, margin + 3, yPosition);
            yPosition += 5;
            
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Reason: ${anc.reason}`, margin + 6, yPosition);
            yPosition += 4;
            pdf.text(`Dosing: ${anc.dosing}`, margin + 6, yPosition);
            yPosition += 4;
            
            if (anc.weeklyCost) {
              pdf.text(`Weekly Cost: $${anc.weeklyCost.toFixed(2)}`, margin + 6, yPosition);
              yPosition += 4;
              totalWeeklyCost += anc.weeklyCost;
            }
            
            yPosition += 3;
            
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = margin;
            }
          });
          
          if (totalWeeklyCost > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Total Estimated Weekly Cost: $${totalWeeklyCost.toFixed(2)}`, margin + 3, yPosition);
            yPosition += 8;
          }
        }
      }

      // Evidence Hierarchy Legend
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Evidence Hierarchy Legend', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      Object.entries(tierDescriptions).forEach(([tier, description]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(tier, margin, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(description, pageWidth - 2 * margin - 5);
        pdf.text(descLines, margin + 5, yPosition);
        yPosition += descLines.length * 5 + 5;
        
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }
      });

      // Pages 4+: Per-Compound Methodology
      Object.entries(compoundData).forEach(([key, compound]) => {
        pdf.addPage();
        yPosition = margin;
        
        // Title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${compound.name} (${compound.abbreviation})`, margin, yPosition);
        yPosition += 10;
        
        // Summary
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Evidence Summary:', margin, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const summaryLines = pdf.splitTextToSize(compound.methodology.summary, pageWidth - 2 * margin);
        pdf.text(summaryLines, margin, yPosition);
        yPosition += summaryLines.length * 4 + 8;
        
        // Benefit Rationale
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Benefit Curve:', margin, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const benefitLines = pdf.splitTextToSize(compound.methodology.benefitRationale, pageWidth - 2 * margin);
        pdf.text(benefitLines, margin, yPosition);
        yPosition += benefitLines.length * 4 + 8;
        
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Risk Rationale
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Risk Curve:', margin, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const riskLines = pdf.splitTextToSize(compound.methodology.riskRationale, pageWidth - 2 * margin);
        pdf.text(riskLines, margin, yPosition);
        yPosition += riskLines.length * 4 + 8;
        
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Sources
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Key Sources:', margin, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        compound.methodology.sources.forEach(source => {
          const sourceLines = pdf.splitTextToSize(`• ${source}`, pageWidth - 2 * margin - 3);
          pdf.text(sourceLines, margin + 3, yPosition);
          yPosition += sourceLines.length * 4 + 2;
        });
        yPosition += 5;
        
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Limitations
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Key Limitations:', margin, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        compound.methodology.limitations.forEach(limitation => {
          const limitLines = pdf.splitTextToSize(`• ${limitation}`, pageWidth - 2 * margin - 3);
          pdf.text(limitLines, margin + 3, yPosition);
          yPosition += limitLines.length * 4 + 2;
        });
      });

      // Save PDF
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      pdf.save(`AAS_DoseResponse_Report_${date}.pdf`);
      
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
        isExporting
          ? 'bg-gray-400 text-physio-text-secondary cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
      }`}
    >
      {isExporting ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        </span>
      ) : (
        '📄 Export PDF Report'
      )}
    </button>
  );
};

export default PDFExport;

