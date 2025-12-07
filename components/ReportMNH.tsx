
import React, { useState } from 'react';
import { Filter, Printer } from 'lucide-react';

interface ReportMNHProps {
  activeOrgId?: string;
}

export const ReportMNH: React.FC<ReportMNHProps> = ({ activeOrgId }) => {
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
          <div className="w-full bg-blue-100 border border-blue-200 text-center py-2 mb-1 font-bold text-lg text-blue-900">
             ७. गाउँ तथा अस्पताल बिन्दु - मातृ तथा नवजात शिशु स्याहार कार्यक्रम
          </div>

          <div className="flex flex-col xl:flex-row gap-2">
             
             {/* LEFT COLUMN: ANC & Delivery */}
             <div className="flex flex-col gap-2 min-w-[300px]">
                {/* ANC Table */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-orange-200">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1">गर्भवती जाँच (पटक)</th>
                         <th colSpan={2} className="border border-slate-400 p-1">महिलाको संख्या</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1 w-16">&lt;२० बर्ष</th>
                         <th className="border border-slate-400 p-1 w-16">≥२० बर्ष</th>
                      </tr>
                   </thead>
                   <tbody>
                      {['पहिलो (जुनसुकै समयमा)', '४ पटक सम्म', '४ पटक (प्रोटोकल अनुसार)', '८ पटक (प्रोटोकल अनुसार)'].map((label, i) => (
                         <tr key={i}>
                            <td className="border border-slate-400 p-1 text-left bg-yellow-50">{label}</td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                {/* Delivery Table */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-orange-200">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1">प्रसूति सेवा</th>
                         <th colSpan={2} className="border border-slate-400 p-1">महिलाको संख्या</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1 w-16">&lt;२० बर्ष</th>
                         <th className="border border-slate-400 p-1 w-16">≥२० बर्ष</th>
                      </tr>
                   </thead>
                   <tbody>
                      {['स्वास्थ्य संस्थामा (SBA trained)', 'स्वास्थ्य संस्थामा (Health Worker)', 'अन्य स्वास्थ्यकर्मीबाट', 'घरमा प्रसूति संख्या'].map((label, i) => (
                         <tr key={i}>
                            <td className="border border-slate-400 p-1 text-left bg-yellow-50">{label}</td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                {/* Presentation Table */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-orange-200">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1">प्रसूतिको किसिम</th>
                         <th colSpan={3} className="border border-slate-400 p-1">Foetal Presentation</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1">Cephalic</th>
                         <th className="border border-slate-400 p-1">Shoulder</th>
                         <th className="border border-slate-400 p-1">Breech</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">सामान्य (Spontaneous)</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">भ्याकुम/ forceps</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1 bg-black"></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">सल्यक्रिया (C/S)</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                   </tbody>
                </table>

                {/* Outcome Table */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-orange-200">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1">प्रसूतिको परिणाम</th>
                         <th rowSpan={2} className="border border-slate-400 p-1">एकल बच्चा</th>
                         <th colSpan={2} className="border border-slate-400 p-1">बहु बच्चा</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1">जुम्ल्याहा</th>
                         <th className="border border-slate-400 p-1">&gt; जुम्ल्याहा</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">आमाहरूको संख्या</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">जीवित</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" placeholder="M" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" placeholder="M" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" placeholder="M" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">मृत</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" placeholder="F" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" placeholder="F" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" placeholder="F" /></td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* MIDDLE COLUMN: Complications */}
             <div className="flex flex-col gap-2 min-w-[250px]">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-orange-200">
                      <tr>
                         <th className="border border-slate-400 p-1 w-32">Obstetric Complications</th>
                         <th className="border border-slate-400 p-1 w-12">ICD 11</th>
                         <th className="border border-slate-400 p-1 w-12">Cases</th>
                         <th className="border border-slate-400 p-1 w-12">Referred out</th>
                         <th className="border border-slate-400 p-1 w-12">Death</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                         'Ectopic pregnancy', 'Abortion complication', 'Pre-eclampsia', 'Eclampsia', 
                         'Hyperemesis gravidarum', 'Antepartum haemorrhage', 'Prolonged labour', 
                         'Obstructed Labor', 'Gestational Hypertension', 'Ruptured uterus', 
                         'Postpartum haemorrhage', 'Retained placenta', 'Puerperal sepsis', 
                         'C-Section Wound Infection', 'Other complications'
                      ].map((comp, i) => (
                         <tr key={i}>
                            <td className="border border-slate-400 p-1 text-left bg-yellow-50">{comp}</td>
                            <td className="border border-slate-400 p-1 text-[10px] text-slate-500">Code</td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                
                {/* Abortion Table */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center mt-2">
                   <thead className="bg-orange-200">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1">असुरक्षित गर्भपतन जटिलता</th>
                         <th className="border border-slate-400 p-1">गर्भपतन (induced)</th>
                         <th className="border border-slate-400 p-1">स्वत: गर्भपतन (Spont)</th>
                         <th className="border border-slate-400 p-1">सुत्केरी अवस्था (PCC)</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">असुरक्षित गर्भपतन व्यवस्थापन</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* RIGHT COLUMN: PNC & Safe Motherhood */}
             <div className="flex flex-col gap-2 min-w-[350px]">
                {/* PNC Table */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-orange-200">
                      <tr>
                         <th colSpan={5} className="border border-slate-400 p-1 font-bold">मातृ तथा नवजात शिशु स्याहार</th>
                      </tr>
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1">मृत्यु भएको समय</th>
                         <th colSpan={2} className="border border-slate-400 p-1">मातृ मृत्यु (संख्या)</th>
                         <th colSpan={2} className="border border-slate-400 p-1">नवजात शिशु मृत्यु (संख्या)</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1">गर्भावस्था</th>
                         <th className="border border-slate-400 p-1">प्रसूति अवस्था</th>
                         <th className="border border-slate-400 p-1">०-७ दिन</th>
                         <th className="border border-slate-400 p-1">८-२८ दिन</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">स्वास्थ्य संस्था</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50">स्वास्थ्य संस्था बाहिर</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                      </tr>
                   </tbody>
                </table>

                {/* Safe Abortion Services */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center mt-2">
                   <thead className="bg-orange-200">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1 w-24">सुरक्षित गर्भपतन सेवा</th>
                         <th colSpan={2} className="border border-slate-400 p-1">१२ हप्ता सम्म</th>
                         <th colSpan={2} className="border border-slate-400 p-1">१२ हप्ता माथि</th>
                         <th className="border border-slate-400 p-1">SAS सेवा पाएका</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1">मेडिकल</th>
                         <th className="border border-slate-400 p-1">सर्जिकल</th>
                         <th className="border border-slate-400 p-1">मेडिकल</th>
                         <th className="border border-slate-400 p-1">सर्जिकल</th>
                         <th className="border border-slate-400 p-1"></th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50 text-[10px]">गर्भपतन गरेका महिला &lt;२०</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1 text-[10px]">Induced</td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-1 text-left bg-yellow-50 text-[10px]">गर्भपतन गरेका महिला ≥२०</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         <td className="border border-slate-400 p-1 text-[10px]"></td>
                      </tr>
                   </tbody>
                </table>

                {/* PNC Visits Table */}
                <table className="w-full border-collapse border border-slate-400 text-xs text-center mt-2">
                   <thead className="bg-orange-200">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-1">सुत्केरी जाँच तथा नवजात शिशु स्याहार (पटक)</th>
                         <th colSpan={2} className="border border-slate-400 p-1">स्वास्थ्य संस्थामा भएको प्रसुती</th>
                         <th colSpan={2} className="border border-slate-400 p-1">घरमा भएको प्रसुती</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1 w-10">सुत्केरी</th>
                         <th className="border border-slate-400 p-1 w-10">नवजात शिशु</th>
                         <th className="border border-slate-400 p-1 w-10">सुत्केरी</th>
                         <th className="border border-slate-400 p-1 w-10">नवजात शिशु</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                         'पहिलो पटक (२४ घण्टामा)', 
                         '२ पटक (दोस्रो र तेस्रो पटक)', 
                         '३ पटक (२४ घण्टा, ३ दिन र ७ दिन)',
                         '३ पटक (३ दिन, ७ दिन, २९ दिन)',
                         '४ पटक (२४ घण्टा, ३ दिन, ७ दिन र २९ दिन)'
                      ].map((visit, i) => (
                         <tr key={i}>
                            <td className="border border-slate-400 p-1 text-left bg-yellow-50 text-[10px]">{visit}</td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                            <td className="border border-slate-400 p-1"><input className="w-full text-center border-none focus:bg-yellow-100" /></td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

          </div>

       </div>
    </div>
  );
};
