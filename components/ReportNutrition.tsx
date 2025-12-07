
import React, { useState } from 'react';
import { Filter, Printer } from 'lucide-react';

interface ReportNutritionProps {
  activeOrgId?: string;
}

export const ReportNutrition: React.FC<ReportNutritionProps> = ({ activeOrgId }) => {
  const [fiscalYear, setFiscalYear] = useState('2081/82');
  const [selectedMonth, setSelectedMonth] = useState('Falgun (फाल्गुन)');

  const fiscalYears = ['2080/81', '2081/82', '2082/83'];
  const nepaliMonths = [
    "Baisakh (बैशाख)", "Jestha (जेष्ठ)", "Ashad (आषाढ)", "Shrawan (श्रावण)", 
    "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)", 
    "Poush (पुष)", "Magh (माघ)", "Falgun (फाल्गुन)", "Chaitra (चैत्र)"
  ];

  // Table 1 Data: Growth Monitoring (Row: First Visit / Revisit, Col: 2-7)
  const [gmData, setGmData] = useState<Record<string, Record<number, string>>>({
     'FIRST': {},
     'REVISIT': {}
  });

  // Table 2 Data: GM Summary (Row: Total, Col: 8-9)
  const [gmSummary, setGmSummary] = useState<{col8: string, col9: string}>({
     col8: '', col9: ''
  });

  // Table 3 Data: Micronutrients (Row: Total, Col: 10-20)
  const [microData, setMicroData] = useState<Record<number, string>>({});

  const handleGmChange = (row: 'FIRST'|'REVISIT', col: number, val: string) => {
     setGmData(prev => ({
        ...prev, [row]: { ...prev[row], [col]: val }
     }));
  };

  const handleMicroChange = (col: number, val: string) => {
     setMicroData(prev => ({ ...prev, [col]: val }));
  };

  const handlePrint = () => {
     window.print();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 bg-white min-h-screen font-sans text-slate-800">
       
       {/* Controls */}
       <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
          <div className="flex gap-4 items-center">
             <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select 
                   className="p-2 border rounded bg-white text-sm"
                   value={fiscalYear}
                   onChange={(e) => setFiscalYear(e.target.value)}
                >
                   {fiscalYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select 
                   className="p-2 border rounded bg-white text-sm"
                   value={selectedMonth}
                   onChange={(e) => setSelectedMonth(e.target.value)}
                >
                   {nepaliMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
             </div>
          </div>
          <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-slate-900">
             <Printer className="w-4 h-4" /> Print Report
          </button>
       </div>

       {/* REPORT BODY */}
       <div className="p-4 md:p-8 overflow-x-auto">
          
          {/* Header */}
          <div className="w-full bg-blue-100 border border-blue-200 text-center py-2 mb-1 font-bold text-lg text-blue-900">
             ३. पोषण कार्यक्रम
          </div>

          <div className="flex flex-col xl:flex-row gap-1 border border-slate-400 p-1">
             
             {/* LEFT TABLE: GROWTH MONITORING */}
             <div className="flex-1 min-w-[600px]">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center h-full">
                   <thead className="bg-orange-200 text-slate-900">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-2 w-32">यस महिनामा बृद्धि अनुगमनका लागि दर्ता भएका बच्चा</th>
                         <th colSpan={6} className="border border-slate-400 p-1">बृद्धि अनुगमन गरिएका बालबालिकाहरुको पोषण स्थिति</th>
                      </tr>
                      <tr>
                         <th colSpan={3} className="border border-slate-400 p-1">०-११ महिना</th>
                         <th colSpan={3} className="border border-slate-400 p-1">१२-२३ महिना</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1">१</th>
                         <th className="border border-slate-400 p-1 w-16">सामान्य</th>
                         <th className="border border-slate-400 p-1 w-16">जोखिम</th>
                         <th className="border border-slate-400 p-1 w-16">अति जोखिम</th>
                         <th className="border border-slate-400 p-1 w-16">सामान्य</th>
                         <th className="border border-slate-400 p-1 w-16">जोखिम</th>
                         <th className="border border-slate-400 p-1 w-16">अति जोखिम</th>
                      </tr>
                      <tr className="bg-gray-200">
                         <td className="border border-slate-400 p-1"></td>
                         {[2,3,4,5,6,7].map(i => <td key={i} className="border border-slate-400 p-1">{i}</td>)}
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50 font-bold">पहिलो पटक भेट</td>
                         {[2,3,4,5,6,7].map(i => (
                            <td key={i} className="border border-slate-400 p-1">
                               <input className="w-full text-center border-none outline-none focus:bg-yellow-100" 
                                  value={gmData.FIRST[i] || ''} onChange={e => handleGmChange('FIRST', i, e.target.value)} />
                            </td>
                         ))}
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50 font-bold">दोहोर्याई आएको</td>
                         {[2,3,4,5,6,7].map(i => (
                            <td key={i} className="border border-slate-400 p-1">
                               <input className="w-full text-center border-none outline-none focus:bg-yellow-100"
                                  value={gmData.REVISIT[i] || ''} onChange={e => handleGmChange('REVISIT', i, e.target.value)} />
                            </td>
                         ))}
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* MIDDLE TABLE: GM SUMMARY */}
             <div className="w-[180px]">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center h-full">
                   <thead className="bg-orange-200 text-slate-900">
                      <tr>
                         <th className="border border-slate-400 p-1 h-[90px]">बृद्धि अनुगमनका लागि दर्ता गरिएका २३ महिना पुरा गरेका जम्मा बालबालिकाको संख्या</th>
                         <th className="border border-slate-400 p-1 h-[90px]">बृद्धि अनुगमनका लागि दर्ता गरिएका २३ महिना पुरा गरेका बालबालिकाले तौल लिएको जम्मा पटक</th>
                      </tr>
                      <tr className="bg-gray-200">
                         <td className="border border-slate-400 p-1">८</td>
                         <td className="border border-slate-400 p-1">९</td>
                      </tr>
                   </thead>
                   <tbody>
                      <tr className="h-full">
                         <td className="border border-slate-400 p-1 align-bottom h-[65px]">
                            <input className="w-full h-full text-center border-none outline-none focus:bg-yellow-100 font-bold" 
                               value={gmSummary.col8} onChange={e => setGmSummary({...gmSummary, col8: e.target.value})} />
                         </td>
                         <td className="border border-slate-400 p-1 align-bottom h-[65px]">
                            <input className="w-full h-full text-center border-none outline-none focus:bg-yellow-100 font-bold"
                               value={gmSummary.col9} onChange={e => setGmSummary({...gmSummary, col9: e.target.value})} />
                         </td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* RIGHT TABLE: MICRONUTRIENTS */}
             <div className="flex-1 min-w-[700px]">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center h-full">
                   <thead className="bg-orange-200 text-slate-900">
                      <tr>
                         <th colSpan={3} className="border border-slate-400 p-1">आइरन/जुकाको औषधी पाएका गर्भवती महिला</th>
                         <th rowSpan={2} className="border border-slate-400 p-1 w-16">१८० क्याल्सियम चक्की पाएका महिला</th>
                         <th colSpan={2} className="border border-slate-400 p-1">आइरन/भिटामिन ए पाएका सुत्केरी महिला</th>
                         <th colSpan={3} className="border border-slate-400 p-1">भिटामिन ए/जुकाको औषधी पाएका ५ बर्ष भन्दा कम उमेरका बालबालिका (अर्ध-बार्षिक)</th>
                         <th colSpan={2} className="border border-slate-400 p-1">जुकाको औषधी पाएका छात्रा/छात्रहरु (अर्ध-बार्षिक)</th>
                      </tr>
                      <tr>
                         {/* Pregnant */}
                         <th className="border border-slate-400 p-1 w-12">पहिलो पटक आइरन चक्की</th>
                         <th className="border border-slate-400 p-1 w-12">१८० आइरन चक्की</th>
                         <th className="border border-slate-400 p-1 w-12">जुकाको औषधी</th>
                         
                         {/* Postnatal */}
                         <th className="border border-slate-400 p-1 w-12">४५ आइरन चक्की</th>
                         <th className="border border-slate-400 p-1 w-12">भिटामिन ए</th>

                         {/* Children < 5 */}
                         <th className="border border-slate-400 p-1 w-12">६-११ म.</th>
                         <th className="border border-slate-400 p-1 w-12">१२-५९ म.</th>
                         <th className="border border-slate-400 p-1 w-12">जुकाको औषधी</th>

                         {/* School */}
                         <th className="border border-slate-400 p-1 w-12">छात्रा</th>
                         <th className="border border-slate-400 p-1 w-12">छात्र</th>
                      </tr>
                      <tr className="bg-gray-200">
                         {[10,11,12,13,14,15,16,17,18,19,20].map(i => <td key={i} className="border border-slate-400 p-1">{i}</td>)}
                      </tr>
                   </thead>
                   <tbody>
                      <tr className="h-[65px]">
                         {[10,11,12,13,14,15,16,17,18,19,20].map(i => (
                            <td key={i} className="border border-slate-400 p-1">
                               <input className="w-full h-full text-center border-none outline-none focus:bg-yellow-100"
                                  value={microData[i] || ''} onChange={e => handleMicroChange(i, e.target.value)} />
                            </td>
                         ))}
                      </tr>
                   </tbody>
                </table>
             </div>

          </div>

       </div>
    </div>
  );
};
