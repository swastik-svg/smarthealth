
import React, { useState } from 'react';
import { Filter, Printer } from 'lucide-react';

interface ReportORCProps {
  activeOrgId?: string;
}

export const ReportORC: React.FC<ReportORCProps> = ({ activeOrgId }) => {
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
          <div className="w-full bg-orange-200 border border-orange-300 text-center py-2 mb-1 font-bold text-lg text-slate-800">
             क. गाउँघर क्लिनिक र समुदाय स्तर स्वास्थ्य कार्यक्रम
          </div>

          <div className="flex flex-col xl:flex-row gap-2">
             
             {/* LEFT COLUMN */}
             <div className="flex-1 min-w-[400px]">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                   <thead className="bg-slate-200">
                      <tr>
                         <th className="border border-slate-400 p-1 font-bold text-lg w-10">1</th>
                         <th className="border border-slate-400 p-1 font-bold text-lg w-16">2</th>
                      </tr>
                   </thead>
                   <tbody>
                      {/* Primary Care */}
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">प्राथमिक उपचार गरेका</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>

                      {/* Growth Monitoring 0-11 */}
                      <tr>
                         <td className="border border-slate-400 p-0">
                            <div className="flex h-full">
                               <div className="w-24 p-2 flex items-center bg-yellow-50 border-r border-slate-400 text-left font-bold" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>तौल अनुगमन गरेका</div>
                               <div className="flex-1 border-r border-slate-400">
                                  <div className="p-2 h-full flex items-center justify-center bg-yellow-50 border-b border-slate-400">०-११ महिना</div>
                               </div>
                               <div className="w-32 flex flex-col">
                                  <div className="p-2 border-b border-slate-400 bg-yellow-50">सामान्य</div>
                                  <div className="p-2 border-b border-slate-400 bg-yellow-50">जोखिम</div>
                                  <div className="p-2 bg-yellow-50">अति जोखिम</div>
                               </div>
                            </div>
                         </td>
                         <td className="border border-slate-400 p-0 align-top">
                            <div className="flex flex-col h-full">
                               <input className="flex-1 text-center border-b border-slate-400 focus:bg-yellow-100 py-2" />
                               <input className="flex-1 text-center border-b border-slate-400 focus:bg-yellow-100 py-2" />
                               <input className="flex-1 text-center focus:bg-yellow-100 py-2" />
                            </div>
                         </td>
                      </tr>

                      {/* Growth Monitoring 12-23 */}
                      <tr>
                         <td className="border border-slate-400 p-0">
                            <div className="flex h-full">
                               <div className="w-24 bg-yellow-50 border-r border-slate-400"></div>
                               <div className="flex-1 border-r border-slate-400">
                                  <div className="p-2 h-full flex items-center justify-center bg-yellow-50 border-b border-slate-400">१२-२३ महिना</div>
                               </div>
                               <div className="w-32 flex flex-col">
                                  <div className="p-2 border-b border-slate-400 bg-yellow-50">सामान्य</div>
                                  <div className="p-2 border-b border-slate-400 bg-yellow-50">जोखिम</div>
                                  <div className="p-2 bg-yellow-50">अति जोखिम</div>
                               </div>
                            </div>
                         </td>
                         <td className="border border-slate-400 p-0 align-top">
                            <div className="flex flex-col h-full">
                               <input className="flex-1 text-center border-b border-slate-400 focus:bg-yellow-100 py-2" />
                               <input className="flex-1 text-center border-b border-slate-400 focus:bg-yellow-100 py-2" />
                               <input className="flex-1 text-center focus:bg-yellow-100 py-2" />
                            </div>
                         </td>
                      </tr>

                      {/* Other Services */}
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">गर्भ जाँच गरेका महिला</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">सुत्केरी जाँच गरेका महिला</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">जुकाको औषधी पाएका गर्भवती</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">जन्मेको ६ महिनासम्म स्तनपान मात्र गराएको</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">६ महिनापछि स्तनपानका साथै ठोस, अर्धठोस र नरम खाना सुरु गरेका</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* RIGHT COLUMN */}
             <div className="flex-1 min-w-[400px]">
                <table className="w-full border-collapse border border-slate-400 text-xs text-center h-full">
                   <thead className="bg-slate-200">
                      <tr>
                         <th className="border border-slate-400 p-1 font-bold text-lg">3</th>
                         <th className="border border-slate-400 p-1 font-bold text-lg w-16">4</th>
                      </tr>
                   </thead>
                   <tbody>
                      {/* Iron Distribution */}
                      <tr>
                         <td className="border border-slate-400 p-0">
                            <div className="flex h-full">
                               <div className="w-24 p-2 flex items-center bg-yellow-50 border-r border-slate-400 text-left font-bold">आइरन चक्की वितरण</div>
                               <div className="flex-1 flex flex-col">
                                  <div className="p-2 border-b border-slate-400 bg-yellow-50 text-left">नयाँ गर्भवती</div>
                                  <div className="p-2 border-b border-slate-400 bg-yellow-50 text-left">दोहोर्याई आएका</div>
                                  <div className="p-2 bg-yellow-50 text-left">सुत्केरी महिला</div>
                               </div>
                            </div>
                         </td>
                         <td className="border border-slate-400 p-0 align-top">
                            <div className="flex flex-col h-full">
                               <input className="flex-1 text-center border-b border-slate-400 focus:bg-yellow-100 py-2" />
                               <input className="flex-1 text-center border-b border-slate-400 focus:bg-yellow-100 py-2" />
                               <input className="flex-1 text-center focus:bg-yellow-100 py-2" />
                            </div>
                         </td>
                      </tr>

                      {/* Vitamin A */}
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">भिटामिन ए पाएका सुत्केरी महिला</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>

                      {/* Family Planning */}
                      <tr>
                         <td className="border border-slate-400 p-0">
                            <div className="flex h-full">
                               <div className="w-24 p-2 flex items-center bg-yellow-50 border-r border-slate-400 text-left font-bold">प. नि. साधन वितरण</div>
                               <div className="flex-1 flex flex-col">
                                  <div className="flex border-b border-slate-400">
                                     <div className="w-20 p-2 bg-yellow-50 border-r border-slate-400">कण्डम</div>
                                     <div className="flex-1 p-2 bg-yellow-50 text-left">गोटा</div>
                                  </div>
                                  <div className="flex border-b border-slate-400 h-16">
                                     <div className="w-20 p-2 bg-yellow-50 border-r border-slate-400 flex items-center">पिल्स</div>
                                     <div className="flex-1 flex flex-col">
                                        <div className="p-1 border-b border-slate-400 bg-yellow-50 text-left h-8">जना</div>
                                        <div className="p-1 bg-yellow-50 text-left h-8">साइकल</div>
                                     </div>
                                  </div>
                                  <div className="flex border-b border-slate-400">
                                     <div className="w-20 p-2 bg-yellow-50 border-r border-slate-400">डिपो</div>
                                     <div className="flex-1 p-2 bg-yellow-50 text-left">डोज</div>
                                  </div>
                                  <div className="flex border-b border-slate-400">
                                     <div className="w-20 p-2 bg-yellow-50 border-r border-slate-400">सायना प्रेस</div>
                                     <div className="flex-1 p-2 bg-yellow-50 text-left">डोज</div>
                                  </div>
                                  <div className="flex">
                                     <div className="w-20 p-2 bg-yellow-50 border-r border-slate-400 text-[10px]">आकस्मिक चक्की</div>
                                     <div className="flex-1 p-2 bg-yellow-50 text-left">डोज</div>
                                  </div>
                               </div>
                            </div>
                         </td>
                         <td className="border border-slate-400 p-0 align-top">
                            <div className="flex flex-col h-full">
                               <div className="h-[37px] border-b border-slate-400"><input className="w-full h-full text-center focus:bg-yellow-100" /></div>
                               <div className="h-[32px] border-b border-slate-400"><input className="w-full h-full text-center focus:bg-yellow-100" /></div>
                               <div className="h-[32px] border-b border-slate-400"><input className="w-full h-full text-center focus:bg-yellow-100" /></div>
                               <div className="h-[37px] border-b border-slate-400"><input className="w-full h-full text-center focus:bg-yellow-100" /></div>
                               <div className="h-[37px] border-b border-slate-400"><input className="w-full h-full text-center focus:bg-yellow-100" /></div>
                               <div className="h-[48px]"><input className="w-full h-full text-center focus:bg-yellow-100" /></div>
                            </div>
                         </td>
                      </tr>

                      {/* TB Tracing */}
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">उपचारमा नियमित नभएका बिरामीको खोज गरेको संख्या (क्षयरोग)</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>

                      {/* Malaria */}
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">रक्त नमुना संकलन गरेको स्लाइड संख्या</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>

                      {/* Mother Group */}
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">आमा समूहको बैठकमा भाग लिएको</td>
                         <td className="border border-slate-400 p-2"><input className="w-full text-center border p-1 rounded" /></td>
                      </tr>

                   </tbody>
                </table>
             </div>

          </div>

       </div>
    </div>
  );
};
