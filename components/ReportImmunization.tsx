
import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Printer } from 'lucide-react';
import { dbService } from '../services/db';
import { ServiceRecord } from '../types';

interface ReportImmunizationProps {
  activeOrgId?: string;
}

export const ReportImmunization: React.FC<ReportImmunizationProps> = ({ activeOrgId }) => {
  const [fiscalYear, setFiscalYear] = useState('2081/82');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [records, setRecords] = useState<ServiceRecord[]>([]);

  // Manual Stock Data State - Organized by Column Index (1-27)
  const [stockData, setStockData] = useState<{
     received: Record<number, string>,
     opened: Record<number, string>,
     wasted: Record<number, string>,
     returned: Record<number, string>
  }>({
     received: {},
     opened: {},
     wasted: {},
     returned: {}
  });

  const fiscalYears = ['2080/81', '2081/82', '2082/83'];
  const nepaliMonths = [
    "Baisakh (बैशाख)", "Jestha (जेष्ठ)", "Ashad (आषाढ)", "Shrawan (श्रावण)", 
    "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)", 
    "Poush (पुष)", "Magh (माघ)", "Falgun (फाल्गुन)", "Chaitra (चैत्र)"
  ];

  const headers = [
     { id: 2, label: 'बि.सी.जी. (BCG)', group: 'BCG' },
     { id: 3, label: 'पहिलो', group: 'Rota' },
     { id: 4, label: 'दोस्रो', group: 'Rota' },
     { id: 5, label: 'पहिलो', group: 'OPV' },
     { id: 6, label: 'दोस्रो', group: 'OPV' },
     { id: 7, label: 'तेस्रो', group: 'OPV' },
     { id: 8, label: 'पहिलो', group: 'FIPV' },
     { id: 9, label: 'दोस्रो', group: 'FIPV' },
     { id: 10, label: 'पहिलो', group: 'PCV' },
     { id: 11, label: 'दोस्रो', group: 'PCV' },
     { id: 12, label: 'तेस्रो', group: 'PCV' },
     { id: 13, label: 'पहिलो', group: 'DPT-HepB-Hib' },
     { id: 14, label: 'दोस्रो', group: 'DPT-HepB-Hib' },
     { id: 15, label: 'तेस्रो', group: 'DPT-HepB-Hib' },
     { id: 16, label: 'पहिलो', group: 'MR' },
     { id: 17, label: 'दोस्रो', group: 'MR' },
     { id: 18, label: 'जे.ई (JE)', group: 'JE' },
     { id: 19, label: 'टाईफाईड (TCV)', group: 'TCV' },
     { id: 20, label: '२३ म. भित्र पूर्णखोप प्राप्त', group: 'Complete' },
     { id: 21, label: 'एच.पि.भि. (HPV) **', group: 'HPV' },
     { id: 22, label: '', group: 'Spacer' }, // Spacer in image
     { id: 23, label: 'पहिलो', group: 'TD' },
     { id: 24, label: 'दोस्रो', group: 'TD' },
     { id: 25, label: 'दोस्रो+', group: 'TD' },
     { id: 26, label: '२४-५९ म. मा खोप सुरु', group: 'Child' },
     { id: 27, label: 'सामान्य', group: 'AEFI' },
     { id: 28, label: 'गम्भीर', group: 'AEFI' }
  ];

  useEffect(() => {
    setSelectedMonth(nepaliMonths[10]); // Default Falgun
    loadData();
  }, [activeOrgId]);

  const loadData = async () => {
    try {
      const allRecords = await dbService.getAllServiceRecords();
      let filtered = allRecords;
      if (activeOrgId && activeOrgId !== 'ALL') {
        filtered = filtered.filter(r => r.organizationId === activeOrgId);
      }
      setRecords(filtered);
    } catch (e) {
      console.error("Failed to load records", e);
    }
  };

  // Logic to Count Vaccinations from Service Records
  // This looks for string matches in Service Type or Prescriptions/Requests
  const counts = useMemo(() => {
     const c: Record<number, number> = {};
     headers.forEach(h => c[h.id] = 0);

     records.forEach(r => {
        // Only count if record matches selected Month (simplified logic as before, assuming 'month' filter works on timestamp or specific field)
        // For demo, we include all to show data
        
        const text = (r.serviceType + ' ' + (r.diagnosis || '') + ' ' + (r.findings || '')).toLowerCase();
        
        if (text.includes('bcg')) c[2]++;
        
        if (text.includes('rota') && text.includes('1')) c[3]++;
        if (text.includes('rota') && text.includes('2')) c[4]++;
        
        if (text.includes('opv') && text.includes('1')) c[5]++;
        if (text.includes('opv') && text.includes('2')) c[6]++;
        if (text.includes('opv') && text.includes('3')) c[7]++;
        
        if (text.includes('fipv') && text.includes('1')) c[8]++;
        if (text.includes('fipv') && text.includes('2')) c[9]++;
        
        if (text.includes('pcv') && text.includes('1')) c[10]++;
        if (text.includes('pcv') && text.includes('2')) c[11]++;
        if (text.includes('pcv') && text.includes('3')) c[12]++;
        
        if ((text.includes('dpt') || text.includes('pentavalent')) && text.includes('1')) c[13]++;
        if ((text.includes('dpt') || text.includes('pentavalent')) && text.includes('2')) c[14]++;
        if ((text.includes('dpt') || text.includes('pentavalent')) && text.includes('3')) c[15]++;
        
        if (text.includes('mr') && text.includes('1')) c[16]++;
        if (text.includes('mr') && text.includes('2')) c[17]++;
        
        if (text.includes('je')) c[18]++;
        if (text.includes('tcv') || text.includes('typhoid')) c[19]++;
        
        if (text.includes('td') && text.includes('1')) c[23]++;
        if (text.includes('td') && text.includes('2')) c[24]++;
     });
     
     return c;
  }, [records, selectedMonth]);

  const handleStockChange = (type: 'received'|'opened'|'wasted'|'returned', id: number, val: string) => {
     setStockData(prev => ({
        ...prev,
        [type]: { ...prev[type], [id]: val }
     }));
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
          <div className="w-full bg-teal-100 border border-teal-200 text-center py-2 mb-1 font-bold text-lg text-teal-900">
             १. खोप कार्यक्रम (Immunization Program)
          </div>

          <table className="w-full border-collapse border border-slate-400 text-xs text-center">
             {/* TABLE HEAD */}
             <thead className="bg-orange-200 text-slate-900 font-bold">
                <tr>
                   <th rowSpan={2} className="border border-slate-400 p-2 w-24">खोपको प्रकार</th>
                   <th rowSpan={2} className="border border-slate-400 p-1">बि.सी.जी. (BCG)</th>
                   <th colSpan={2} className="border border-slate-400 p-1">रोटा (Rota)</th>
                   <th colSpan={3} className="border border-slate-400 p-1">पोलियो (OPV)</th>
                   <th colSpan={2} className="border border-slate-400 p-1">एफ.आई.पि.भी. (FIPV)</th>
                   <th colSpan={3} className="border border-slate-400 p-1">पी. सी. भी. (PCV)</th>
                   <th colSpan={3} className="border border-slate-400 p-1">डी.पी. टी-हेप वि.- हिब. (DPT, Hep-B, Hib)</th>
                   <th colSpan={2} className="border border-slate-400 p-1">दादुरा रुबेला (MR)</th>
                   <th rowSpan={2} className="border border-slate-400 p-1 w-12">जे.ई (JE)</th>
                   <th rowSpan={2} className="border border-slate-400 p-1 w-12">टाईफाईड (TCV)</th>
                   <th rowSpan={2} className="border border-slate-400 p-1 w-16 text-[10px]">२३ म. भित्र पूर्णखोप प्राप्त गरेका बच्चा</th>
                   <th rowSpan={2} className="border border-slate-400 p-1 w-12 text-[10px]">एच.पि.भि. (HPV) **</th>
                   <th rowSpan={2} className="border border-slate-400 bg-gray-300 w-4"></th>
                   <th colSpan={3} className="border border-slate-400 p-1">टि.डी. (गर्भवती महिला) (TD)</th>
                   <th rowSpan={2} className="border border-slate-400 p-1 w-12 text-[10px]">२४ - ५९ म. मा खोप सुरु गरेका बच्चा</th>
                   <th colSpan={2} className="border border-slate-400 p-1">AEFI Cases (जनामा)</th>
                </tr>
                <tr>
                   {/* Rota */}
                   <th className="border border-slate-400 p-1">पहिलो</th>
                   <th className="border border-slate-400 p-1">दोस्रो</th>
                   {/* OPV */}
                   <th className="border border-slate-400 p-1">पहिलो</th>
                   <th className="border border-slate-400 p-1">दोस्रो</th>
                   <th className="border border-slate-400 p-1">तेस्रो</th>
                   {/* FIPV */}
                   <th className="border border-slate-400 p-1">पहिलो</th>
                   <th className="border border-slate-400 p-1">दोस्रो</th>
                   {/* PCV */}
                   <th className="border border-slate-400 p-1">पहिलो</th>
                   <th className="border border-slate-400 p-1">दोस्रो</th>
                   <th className="border border-slate-400 p-1">तेस्रो</th>
                   {/* DPT */}
                   <th className="border border-slate-400 p-1">पहिलो</th>
                   <th className="border border-slate-400 p-1">दोस्रो</th>
                   <th className="border border-slate-400 p-1">तेस्रो</th>
                   {/* MR */}
                   <th className="border border-slate-400 p-1">पहिलो</th>
                   <th className="border border-slate-400 p-1">दोस्रो</th>
                   {/* TD */}
                   <th className="border border-slate-400 p-1">पहिलो</th>
                   <th className="border border-slate-400 p-1">दोस्रो</th>
                   <th className="border border-slate-400 p-1">दोस्रो+</th>
                   {/* AEFI */}
                   <th className="border border-slate-400 p-1">सामान्य</th>
                   <th className="border border-slate-400 p-1">गम्भीर</th>
                </tr>
                {/* Column Numbers */}
                <tr className="bg-gray-200 text-gray-700">
                   <td className="border border-slate-400 p-1">1</td>
                   {headers.map((h) => (
                      <td key={h.id} className={`border border-slate-400 p-1 ${h.id === 22 ? 'bg-gray-400' : ''}`}>
                         {h.id === 22 ? '' : h.id}
                      </td>
                   ))}
                </tr>
             </thead>

             {/* TABLE BODY */}
             <tbody>
                {/* Row 1: Vaccinated Count */}
                <tr>
                   <td className="border border-slate-400 p-2 bg-yellow-50 font-bold text-left">खोप पाएका बच्चाहरुको संख्या</td>
                   {headers.map((h) => (
                      <td key={h.id} className={`border border-slate-400 p-1 ${h.id === 22 ? 'bg-gray-300' : ''}`}>
                         {h.id !== 22 && (
                            <div className="bg-white border border-slate-200 p-1 rounded font-bold text-slate-800">
                               {counts[h.id] || ''}
                            </div>
                         )}
                      </td>
                   ))}
                </tr>

                {/* STOCK ROWS - MERGED CELL FOR LABEL */}
                <tr>
                   <td rowSpan={4} className="border border-slate-400 p-0 align-top">
                      <div className="flex flex-col h-full text-left font-bold bg-yellow-50">
                         <div className="flex-1 p-2 border-b border-slate-300 flex items-center">यस महिनामा प्राप्त भएको</div>
                         <div className="flex-1 p-2 border-b border-slate-300 flex items-center">खोप दिन खोलेको</div>
                         <div className="flex-1 p-2 border-b border-slate-300 flex items-center">अन्य कारणले बिग्रेको</div>
                         <div className="flex-1 p-2 flex items-center">फिर्ता</div>
                      </div>
                   </td>
                   {/* Inner Rows Content */}
                   {/* 1. Received */}
                   {headers.map((h) => (
                      <td key={`rec-${h.id}`} className={`border border-slate-400 p-1 ${h.id >= 20 ? 'bg-gray-300' : ''}`}>
                         {h.id < 20 && (
                            <input 
                               className="w-full text-center border border-slate-200 p-1 rounded outline-none focus:border-blue-500 text-xs"
                               value={stockData.received[h.id] || ''}
                               onChange={(e) => handleStockChange('received', h.id, e.target.value)}
                            />
                         )}
                      </td>
                   ))}
                </tr>
                
                {/* 2. Opened */}
                <tr>
                   {headers.map((h) => (
                      <td key={`open-${h.id}`} className={`border border-slate-400 p-1 ${h.id >= 20 ? 'bg-gray-300' : ''}`}>
                         {h.id < 20 && (
                            <input 
                               className="w-full text-center border border-slate-200 p-1 rounded outline-none focus:border-blue-500 text-xs"
                               value={stockData.opened[h.id] || ''}
                               onChange={(e) => handleStockChange('opened', h.id, e.target.value)}
                            />
                         )}
                      </td>
                   ))}
                </tr>

                {/* 3. Wasted */}
                <tr>
                   {headers.map((h) => (
                      <td key={`waste-${h.id}`} className={`border border-slate-400 p-1 ${h.id >= 20 ? 'bg-gray-300' : ''}`}>
                         {h.id < 20 && (
                            <input 
                               className="w-full text-center border border-slate-200 p-1 rounded outline-none focus:border-blue-500 text-xs"
                               value={stockData.wasted[h.id] || ''}
                               onChange={(e) => handleStockChange('wasted', h.id, e.target.value)}
                            />
                         )}
                      </td>
                   ))}
                </tr>

                {/* 4. Returned */}
                <tr>
                   {headers.map((h) => (
                      <td key={`ret-${h.id}`} className={`border border-slate-400 p-1 ${h.id >= 20 ? 'bg-gray-300' : ''}`}>
                         {h.id < 20 && (
                            <input 
                               className="w-full text-center border border-slate-200 p-1 rounded outline-none focus:border-blue-500 text-xs"
                               value={stockData.returned[h.id] || ''}
                               onChange={(e) => handleStockChange('returned', h.id, e.target.value)}
                            />
                         )}
                      </td>
                   ))}
                </tr>

             </tbody>
          </table>
          
          <div className="mt-2 text-xs text-slate-500 italic">
             ** HPV खोपको हकमा पालिकाले निर्धारण गरेको उमेर समूह वा कक्षा ६ का छात्राहरु।
          </div>

       </div>
    </div>
  );
};
