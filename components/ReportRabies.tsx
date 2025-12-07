
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Printer, Filter, CheckSquare, Square } from 'lucide-react';
import { dbService } from '../services/db';
import { ServiceRecord, UserRole } from '../types';

interface ReportRabiesProps {
  activeOrgId?: string;
  currentUser?: string;
  userRole?: UserRole;
}

export const ReportRabies: React.FC<ReportRabiesProps> = ({ activeOrgId, currentUser, userRole }) => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  
  // Filters
  const [fiscalYear, setFiscalYear] = useState('2081/82');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Stock Data (Manual Input for Report)
  const [openingStock, setOpeningStock] = useState(0);
  const [receivedStock, setReceivedStock] = useState(0);
  
  // Approval & Names
  const [isApproved, setIsApproved] = useState(false);
  const [preparerFullName, setPreparerFullName] = useState('');
  const [approverFullName, setApproverFullName] = useState('');

  const fiscalYears = ['2080/81', '2081/82', '2082/83'];
  const nepaliMonths = [
    "Baisakh (बैशाख)", "Jestha (जेष्ठ)", "Ashad (आषाढ)", "Shrawan (श्रावण)", 
    "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)", 
    "Poush (पुष)", "Magh (माघ)", "Falgun (फाल्गुन)", "Chaitra (चैत्र)"
  ];

  useEffect(() => {
    setSelectedMonth(nepaliMonths[10]); // Default to Falgun
    loadData();
    loadUserDetails();
  }, [activeOrgId, currentUser]);

  const loadUserDetails = async () => {
      if (currentUser) {
          try {
              const user = await dbService.getUser(currentUser);
              if (user) {
                  setPreparerFullName(user.fullName || user.username);
              } else {
                  setPreparerFullName(currentUser);
              }
          } catch (e) {
              setPreparerFullName(currentUser);
          }
      }
  };

  const loadData = async () => {
    try {
      const allRecords = await dbService.getAllServiceRecords();
      let filtered = allRecords.filter(r => r.rabiesData !== undefined);
      
      if (activeOrgId && activeOrgId !== 'ALL') {
        filtered = filtered.filter(r => r.organizationId === activeOrgId);
      }
      setRecords(filtered);
    } catch (e) {
      console.error("Failed to load rabies report", e);
    }
  };

  // ----- Report Logic -----

  const filteredRecords = useMemo(() => {
     if (!selectedMonth) return [];
     
     return records.filter(r => {
        // 1. Priority: Explicitly registered month
        if (r.rabiesData?.registeredMonth) {
           return r.rabiesData.registeredMonth === selectedMonth;
        }
        
        // 2. Fallback: Parse 'dateOfBite' (e.g., 2081-11-05) if month is missing
        if (r.rabiesData?.dateOfBite) {
           const parts = r.rabiesData.dateOfBite.split(/[-/.]/);
           if (parts.length >= 2) {
              const monthNum = parseInt(parts[1]); 
              if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
                 const monthName = nepaliMonths[monthNum - 1]; 
                 return monthName === selectedMonth;
              }
           }
        }
        
        return false; 
     });
  }, [records, selectedMonth]);

  const hydrophobiaCases = useMemo(() => {
     return filteredRecords.filter(r => r.rabiesData?.humanRabiesCase);
  }, [filteredRecords]);

  // Matrix Calculation
  const matrix = useMemo(() => {
     // Rows: Male 15+, Female 15+, Male <15, Female <15
     // Cols: Dog, Monkey, Cat, Cattle, Rodent, Jackal, Tiger, Bear, Saliva, Other
     const animals = ['Dog', 'Monkey', 'Cat', 'Cattle', 'Rodent', 'Jackal', 'Tiger', 'Bear', 'Saliva', 'Other'];
     const rows = ['Male15', 'Female15', 'MaleChild', 'FemaleChild'];
     
     const data: Record<string, Record<string, number>> = {};
     rows.forEach(r => {
        data[r] = {};
        animals.forEach(a => data[r][a] = 0);
        data[r]['Total'] = 0;
     });

     filteredRecords.forEach(r => {
        const age = r.age || 0;
        const gender = (r.gender || '').toLowerCase().trim(); // Normalize
        const animal = r.rabiesData?.animalType || 'Other';
        
        let rowKey = '';
        if (age >= 15) {
           rowKey = (gender === 'male' || gender === 'm') ? 'Male15' : 'Female15';
        } else {
           rowKey = (gender === 'male' || gender === 'm') ? 'MaleChild' : 'FemaleChild';
        }
        
        // Map animal string to key
        let animalKey = 'Other';
        if (animal.includes('Dog') || animal.includes('कुकुर')) animalKey = 'Dog';
        else if (animal.includes('Cat') || animal.includes('बिरालो')) animalKey = 'Cat';
        else if (animal.includes('Monkey') || animal.includes('बाँदर')) animalKey = 'Monkey';
        else if (animal.includes('Jackal') || animal.includes('स्याल')) animalKey = 'Jackal';
        else if (animal.includes('Rodent')) animalKey = 'Rodent';
        else if (animal.includes('Cattle')) animalKey = 'Cattle';
        else if (animal.includes('Tiger')) animalKey = 'Tiger';
        else if (animal.includes('Bear')) animalKey = 'Bear';
        else if (animal.includes('Saliva')) animalKey = 'Saliva';

        if (data[rowKey]) {
           data[rowKey][animalKey] = (data[rowKey][animalKey] || 0) + 1;
           data[rowKey]['Total'] += 1;
        }
     });

     // Calculate Totals
     const totalRow: Record<string, number> = {};
     animals.forEach(a => {
        totalRow[a] = rows.reduce((sum, row) => sum + (data[row][a] || 0), 0);
     });
     totalRow['Total'] = rows.reduce((sum, row) => sum + data[row]['Total'], 0);

     return { data, totalRow, animals };
  }, [filteredRecords]);

  const [expenditureStock, setExpenditureStock] = useState(0);
  
  useEffect(() => {
     // Default expenditure estimate based on cases
     setExpenditureStock(filteredRecords.length * 1); 
  }, [filteredRecords]);

  const balanceStock = openingStock + receivedStock - expenditureStock;

  const handlePrint = () => {
     window.print();
  };

  const handleApprove = () => {
     if (userRole === UserRole.SUB_ADMIN || userRole === UserRole.SUPER_ADMIN) {
        setIsApproved(true);
        setApproverFullName(preparerFullName); // The current user (Admin) is approving
     } else {
        alert("Only Admin/Sub-Admin can approve reports.");
     }
  };

  const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
  const institutionName = activeOrgId === 'ALL' || !activeOrgId || activeOrgId === 'MAIN' ? settings.storeName : activeOrgId;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 bg-white min-h-screen">
       <style>{`
         @media print {
           @page { size: landscape; margin: 5mm; }
           /* Hide everything initially */
           body * {
             visibility: hidden;
           }
           /* Show only report content */
           #printable-report, #printable-report * {
             visibility: visible;
           }
           /* Position report at top left */
           #printable-report {
             position: absolute;
             left: 0;
             top: 0;
             width: 100%;
             margin: 0;
             padding: 0;
             background-color: white;
           }
           /* Ensure colors are printed */
           * {
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
           }
           /* Hide scrollbars and interactive elements */
           ::-webkit-scrollbar { display: none; }
           .no-print { display: none !important; }
         }
       `}</style>

       {/* CONTROLS (Hidden in Print) */}
       <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
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
             
             <div className="flex items-center gap-2 border-l pl-4 border-slate-300">
                <span className="text-xs font-bold text-slate-500">Stock Info:</span>
                <input 
                   type="number" placeholder="Opening" 
                   className="w-20 p-1 text-sm border rounded"
                   value={openingStock} onChange={e => setOpeningStock(Number(e.target.value))}
                />
                <input 
                   type="number" placeholder="Received" 
                   className="w-20 p-1 text-sm border rounded"
                   value={receivedStock} onChange={e => setReceivedStock(Number(e.target.value))}
                />
                <input 
                   type="number" placeholder="Expenditure" 
                   className="w-20 p-1 text-sm border rounded"
                   value={expenditureStock} onChange={e => setExpenditureStock(Number(e.target.value))}
                />
             </div>
          </div>

          <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-slate-900">
             <Printer className="w-4 h-4" /> Print Report
          </button>
       </div>

       {/* REPORT CONTENT */}
       <div id="printable-report" className="p-8 font-serif text-black w-full bg-white">
          
          {/* Header */}
          <div className="text-center mb-6 space-y-1">
             <h4 className="font-bold text-sm uppercase">NG / MOH</h4>
             <h3 className="font-bold text-base uppercase">EPIDEMIOLOGY AND DISEASE CONTROL DIVISION</h3>
             <h2 className="font-bold text-lg uppercase underline decoration-1 underline-offset-4">MONTHLY RECORDS OF POST EXPOSURE TREATMENT OF RABIES IN HUMANS</h2>
          </div>

          {/* Meta Info */}
          <div className="flex justify-between items-end mb-2 text-sm font-bold border-b-2 border-black pb-1">
             <div>Name of the Institution : <span className="font-normal border-b border-dotted border-black px-2">{institutionName}</span></div>
             <div className="flex gap-6">
                <div>Month: <span className="font-normal border-b border-dotted border-black px-2">{selectedMonth}</span></div>
                <div>Year: <span className="font-normal border-b border-dotted border-black px-2">{fiscalYear}</span></div>
             </div>
          </div>

          {/* MAIN TABLE */}
          <div className="overflow-x-auto">
             <table className="w-full border-collapse border border-black text-xs md:text-sm text-center">
                <thead>
                   <tr>
                      <th rowSpan={2} className="border border-black p-1 w-32 bg-slate-100 print:bg-transparent">Discription</th>
                      <th colSpan={10} className="border border-black p-1 bg-slate-50 print:bg-transparent">Source of Exposure to Rabies Animals</th>
                      <th rowSpan={2} className="border border-black p-1 w-16 bg-slate-100 print:bg-transparent">Total cases</th>
                      
                      {/* Stock Headers */}
                      <th className="border border-black p-1 w-20">Previous month opening</th>
                      <th className="border border-black p-1 w-20">Received dose</th>
                      <th className="border border-black p-1 w-20">Expenditure dose</th>
                      <th className="border border-black p-1 w-20">Balance dose</th>
                   </tr>
                   <tr>
                      {matrix.animals.map(a => (
                         <th key={a} className="border border-black p-1 font-normal w-16 text-[10px] sm:text-xs">
                            {a === 'Saliva' ? 'Saliva' : a === 'Other' ? 'Other' : a} <br/> 
                            {a === 'Saliva' ? 'contact' : a === 'Other' ? 'specify' : 'bite'}
                         </th>
                      ))}
                      {/* Stock Placeholders (empty cells for rows 1-4) */}
                      <th className="border border-black bg-gray-400 print:bg-gray-400"></th>
                      <th className="border border-black bg-gray-400 print:bg-gray-400"></th>
                      <th className="border border-black bg-gray-400 print:bg-gray-400"></th>
                      <th className="border border-black bg-gray-400 print:bg-gray-400"></th>
                   </tr>
                </thead>
                <tbody>
                   {/* ROW 1: Male 15+ */}
                   <tr>
                      <td className="border border-black p-2 font-bold text-left">Male (15+Yr)</td>
                      {matrix.animals.map(a => <td key={a} className="border border-black">{matrix.data['Male15'][a] || ''}</td>)}
                      <td className="border border-black font-bold">{matrix.data['Male15']['Total']}</td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                   </tr>
                   {/* ROW 2: Female 15+ */}
                   <tr>
                      <td className="border border-black p-2 font-bold text-left">Female (15+Yr)</td>
                      {matrix.animals.map(a => <td key={a} className="border border-black">{matrix.data['Female15'][a] || ''}</td>)}
                      <td className="border border-black font-bold">{matrix.data['Female15']['Total']}</td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                   </tr>
                   {/* ROW 3: Male Child */}
                   <tr>
                      <td className="border border-black p-2 font-bold text-left">Male Child (&lt;15 Yr)</td>
                      {matrix.animals.map(a => <td key={a} className="border border-black">{matrix.data['MaleChild'][a] || ''}</td>)}
                      <td className="border border-black font-bold">{matrix.data['MaleChild']['Total']}</td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                   </tr>
                   {/* ROW 4: Female Child */}
                   <tr>
                      <td className="border border-black p-2 font-bold text-left">Female Child (&lt;15 Yr)</td>
                      {matrix.animals.map(a => <td key={a} className="border border-black">{matrix.data['FemaleChild'][a] || ''}</td>)}
                      <td className="border border-black font-bold">{matrix.data['FemaleChild']['Total']}</td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                      <td className="border border-black bg-gray-400 print:bg-gray-400"></td>
                   </tr>
                   
                   {/* TOTAL ROW */}
                   <tr className="font-bold">
                      <td className="border border-black p-2 text-left">TOTAL</td>
                      {matrix.animals.map(a => <td key={a} className="border border-black">{matrix.totalRow[a]}</td>)}
                      <td className="border border-black">{matrix.totalRow['Total']}</td>
                      
                      {/* STOCK VALUES */}
                      <td className="border border-black">{openingStock}</td>
                      <td className="border border-black">{receivedStock}</td>
                      <td className="border border-black">{expenditureStock}</td>
                      <td className="border border-black">{balanceStock}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* HYDROPHOBIA CASES */}
          <div className="mt-4 break-inside-avoid">
             <div className="text-center font-bold text-sm uppercase mb-1">IF Hydrophobia cases reported</div>
             <table className="w-full border-collapse border border-black text-xs">
                <thead>
                   <tr>
                      <th className="border border-black p-1">Name</th>
                      <th className="border border-black p-1">Address</th>
                      <th className="border border-black p-1 w-10">Age</th>
                      <th className="border border-black p-1 w-10">Sex</th>
                      <th className="border border-black p-1">Biting Animal</th>
                      <th className="border border-black p-1">Date of Bite</th>
                      <th className="border border-black p-1">Site of Bite</th>
                      <th className="border border-black p-1">Date of Death</th>
                      <th className="border border-black p-1">Remarks</th>
                   </tr>
                </thead>
                <tbody>
                   {hydrophobiaCases.length === 0 ? (
                      [1, 2].map(i => (
                         <tr key={i} className="h-8">
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                            <td className="border border-black"></td>
                         </tr>
                      ))
                   ) : (
                      hydrophobiaCases.map((c, i) => (
                         <tr key={i}>
                            <td className="border border-black p-1">{c.patientName}</td>
                            <td className="border border-black p-1">{c.address}</td>
                            <td className="border border-black p-1">{c.age}</td>
                            <td className="border border-black p-1">{c.gender}</td>
                            <td className="border border-black p-1">{c.rabiesData?.animalType}</td>
                            <td className="border border-black p-1">{c.rabiesData?.dateOfBite}</td>
                            <td className="border border-black p-1">{c.rabiesData?.biteSite}</td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1">{c.findings}</td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>

          {/* FOOTER SIGNATURES */}
          <div className="flex justify-between items-end mt-16 pt-8 break-inside-avoid">
             <div className="text-center w-64">
                <div className="border-t border-dotted border-black mb-2"></div>
                <div className="font-bold">Prepared By:</div>
                <div className="text-sm font-medium">{preparerFullName}</div>
             </div>

             <div className="text-center w-64">
                {isApproved ? (
                   <>
                      <div className="font-script text-xl mb-1 text-blue-800 print:text-black">{approverFullName}</div>
                      <div className="border-t border-dotted border-black mb-2"></div>
                      <div className="font-bold flex items-center justify-center gap-1">
                         Approved By: <CheckSquare className="w-4 h-4 text-green-600 no-print" />
                      </div>
                      <div className="text-sm font-medium">{approverFullName} (Sub-Admin)</div>
                   </>
                ) : (
                   <>
                      {(userRole === UserRole.SUB_ADMIN || userRole === UserRole.SUPER_ADMIN) && (
                          <button 
                             onClick={handleApprove}
                             className="mb-2 bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs border border-blue-200 hover:bg-blue-100 no-print"
                          >
                             Click to Approve
                          </button>
                      )}
                      <div className="border-t border-dotted border-black mb-2"></div>
                      <div className="font-bold">Approved By:</div>
                   </>
                )}
             </div>
          </div>

       </div>
    </div>
  );
};
