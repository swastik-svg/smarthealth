
import React, { useState, useEffect } from 'react';
import { FlaskConical, Search, Save, X, Microscope, CheckCircle2 } from 'lucide-react';
import { dbService } from '../services/db';
import { ServiceRecord, LabTest } from '../types';

export const Pathology: React.FC = () => {
  const [activeRecords, setActiveRecords] = useState<ServiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadLabRequests();
  }, []);

  const loadLabRequests = async () => {
    try {
      const allRecords = await dbService.getAllServiceRecords();
      // Filter records that have lab requests where at least one is pending
      const pendingLabRecords = allRecords.filter(r => 
        r.labRequests && r.labRequests.length > 0 && r.labRequests.some(l => l.status === 'PENDING')
      );
      setActiveRecords(pendingLabRecords.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error("Failed to load lab requests", e);
    }
  };

  const filteredRecords = activeRecords.filter(r => 
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectRecord = (record: ServiceRecord) => {
    setSelectedRecord(record);
    // Initialize current results map
    const initialResults: { [key: string]: string } = {};
    record.labRequests?.forEach(t => {
       initialResults[t.id] = t.result || '';
    });
    setTestResults(initialResults);
  };

  const handleResultChange = (testId: string, val: string) => {
     setTestResults(prev => ({...prev, [testId]: val}));
  };

  const handleCompleteLab = async () => {
     if (!selectedRecord || !selectedRecord.labRequests) return;

     // Update the record's lab requests
     const updatedLabTests: LabTest[] = selectedRecord.labRequests.map(t => {
        if (testResults[t.id]) {
           return { ...t, result: testResults[t.id], status: 'COMPLETED' };
        }
        return t;
     });

     try {
        await dbService.updateLabResults(selectedRecord.id, updatedLabTests);
        
        // Refresh local list
        await loadLabRequests();
        setSelectedRecord(null);
     } catch (e) {
        alert("नतिजा सुरक्षित गर्न असफल");
     }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FlaskConical className="w-8 h-8 text-purple-600" /> प्याथोलोजी ल्याब (Pathology Lab)
             </h2>
             <p className="text-slate-500 text-sm">पेन्डिङ परीक्षणहरू व्यवस्थापन र नतिजा प्रविष्टि गर्नुहोस्।</p>
          </div>
          <div className="relative w-full md:w-80">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="बिरामीको नाम वा ID खोज्नुहोस्..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
             />
          </div>
       </div>

       <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          
          {/* List of Pending Patients */}
          <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">पेन्डिङ अनुरोधहरू</h3>
             </div>
             <div className="overflow-y-auto p-2 space-y-2 flex-1 custom-scrollbar">
                {filteredRecords.length === 0 ? (
                   <div className="text-center py-10 text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">कुनै पेन्डिङ ल्याब अनुरोध छैन।</p>
                   </div>
                ) : (
                   filteredRecords.map(record => (
                      <div 
                         key={record.id} 
                         onClick={() => handleSelectRecord(record)}
                         className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedRecord?.id === record.id 
                            ? 'bg-purple-50 border-purple-200 shadow-sm' 
                            : 'bg-white border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                         }`}
                      >
                         <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-800">{record.patientName}</span>
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{record.patientId}</span>
                         </div>
                         <div className="text-xs text-slate-500 mb-2">{new Date(record.timestamp).toLocaleString()}</div>
                         <div className="flex flex-wrap gap-1">
                            {record.labRequests?.filter(l => l.status === 'PENDING').map((l, i) => (
                               <span key={i} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                                  {l.testName}
                               </span>
                            ))}
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>

          {/* Details & Result Entry */}
          <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
             {selectedRecord ? (
                <>
                   <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                      <div>
                         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Microscope className="w-5 h-5 text-purple-600" />
                            {selectedRecord.patientName}
                         </h3>
                         <p className="text-sm text-slate-500">ID: {selectedRecord.patientId} • Age: {selectedRecord.age} • Gender: {selectedRecord.gender}</p>
                      </div>
                      <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600">
                         <X className="w-5 h-5" />
                      </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                         <h4 className="text-sm font-bold text-purple-800 mb-2">अनुरोध गरिएका परीक्षणहरू</h4>
                         <div className="space-y-4">
                            {selectedRecord.labRequests?.map((test) => (
                               <div key={test.id} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                  <div className="flex justify-between items-center mb-3">
                                     <span className="font-bold text-slate-700">{test.testName}</span>
                                     <span className={`text-xs px-2 py-1 rounded font-medium ${test.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {test.status}
                                     </span>
                                  </div>
                                  <div className="space-y-1">
                                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Result / Report</label>
                                     <textarea 
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="नतिजा यहाँ लेख्नुहोस्..."
                                        rows={2}
                                        value={testResults[test.id] || ''}
                                        onChange={(e) => handleResultChange(test.id, e.target.value)}
                                     ></textarea>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                      <button 
                         onClick={handleCompleteLab}
                         className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all active:scale-95"
                      >
                         <Save className="w-4 h-4" />
                         नतिजा सुरक्षित गर्नुहोस्
                      </button>
                   </div>
                </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                   <Microscope className="w-16 h-16 opacity-10 mb-4" />
                   <p className="text-lg font-medium">ल्याब नतिजा प्रविष्टि गर्न बिरामी छान्नुहोस्</p>
                </div>
             )}
          </div>

       </div>
    </div>
  );
};
