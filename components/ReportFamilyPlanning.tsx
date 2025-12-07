
import React, { useState } from 'react';
import { Filter, Printer } from 'lucide-react';

interface ReportFamilyPlanningProps {
  activeOrgId?: string;
}

export const ReportFamilyPlanning: React.FC<ReportFamilyPlanningProps> = ({ activeOrgId }) => {
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
             ८. परिवार नियोजन कार्यक्रम
          </div>

          <div className="flex flex-col gap-4">
             
             {/* TABLE 1: TEMPORARY METHODS */}
             <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                <thead className="bg-orange-200">
                   <tr>
                      <th rowSpan={2} className="border border-slate-400 p-2 w-48">अस्थायी साधन</th>
                      <th colSpan={2} className="border border-slate-400 p-1">नयाँ प्रयोगकर्ता</th>
                      <th rowSpan={2} className="border border-slate-400 p-1">हाल अपनाई रहेका</th>
                      <th rowSpan={2} className="border border-slate-400 p-1">सेवामा नियमित नभएका</th>
                      <th colSpan={2} className="border border-slate-400 p-1">साधन वितरण</th>
                   </tr>
                   <tr>
                      <th className="border border-slate-400 p-1 w-20">&lt; २० बर्ष</th>
                      <th className="border border-slate-400 p-1 w-20">≥ २० बर्ष</th>
                      <th className="border border-slate-400 p-1 w-24">इकाई</th>
                      <th className="border border-slate-400 p-1 w-24">परिमाण</th>
                   </tr>
                   <tr className="bg-gray-200">
                      <td className="border border-slate-400 p-1">1</td>
                      <td className="border border-slate-400 p-1">2</td>
                      <td className="border border-slate-400 p-1">3</td>
                      <td className="border border-slate-400 p-1">4</td>
                      <td className="border border-slate-400 p-1">5</td>
                      <td className="border border-slate-400 p-1">6</td>
                   </tr>
                </thead>
                <tbody>
                   {[
                      { name: 'कण्डम', unit: 'गोटा' },
                      { name: 'आकस्मिक गर्भनिरोधक चक्की', unit: 'डोज' },
                      { name: 'पिल्स', unit: 'साइकल' },
                      { name: 'डिपो', unit: 'डोज' },
                      { name: 'सायना प्रेस', unit: 'डोज' },
                      { name: 'आई. यु. सी. डी.', unit: 'सेट' },
                      { name: 'इम्प्लान्ट', unit: 'सेट' }
                   ].map((item, i) => (
                      <tr key={i}>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">{item.name}</td>
                         {/* Condom & ECP: New Users disabled (merged in image, typically handled differently or dark cells) 
                             Based on provided image, Condom New Users is Dark. ECP is not. Let's strictly follow image style if possible or standard.
                             Image shows Condom New Users as Dark/Black. ECP New Users inputs exist.
                         */}
                         {item.name === 'कण्डम' ? (
                            <td colSpan={3} className="border border-slate-400 p-1 bg-gray-700"></td>
                         ) : (
                            <>
                               <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                               <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                               {item.name === 'आकस्मिक गर्भनिरोधक चक्की' ? (
                                  <td className="border border-slate-400 p-1 bg-gray-700"></td>
                               ) : (
                                  <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                               )}
                            </>
                         )}
                         
                         {/* Discontinued Column */}
                         {item.name === 'कण्डम' || item.name === 'आकस्मिक गर्भनिरोधक चक्की' ? (
                            <td className="border border-slate-400 p-1 bg-gray-700"></td>
                         ) : (
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         )}

                         <td className="border border-slate-400 p-1 text-left bg-white">{item.unit}</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                   ))}
                </tbody>
             </table>

             {/* TABLE 2: STERILIZATION */}
             <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                <thead className="bg-orange-200">
                   <tr>
                      <th rowSpan={3} className="border border-slate-400 p-2 w-48">बन्ध्याकरण</th>
                      <th colSpan={4} className="border border-slate-400 p-1">नयाँ प्रयोगकर्ता</th>
                      <th colSpan={2} rowSpan={2} className="border border-slate-400 p-1">हाल अपनाईरहेका</th>
                   </tr>
                   <tr>
                      <th colSpan={2} className="border border-slate-400 p-1">स्वास्थ्य संस्था</th>
                      <th colSpan={2} className="border border-slate-400 p-1">शिविर</th>
                   </tr>
                   <tr>
                      <th className="border border-slate-400 p-1 w-20">महिला</th>
                      <th className="border border-slate-400 p-1 w-20">पुरूष</th>
                      <th className="border border-slate-400 p-1 w-20">महिला</th>
                      <th className="border border-slate-400 p-1 w-20">पुरूष</th>
                      <th className="border border-slate-400 p-1 w-20">महिला</th>
                      <th className="border border-slate-400 p-1 w-20">पुरूष</th>
                   </tr>
                   <tr className="bg-gray-200">
                      <td className="border border-slate-400 p-1">1</td>
                      <td className="border border-slate-400 p-1">2</td>
                      <td className="border border-slate-400 p-1">3</td>
                      <td className="border border-slate-400 p-1">4</td>
                      <td className="border border-slate-400 p-1">5</td>
                      <td className="border border-slate-400 p-1">6</td>
                      <td className="border border-slate-400 p-1">7</td>
                   </tr>
                </thead>
                <tbody>
                   <tr>
                      <td className="border border-slate-400 p-2 text-left bg-yellow-50">सरकारी</td>
                      <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      <td className="border border-slate-400 p-1" rowSpan={2}><input className="w-full h-full text-center border-none focus:bg-yellow-100" /></td>
                      <td className="border border-slate-400 p-1" rowSpan={2}><input className="w-full h-full text-center border-none focus:bg-yellow-100" /></td>
                   </tr>
                   <tr>
                      <td className="border border-slate-400 p-2 text-left bg-yellow-50">गैर सरकारी</td>
                      <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                   </tr>
                </tbody>
             </table>

             {/* TABLE 3: POSTPARTUM FP */}
             <div className="flex gap-1">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-gray-300">
                      <tr>
                         <td className="border border-slate-400 p-1 w-48 text-left">1</td>
                         <td className="border border-slate-400 p-1">2</td>
                         <td className="border border-slate-400 p-1">3</td>
                         <td className="border border-slate-400 p-1">4</td>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-orange-200 font-bold" rowSpan={2}>
                            सुत्केरी पश्चात प. नि. सेवा अपनाएका<br/>(सुत्केरी भएको ४८ घण्टा भित्र)
                         </td>
                         <td className="border border-slate-400 p-2 bg-orange-100">आई. यु. सी. डी.</td>
                         <td className="border border-slate-400 p-2 bg-orange-100">इम्प्लान्ट</td>
                         <td className="border border-slate-400 p-2 bg-orange-100">ट्युबेक्टोमी</td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-orange-100 font-bold" rowSpan={4}>
                            सुत्केरी पश्चात प. नि. सेवा अपनाएका<br/>(४८ घण्टा देखि एक बर्ष भित्र)
                         </td>
                         <td className="border border-slate-400 p-2 bg-orange-100">आई. यु. सी. डी.</td>
                         <td className="border border-slate-400 p-2 bg-orange-100">इम्प्लान्ट</td>
                         <td className="border border-slate-400 p-2 bg-orange-100">ट्युबेक्टोमी</td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 bg-orange-100">डिपो.</td>
                         <td className="border border-slate-400 p-2 bg-orange-100">सायना प्रेस</td>
                         <td className="border border-slate-400 p-2 bg-orange-100">पिल्स</td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
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