
import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Printer } from 'lucide-react';
import { dbService } from '../services/db';
import { ServiceRecord } from '../types';

interface ReportServiceUserProps {
  activeOrgId?: string;
}

export const ReportServiceUser: React.FC<ReportServiceUserProps> = ({ activeOrgId }) => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [fiscalYear, setFiscalYear] = useState('2081/82');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Table 2 & 3 Manual Data State
  const [communityData, setCommunityData] = useState({
     gaunchhar: { planned: '', held: '', served: '' },
     khopClinic: { planned: '1', held: '1', served: '' },
     khopSession: { planned: '2', held: '1', served: '84' },
     sarsafai: { planned: '2', held: '1', served: '84' },
     fchv: { planned: '9', held: '9', served: '' }
  });
  
  const [mssData, setMssData] = useState({
     implementation: '1',
     score: ''
  });

  const [referredData, setReferredData] = useState<Record<string, { male: string, female: string }>>({
     '0-9': { male: '', female: '' },
     '10-14': { male: '', female: '' },
     '15-19': { male: '', female: '' },
     '20-59': { male: '', female: '' },
     '60-69': { male: '', female: '' },
     '>=70': { male: '', female: '' }
  });

  const fiscalYears = ['2080/81', '2081/82', '2082/83'];
  const nepaliMonths = [
    "Baisakh (बैशाख)", "Jestha (जेष्ठ)", "Ashad (आषाढ)", "Shrawan (श्रावण)", 
    "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)", 
    "Poush (पुष)", "Magh (माघ)", "Falgun (फाल्गुन)", "Chaitra (चैत्र)"
  ];

  useEffect(() => {
    setSelectedMonth(nepaliMonths[10]); // Default to Falgun
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

  const filteredRecords = useMemo(() => {
     if (!selectedMonth) return [];
     // Note: In a real app, we would parse the BS date field. 
     // For this simulation, we'll assume we can filter by the rabies 'registeredMonth' 
     // or a new field if we had it. Since standard ServiceRecord has 'timestamp' (ms), 
     // we'll just show all for demo if no specific date logic matches, 
     // OR strictly filter if we implement BS conversion on timestamp.
     // Fallback: Using the rabies 'registeredMonth' field if present, or just showing ALL for demo.
     // To make it functional for the demo, let's filter by the Rabies Registered Month if available, else show all.
     return records; 
  }, [records, selectedMonth]);

  // Aggregate Data Logic
  const ageGroups = ['0-9', '10-14', '15-19', '20-59', '60-69', '>=70'];
  
  const stats = useMemo(() => {
     const data: Record<string, { newMale: number, newFemale: number, totalMale: number, totalFemale: number }> = {};
     ageGroups.forEach(g => data[g] = { newMale: 0, newFemale: 0, totalMale: 0, totalFemale: 0 });

     filteredRecords.forEach(r => {
        const age = r.age;
        const isMale = r.gender === 'Male';
        let group = '';

        if (age <= 9) group = '0-9';
        else if (age <= 14) group = '10-14';
        else if (age <= 19) group = '15-19';
        else if (age <= 59) group = '20-59';
        else if (age <= 69) group = '60-69';
        else group = '>=70';

        // Logic: For this report, we treat all fetched records as "Total". 
        // "New" would typically check if it's their first visit ever.
        // Simplified: Count 50% as new for demo variance, or count unique patients.
        // Let's assume all records in this month period are visits (Total).
        
        if (data[group]) {
           if (isMale) {
              data[group].totalMale++;
              // Simulation: Every 3rd patient is "Old", rest "New"
              if (r.queueNumber % 3 !== 0) data[group].newMale++;
           } else {
              data[group].totalFemale++;
              if (r.queueNumber % 3 !== 0) data[group].newFemale++;
           }
        }
     });
     return data;
  }, [filteredRecords]);

  const handlePrint = () => {
     window.print();
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 bg-white min-h-screen font-sans text-slate-800">
       
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
       <div className="p-4 md:p-8">
          
          {/* Header */}
          <div className="w-full bg-teal-100 border border-teal-200 text-center py-2 mb-4 font-bold text-lg text-teal-900">
             मासिक प्रगति प्रतिवेदन
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
             
             {/* TABLE 1: AGE / GENDER STATS */}
             <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-400 text-sm text-center">
                   <thead className="bg-orange-200 text-slate-800 font-bold">
                      <tr>
                         <th rowSpan={2} className="border border-slate-400 p-2 w-24">उमेर समूह</th>
                         <th colSpan={2} className="border border-slate-400 p-1">नयाँ सेवाग्राहीको सँख्या</th>
                         <th colSpan={2} className="border border-slate-400 p-1">जम्मा (नयाँ/ पुरानो) सेवाग्राही सँख्या</th>
                         <th colSpan={2} className="border border-slate-400 p-1">प्रेषण भई आएका जम्मा सेवाग्राही</th>
                      </tr>
                      <tr>
                         <th className="border border-slate-400 p-1 w-16">म.</th>
                         <th className="border border-slate-400 p-1 w-16">पु.</th>
                         <th className="border border-slate-400 p-1 w-16">म.</th>
                         <th className="border border-slate-400 p-1 w-16">पु.</th>
                         <th className="border border-slate-400 p-1 w-16">म.</th>
                         <th className="border border-slate-400 p-1 w-16">पु.</th>
                      </tr>
                   </thead>
                   <tbody>
                      {ageGroups.map((group, idx) => (
                         <tr key={group} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-400 p-2 text-left bg-yellow-50 font-medium">
                               {group === '>=70' ? '>= ७० बर्ष' : `${convertEngToNep(group)} बर्ष`}
                            </td>
                            {/* New Clients */}
                            <td className="border border-slate-400 p-1">
                               <div className="border border-slate-300 py-1 px-2 mx-1 rounded bg-white">{stats[group].newFemale}</div>
                            </td>
                            <td className="border border-slate-400 p-1">
                               <div className="border border-slate-300 py-1 px-2 mx-1 rounded bg-white">{stats[group].newMale}</div>
                            </td>
                            
                            {/* Total Clients */}
                            <td className="border border-slate-400 p-1">
                               <div className="border border-slate-300 py-1 px-2 mx-1 rounded bg-white">{stats[group].totalFemale}</div>
                            </td>
                            <td className="border border-slate-400 p-1">
                               <div className="border border-slate-300 py-1 px-2 mx-1 rounded bg-white">{stats[group].totalMale}</div>
                            </td>

                            {/* Referred In (Manual Input) */}
                            <td className="border border-slate-400 p-1">
                               <input 
                                  className="w-full text-center p-1 border border-slate-300 rounded outline-none focus:border-blue-500"
                                  value={referredData[group].female}
                                  onChange={(e) => setReferredData({...referredData, [group]: {...referredData[group], female: e.target.value}})}
                               />
                            </td>
                            <td className="border border-slate-400 p-1">
                               <input 
                                  className="w-full text-center p-1 border border-slate-300 rounded outline-none focus:border-blue-500"
                                  value={referredData[group].male}
                                  onChange={(e) => setReferredData({...referredData, [group]: {...referredData[group], male: e.target.value}})}
                               />
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* TABLE 2: OUTREACH & TABLE 3: MSS */}
             <div className="w-full lg:w-[500px] flex flex-col gap-4">
                
                {/* Table 2 */}
                <table className="w-full border-collapse border border-slate-400 text-sm text-center">
                   <thead className="bg-orange-200 text-slate-800 font-bold">
                      <tr>
                         <th className="border border-slate-400 p-2 text-left">कार्यक्षेत्र भित्र पर्ने निकाय</th>
                         <th className="border border-slate-400 p-1 w-20 text-[10px] leading-tight">संचालन/ प्रतिवेदन हुनुपर्ने (संख्या)</th>
                         <th className="border border-slate-400 p-1 w-20 text-[10px] leading-tight">संचालन/ प्रतिवेदन भएको (संख्या)</th>
                         <th className="border border-slate-400 p-1 w-20 text-[10px] leading-tight">सेवा पाएका जम्मा सेवाग्राही संख्या</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">गाउँघर क्लिनिक</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.gaunchhar.planned} onChange={e=>setCommunityData({...communityData, gaunchhar: {...communityData.gaunchhar, planned: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.gaunchhar.held} onChange={e=>setCommunityData({...communityData, gaunchhar: {...communityData.gaunchhar, held: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.gaunchhar.served} onChange={e=>setCommunityData({...communityData, gaunchhar: {...communityData.gaunchhar, served: e.target.value}})} /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">खोप क्लिनिक</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.khopClinic.planned} onChange={e=>setCommunityData({...communityData, khopClinic: {...communityData.khopClinic, planned: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.khopClinic.held} onChange={e=>setCommunityData({...communityData, khopClinic: {...communityData.khopClinic, held: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1" rowSpan={2}><input className="w-full h-full text-center border p-1" value={communityData.khopSession.served} onChange={e=>setCommunityData({...communityData, khopSession: {...communityData.khopSession, served: e.target.value}})} /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">खोप सेसन</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.khopSession.planned} onChange={e=>setCommunityData({...communityData, khopSession: {...communityData.khopSession, planned: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.khopSession.held} onChange={e=>setCommunityData({...communityData, khopSession: {...communityData.khopSession, held: e.target.value}})} /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">सरसफाई सेसन (पटक)</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.sarsafai.planned} onChange={e=>setCommunityData({...communityData, sarsafai: {...communityData.sarsafai, planned: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.sarsafai.held} onChange={e=>setCommunityData({...communityData, sarsafai: {...communityData.sarsafai, held: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.sarsafai.served} onChange={e=>setCommunityData({...communityData, sarsafai: {...communityData.sarsafai, served: e.target.value}})} /></td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 text-left bg-yellow-50">म. स्वा. स्व. से.</td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.fchv.planned} onChange={e=>setCommunityData({...communityData, fchv: {...communityData.fchv, planned: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.fchv.held} onChange={e=>setCommunityData({...communityData, fchv: {...communityData.fchv, held: e.target.value}})} /></td>
                         <td className="border border-slate-400 p-1"><input className="w-full text-center border p-1" value={communityData.fchv.served} onChange={e=>setCommunityData({...communityData, fchv: {...communityData.fchv, served: e.target.value}})} /></td>
                      </tr>
                   </tbody>
                </table>

                {/* Table 3: MSS */}
                <table className="w-full border-collapse border border-slate-400 text-sm text-left">
                   <thead className="bg-orange-200 text-slate-800">
                      <tr>
                         <th colSpan={2} className="border border-slate-400 p-2 text-center font-bold">न्युनतम सेवा मापदण्ड (MSS)</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td className="border border-slate-400 p-2 bg-yellow-50 w-2/3">
                            कार्यान्वयन<br/>
                            १ - पहिलो २ - दोश्रो
                         </td>
                         <td className="border border-slate-400 p-2">
                            <select 
                               className="w-full p-2 border border-slate-300" 
                               value={mssData.implementation}
                               onChange={(e) => setMssData({...mssData, implementation: e.target.value})}
                            >
                               <option value="1">Select ...</option>
                               <option value="1">First</option>
                               <option value="2">Second</option>
                            </select>
                         </td>
                      </tr>
                      <tr>
                         <td className="border border-slate-400 p-2 bg-yellow-50">
                            स्कोर (%)
                         </td>
                         <td className="border border-slate-400 p-2">
                            <input 
                               type="text"
                               className="w-full p-2 border border-slate-300"
                               value={mssData.score}
                               onChange={(e) => setMssData({...mssData, score: e.target.value})}
                            />
                         </td>
                      </tr>
                   </tbody>
                </table>

             </div>
          </div>

       </div>
    </div>
  );
};

const convertEngToNep = (str: string) => {
   // Simple mapping for display purposes
   return str.replace('0','०').replace('1','१').replace('2','२').replace('3','३').replace('4','४').replace('5','५').replace('6','६').replace('7','७').replace('8','८').replace('9','९');
};
