
import React, { useState } from 'react';
import { Filter, Printer } from 'lucide-react';

interface ReportCBIMNCIProps {
  activeOrgId?: string;
}

export const ReportCBIMNCI: React.FC<ReportCBIMNCIProps> = ({ activeOrgId }) => {
  const [fiscalYear, setFiscalYear] = useState('2081/82');
  const [selectedMonth, setSelectedMonth] = useState('Falgun (फाल्गुन)');

  const fiscalYears = ['2080/81', '2081/82', '2082/83'];
  const nepaliMonths = [
    "Baisakh (बैशाख)", "Jestha (जेष्ठ)", "Ashad (आषाढ)", "Shrawan (श्रावण)", 
    "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)", 
    "Poush (पुष)", "Magh (माघ)", "Falgun (फाल्गुन)", "Chaitra (चैत्र)"
  ];

  // Table 1 Data (Infants < 2 months)
  const [table1Data, setTable1Data] = useState<Record<string, Record<string, string>>>({
     'HF': {}, 'ORC': {}
  });

  // Table 2 Data (Children 2-59 months)
  const [table2Data, setTable2Data] = useState<Record<string, Record<string, string>>>({
     'HF': {}, 'ORC': {}
  });

  const handleT1Change = (row: string, col: number, val: string) => {
     setTable1Data(prev => ({
        ...prev, [row]: { ...prev[row], [col]: val }
     }));
  };

  const handleT2Change = (row: string, col: number, val: string) => {
     setTable2Data(prev => ({
        ...prev, [row]: { ...prev[row], [col]: val }
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
          <div className="w-full bg-blue-100 border border-blue-200 text-center py-2 mb-1 font-bold text-lg text-blue-900">
             २. नवजात शिशु तथा बालरोगको एकीकृत व्यवस्थापन कार्यक्रम (CBIMNCI)
          </div>

          {/* TABLE 1: INFANTS < 2 MONTHS */}
          <div className="mb-8">
             <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                <thead className="bg-orange-200 text-slate-900">
                   <tr>
                      <th rowSpan={2} className="border border-slate-400 p-2 w-32">२ महिना भन्दा कम उमेरका शिशु</th>
                      <th colSpan={2} className="border border-slate-400 p-1">जम्मा बिरामी</th>
                      <th colSpan={10} className="border border-slate-400 p-1">बच्चाको वर्गीकरण (संख्यामा)</th>
                      <th colSpan={7} className="border border-slate-400 p-1">उपचार</th>
                      <th colSpan={3} className="border border-slate-400 p-1">रेफर</th>
                      <th colSpan={3} className="border border-slate-400 p-1">मृत्यु</th>
                   </tr>
                   <tr>
                      {/* Total */}
                      <th className="border border-slate-400 p-1 w-10">≤२८ दिन</th>
                      <th className="border border-slate-400 p-1 w-10">२९-५९ दिन</th>
                      
                      {/* Classification */}
                      <th className="border border-slate-400 p-1 w-10">गम्भीर संक्रमण</th>
                      <th className="border border-slate-400 p-1 w-10">न्युमोनिया</th>
                      <th className="border border-slate-400 p-1 w-10">स्थानीय संक्रमण</th>
                      <th className="border border-slate-400 p-1 w-10">कडा कमल पित (जन्डिस)</th>
                      <th className="border border-slate-400 p-1 w-10">कम तौल</th>
                      <th className="border border-slate-400 p-1 w-10">स्तनपान सम्बन्धि समस्या</th>
                      <th className="border border-slate-400 p-1 w-10">≤२८ दिन</th>
                      <th className="border border-slate-400 p-1 w-10">२९-५९ दिन</th>
                      <th className="border border-slate-400 p-1 w-10">≤२८ दिन</th>
                      <th className="border border-slate-400 p-1 w-10">२९-५९ दिन</th>

                      {/* Treatment */}
                      <th className="border border-slate-400 p-1 w-10">एम्पिसिलिन</th>
                      <th className="border border-slate-400 p-1 w-10">जेन्टामाइसिन (गम्भीर संक्रमण भएका मात्र)</th>
                      <th className="border border-slate-400 p-1 w-10">एमोक्सिसिलिन</th>
                      <th className="border border-slate-400 p-1 w-10">अन्य एन्टीबायोटिक</th>
                      <th className="border border-slate-400 p-1 w-10">पहिलो डोज</th>
                      <th className="border border-slate-400 p-1 w-10">पूरा डोज</th>
                      <th className="border border-slate-400 p-1 w-10">≤२८ दिन</th>

                      {/* Refer */}
                      <th className="border border-slate-400 p-1 w-10">२९-५९ दिन</th>
                      <th className="border border-slate-400 p-1 w-10">फलोअप</th>
                      <th className="border border-slate-400 p-1 w-10">०-७ दिन</th>

                      {/* Death */}
                      <th className="border border-slate-400 p-1 w-10">८-२८ दिन</th>
                      <th className="border border-slate-400 p-1 w-10">२९-५९ दिन</th>
                   </tr>
                   <tr className="bg-gray-200">
                      <td className="border border-slate-400 p-1">1</td>
                      {[...Array(27)].map((_, i) => <td key={i} className="border border-slate-400 p-1">{i+2}</td>)}
                   </tr>
                </thead>
                <tbody>
                   <tr>
                      <td className="border border-slate-400 p-2 text-left bg-yellow-50 font-bold">स्वास्थ्य संस्था (HMIS 2.4)</td>
                      {[...Array(27)].map((_, i) => (
                         <td key={i} className="border border-slate-400 p-1">
                            <input 
                               className="w-full text-center border-none bg-transparent outline-none focus:bg-yellow-100"
                               value={table1Data['HF'][i+2] || ''}
                               onChange={(e) => handleT1Change('HF', i+2, e.target.value)}
                            />
                         </td>
                      ))}
                   </tr>
                   <tr>
                      <td className="border border-slate-400 p-2 text-left bg-yellow-50 font-bold">गाउँघर क्लिनिक (HMIS 2.2)</td>
                      {[...Array(27)].map((_, i) => (
                         <td key={i} className="border border-slate-400 p-1">
                            <input 
                               className="w-full text-center border-none bg-transparent outline-none focus:bg-yellow-100"
                               value={table1Data['ORC'][i+2] || ''}
                               onChange={(e) => handleT1Change('ORC', i+2, e.target.value)}
                            />
                         </td>
                      ))}
                   </tr>
                </tbody>
             </table>
          </div>

          {/* TABLE 2: CHILDREN 2-59 MONTHS */}
          <div>
             <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                <thead className="bg-orange-200 text-slate-900">
                   <tr>
                      <th rowSpan={4} className="border border-slate-400 p-2 w-32">२ देखि ५९ महिना सम्मका बच्चा</th>
                      <th colSpan={2} className="border border-slate-400 p-1">जम्मा बिरामी</th>
                      <th colSpan={17} className="border border-slate-400 p-1">वर्गीकरण</th>
                      <th colSpan={8} className="border border-slate-400 p-1">उपचार</th>
                      <th rowSpan={4} className="border border-slate-400 p-1 w-10">रेफर</th>
                      <th colSpan={5} className="border border-slate-400 p-1">मृत्यु</th>
                   </tr>
                   <tr>
                      {/* Total */}
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">बालक</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">बालिका</th>
                      
                      {/* Classification Groups */}
                      <th colSpan={3} className="border border-slate-400 p-1">श्वासप्रस्वास</th>
                      <th colSpan={4} className="border border-slate-400 p-1">झाडापखाला</th>
                      <th colSpan={3} className="border border-slate-400 p-1">औलो</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-12 text-[10px]">धेरै कडा ज्वरोजन्य रोग/ कडा जटिल (Very Severe Febrile Disease)</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">दादुरा</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">कानको समस्या</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">न्युरो</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">कडा कुपोषण</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">मध्यम कुपोषण</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">रक्त-अल्पता</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">अन्य</th>

                      {/* Treatment Details */}
                      <th rowSpan={3} className="border border-slate-400 p-1 w-12 text-[10px]">निमोनियाको लागि एमोक्सिसिलिन द्वारा उपचार</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-12 text-[10px]">ओ. आर. एस. र जिंक चक्की</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-12 text-[10px]">आइ. भी. फ्लुइड</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-12 text-[10px]">जुकाको औषधि</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-12 text-[10px]">भिटामिन ए</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">सास प्रवास</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">झाडापखाला</th>
                      <th rowSpan={3} className="border border-slate-400 p-1 w-10">अन्य</th>
                      
                      {/* Death Cause */}
                      <th colSpan={3} className="border border-slate-400 p-1">कारण</th>
                      <th colSpan={2} className="border border-slate-400 p-1">उमेर</th>
                   </tr>
                   <tr>
                      {/* Respiratory */}
                      <th rowSpan={2} className="border border-slate-400 p-1 w-12 text-[10px]">निमोनिया नभएको रुघाखोकी</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">निमोनिया</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-12 text-[10px]">कडा निमोनिया र कडा रोग</th>
                      
                      {/* Diarrhea */}
                      <th colSpan={3} className="border border-slate-400 p-1">जलवियोजनको वर्गीकरण</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">दीर्घ झाडापखाला</th>
                      
                      {/* Malaria */}
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">आउँ रगत</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">फाल्सिप्यारम औलो</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-12 text-[10px]">फाल्सिप्यारम नभएको औलो</th>

                      {/* Death Sub */}
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">फलो अप</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">स्वासप्रस्वास</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">झाडापखाला</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">अन्य</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">२ देखि ११ महिना</th>
                      <th rowSpan={2} className="border border-slate-400 p-1 w-10">१२-५९ महिना</th>
                   </tr>
                   <tr>
                      {/* Dehydration Sub */}
                      <th className="border border-slate-400 p-1 w-10 text-[10px]">जलवियोजन नभएको</th>
                      <th className="border border-slate-400 p-1 w-10 text-[10px]">केहि जलवियोजन</th>
                      <th className="border border-slate-400 p-1 w-10 text-[10px]">कडा जलवियोजन</th>
                   </tr>
                   <tr className="bg-gray-200">
                      <td className="border border-slate-400 p-1">1</td>
                      {[...Array(34)].map((_, i) => <td key={i} className="border border-slate-400 p-1">{i+2}</td>)}
                   </tr>
                </thead>
                <tbody>
                   <tr>
                      <td className="border border-slate-400 p-2 text-left bg-yellow-50 font-bold">स्वास्थ्य संस्था (HMIS 2.4)</td>
                      {[...Array(34)].map((_, i) => (
                         <td key={i} className="border border-slate-400 p-1">
                            <input 
                               className="w-full text-center border-none bg-transparent outline-none focus:bg-yellow-100"
                               value={table2Data['HF'][i+2] || ''}
                               onChange={(e) => handleT2Change('HF', i+2, e.target.value)}
                            />
                         </td>
                      ))}
                   </tr>
                   <tr>
                      <td className="border border-slate-400 p-2 text-left bg-yellow-50 font-bold">गाउँघर क्लिनिक (HMIS 2.2)</td>
                      {[...Array(34)].map((_, i) => (
                         <td key={i} className="border border-slate-400 p-1">
                            <input 
                               className="w-full text-center border-none bg-transparent outline-none focus:bg-yellow-100"
                               value={table2Data['ORC'][i+2] || ''}
                               onChange={(e) => handleT2Change('ORC', i+2, e.target.value)}
                            />
                         </td>
                      ))}
                   </tr>
                </tbody>
             </table>
          </div>

       </div>
    </div>
  );
};
