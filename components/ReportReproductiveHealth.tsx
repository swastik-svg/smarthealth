
import React, { useState } from 'react';
import { Filter, Printer } from 'lucide-react';

interface ReportReproductiveHealthProps {
  activeOrgId?: string;
}

export const ReportReproductiveHealth: React.FC<ReportReproductiveHealthProps> = ({ activeOrgId }) => {
  const [fiscalYear, setFiscalYear] = useState('2081/82');
  const [selectedMonth, setSelectedMonth] = useState('Falgun (फाल्गुन)');

  const fiscalYears = ['2080/81', '2081/82', '2082/83'];
  const nepaliMonths = [
    "Baisakh (बैशाख)", "Jestha (जेष्ठ)", "Ashad (आषाढ)", "Shrawan (श्रावण)", 
    "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)", 
    "Poush (पुष)", "Magh (माघ)", "Falgun (फाल्गुन)", "Chaitra (चैत्र)"
  ];

  const handlePrint = () => window.print();

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
             ९. प्रजनन स्वास्थ्य रुग्णता सेवा
          </div>

          <div className="flex flex-col xl:flex-row gap-2">
             
             {/* LEFT SECTION: CERVICAL CANCER */}
             <div className="flex-1 min-w-[500px]">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center h-full">
                   <thead className="bg-orange-200">
                      <tr>
                         <th colSpan={7} className="border border-slate-400 p-2 font-bold">पाठेघरको मुखको क्यान्सर</th>
                      </tr>
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1 w-48"></th>
                         <th colSpan={2} className="border border-slate-400 p-1">HPV DNA</th>
                         <th colSpan={2} className="border border-slate-400 p-1">VIA</th>
                         <th colSpan={2} className="border border-slate-400 p-1">Pap Smear & Others</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1 w-16">Screened</th>
                         <th className="border border-slate-400 p-1 w-16">Positive</th>
                         <th className="border border-slate-400 p-1 w-16">Screened</th>
                         <th className="border border-slate-400 p-1 w-16">Positive</th>
                         <th className="border border-slate-400 p-1 w-16">Screened</th>
                         <th className="border border-slate-400 p-1 w-16">Positive</th>
                      </tr>
                      <tr className="bg-gray-200">
                         <td className="border border-slate-400 p-1">1</td>
                         <td className="border border-slate-400 p-1">3</td>
                         <td className="border border-slate-400 p-1">4</td>
                         <td className="border border-slate-400 p-1">5</td>
                         <td className="border border-slate-400 p-1">6</td>
                         <td className="border border-slate-400 p-1">7</td>
                         <td className="border border-slate-400 p-1">8</td>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">३०-४९ वर्षका महिलाको संख्या</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">५० वर्ष भन्दा माथिका महिलाको संख्या</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Ablative Treatment गराएको (संख्यामा)</td>
                         <td colSpan={2} className="border border-slate-400 p-1 bg-gray-200"></td>
                         <td colSpan={2} className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td colSpan={2} className="border border-slate-400 p-1 bg-gray-200"></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Colposcopy (संख्यामा)</td>
                         <td colSpan={2} className="border border-slate-400 p-1 bg-gray-200"></td>
                         <td colSpan={2} className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td colSpan={2} className="border border-slate-400 p-1 bg-gray-200"></td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* MIDDLE SECTION: BREAST CANCER & FISTULA */}
             <div className="flex flex-col gap-2 min-w-[300px]">
                {/* Breast Cancer */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-orange-200">
                      <tr>
                         <th colSpan={4} className="border border-slate-400 p-2 font-bold">स्तन क्यान्सर</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1"></th>
                         <th className="border border-slate-400 p-1">&lt; ४० बर्ष</th>
                         <th className="border border-slate-400 p-1">४०-७० बर्ष</th>
                         <th className="border border-slate-400 p-1">&gt; ७० बर्ष</th>
                      </tr>
                      <tr className="bg-gray-200">
                         <td className="border border-slate-400 p-1">1</td>
                         <td className="border border-slate-400 p-1">2</td>
                         <td className="border border-slate-400 p-1">3</td>
                         <td className="border border-slate-400 p-1">4</td>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Screened</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Suspected</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                   </tbody>
                </table>

                {/* Fistula */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center mt-2">
                   <thead className="bg-orange-200">
                      <tr>
                         <th colSpan={4} className="border border-slate-400 p-2 font-bold">अब्स्टेट्रिक फिस्टुला</th>
                      </tr>
                      <tr className="bg-gray-200">
                         <td className="border border-slate-400 p-1">1</td>
                         <td className="border border-slate-400 p-1">2</td>
                         <td className="border border-slate-400 p-1">3</td>
                         <td className="border border-slate-400 p-1">4</td>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Screened</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Referred</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Suspected</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">शल्यक्रिया गरेको</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* RIGHT SECTION: UTERINE PROLAPSE */}
             <div className="min-w-[250px]">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center h-full">
                   <thead className="bg-orange-200">
                      <tr>
                         <th colSpan={2} className="border border-slate-400 p-2 font-bold">आङ खसे समस्या (महिलाको संख्या)</th>
                      </tr>
                      <tr className="bg-gray-200">
                         <td className="border border-slate-400 p-1">1</td>
                         <td className="border border-slate-400 p-1 w-20">2</td>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Screened</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-0">
                            <div className="flex h-full">
                               <div className="flex-1 p-2 text-left bg-yellow-50 border-r border-slate-400 flex items-center">Prolapsed पत्ता लागेको</div>
                               <div className="flex-1 flex flex-col">
                                  <div className="p-2 border-b border-slate-400 bg-yellow-50">Stage 1 & 2</div>
                                  <div className="p-2 border-b border-slate-400 bg-yellow-50">Stage 3</div>
                                  <div className="p-2 bg-yellow-50">Stage 4</div>
                                </div>
                            </div>
                         </td>
                         <td className="border border-slate-400 p-0">
                            <div className="flex flex-col h-full">
                               <input className="flex-1 w-full text-center border-b border-slate-400 focus:bg-yellow-100 py-2" />
                               <input className="flex-1 w-full text-center border-b border-slate-400 focus:bg-yellow-100 py-2" />
                               <input className="flex-1 w-full text-center focus:bg-yellow-100 py-2" />
                            </div>
                         </td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">Ring pessary लगाईएको</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">प्रेषण गरेको (Referred)</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">शल्यक्रिया गरेको</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                   </tbody>
                </table>
             </div>

          </div>

       </div>
    </div>
  );
};
