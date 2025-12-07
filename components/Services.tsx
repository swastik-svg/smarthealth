
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, UserPlus, Clock, CheckCircle2, ChevronRight, History, 
  FileText, Activity, Save, X, Stethoscope, Zap, HeartPulse, Cross, 
  Syringe, PawPrint, AlertCircle, Calendar, Printer, ClipboardList
} from 'lucide-react';
import { dbService } from '../services/db';
import { addDaysToBS, getCurrentDateBS } from '../services/dateUtils';
import { 
  Medicine, ServiceRecord, UserPermissions, AppView, ServiceStatus, 
  PrescriptionItem, LabTest, ServiceItemRequest, RabiesData, Sale, ServiceCatalogItem 
} from '../types';

interface ServicesProps {
  inventory: Medicine[];
  onServiceComplete?: (updatedInventory: Medicine[], newSale: Sale) => void;
  permissions: UserPermissions;
  activeOrgId?: string;
  department: string;
  title: string;
  autoOpenRegistration?: boolean;
  preSelectedService?: string;
}

export const Services: React.FC<ServicesProps> = ({ 
  inventory, onServiceComplete, permissions, activeOrgId, department, title, autoOpenRegistration, preSelectedService 
}) => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Service Catalog
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalogItem[]>([]);

  // Registration Form State
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    age: '',
    address: '',
    contactNo: '',
    gender: 'Male',
    ethnicity: '1 - Dalit',
    serviceType: '',
    cost: 0,
    department: ''
  });

  // Consultation State
  const [activeConsultation, setActiveConsultation] = useState<ServiceRecord | null>(null);
  const [findings, setFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  
  // Prescription State
  const [prescriptionList, setPrescriptionList] = useState<PrescriptionItem[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('1-0-1');
  const [duration, setDuration] = useState('');
  const [qty, setQty] = useState(0);

  // Lab Request State
  const [labRequestList, setLabRequestList] = useState<LabTest[]>([]);
  const [newLabTestName, setNewLabTestName] = useState('');
  const [showLabSuggestions, setShowLabSuggestions] = useState(false);

  // Service Request State
  const [serviceRequestList, setServiceRequestList] = useState<ServiceItemRequest[]>([]);
  const [requestCategory, setRequestCategory] = useState<string>('X_RAY');
  const [selectedRequestItem, setSelectedRequestItem] = useState('');

  // History State
  const [selectedHistory, setSelectedHistory] = useState<ServiceRecord | null>(null);

  // RABIES FORM STATE
  const [isRabiesModalOpen, setIsRabiesModalOpen] = useState(false);
  const [tempDemographics, setTempDemographics] = useState({ age: '', gender: '' });
  const [rabiesFormData, setRabiesFormData] = useState<RabiesData>({
      previousRecord: 'No',
      dateOfBite: '2081-01-01',
      animalType: 'Dog',
      biteSite: 'Leg',
      exposureNature: 'Bite',
      skinBroken: true,
      woundBleeding: true,
      whoCategory: 'II',
      humanRabiesCase: false,
      schedule: { 
         day0: '2081-01-01', day3: null, day7: null, day14: null, day28: null,
         day0Given: false, day3Given: false, day7Given: false, day14Given: false, day28Given: false
      },
      registeredMonth: ''
  });

  // Constants - Nepali Labels
  const DEPARTMENT_LABELS: Record<string, string> = {
    [AppView.GENERAL_TREATMENT]: 'जनरल उपचार (OPD)',
    [AppView.X_RAY]: 'एक्स-रे सेवा (X-Ray)',
    [AppView.USG]: 'भिडियो एक्स-रे (USG)',
    [AppView.ECG]: 'ई.सी.जी. सेवा (ECG)',
    [AppView.DRESSING_MINOR_OT]: 'ड्रेसिङ र माइनर ओ.टी.',
    [AppView.MCH]: 'मातृ तथा नवजात शिशु (MCH)',
    [AppView.IMMUNIZATION]: 'खोप सेवा (Immunization)',
    [AppView.TB_LEPROSY]: 'क्षयरोग तथा कुष्ठरोग',
    [AppView.NUTRITION]: 'पोषण क्लिनिक (Nutrition)',
    [AppView.CBIMNCI]: 'बाल रोग (CBIMNCI)',
    [AppView.COMMUNICABLE]: 'सरुवा रोग (Communicable)',
    [AppView.NON_COMMUNICABLE]: 'नसर्ने रोग (Non-Communicable)',
  };

  const NEPALI_MONTHS = [
    "Baisakh (बैशाख)", "Jestha (जेष्ठ)", "Ashad (आषाढ)", "Shrawan (श्रावण)", 
    "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)", 
    "Poush (पुष)", "Magh (माघ)", "Falgun (फाल्गुन)", "Chaitra (चैत्र)"
  ];

  const COMMON_LAB_TESTS = [
      "CBC (Complete Blood Count)", "Hemoglobin", "Blood Grouping", 
      "Urine Routine / Microscopic", "Stool Routine / Microscopic",
      "Blood Sugar Fasting", "Blood Sugar PP", "Blood Sugar Random", "HbA1c",
      "Lipid Profile", "Cholesterol Total", "Triglycerides", "HDL Cholesterol", "LDL Cholesterol",
      "Liver Function Test (LFT)", "Bilirubin Total", "Bilirubin Direct", "SGOT (AST)", "SGPT (ALT)", "Alkaline Phosphatase",
      "Renal Function Test (RFT)", "Urea", "Creatinine", "Uric Acid",
      "Sodium (Na+)", "Potassium (K+)", "Calcium",
      "Thyroid Function Test (TFT)", "T3", "T4", "TSH",
      "Widal Test", "Dengue NS1 Ag", "HBsAg", "HCV", "HIV I & II", "VDRL"
  ];

  const frequencyOptions = [
    { label: 'OD - दिनको एक पटक (1-0-0)', value: '1-0-0', multiplier: 1 },
    { label: 'BID - दिनको दुई पटक (1-0-1)', value: '1-0-1', multiplier: 2 },
    { label: 'TDS - दिनको तीन पटक (1-1-1)', value: '1-1-1', multiplier: 3 },
    { label: 'QID - चार पटक (1-1-1-1)', value: '1-1-1-1', multiplier: 4 },
    { label: 'HS - राती सुत्ने बेला (0-0-1)', value: '0-0-1', multiplier: 1 },
    { label: 'SOS - आवश्यक पर्दा (As Needed)', value: 'SOS', multiplier: 0 },
  ];

  // Effects & Data Loading
  useEffect(() => {
    loadRecords();
    loadServiceCatalog();
  }, [activeOrgId, department]);

  useEffect(() => {
    if (autoOpenRegistration && permissions.patientRegister && activeOrgId !== 'ALL') {
       handleOpenModal();
    }
  }, [autoOpenRegistration, permissions.patientRegister, activeOrgId, preSelectedService]);

  useEffect(() => {
    if (!duration) return;
    const selectedFreq = frequencyOptions.find(f => f.value === freq);
    const multiplier = selectedFreq ? selectedFreq.multiplier : 0;
    const days = parseInt(duration) || 0;
    if (multiplier > 0 && days > 0) {
      setQty(multiplier * days);
    }
  }, [freq, duration]);

  useEffect(() => {
     if (isRabiesModalOpen && rabiesFormData.schedule.day0) {
         const d0 = rabiesFormData.schedule.day0;
         setRabiesFormData(prev => ({
             ...prev,
             schedule: {
                 ...prev.schedule,
                 day3: addDaysToBS(d0, 3),
                 day7: addDaysToBS(d0, 7),
                 day14: addDaysToBS(d0, 14),
                 day28: addDaysToBS(d0, 28)
             }
         }));
     }
  }, [rabiesFormData.schedule.day0, isRabiesModalOpen]);

  const loadServiceCatalog = async () => {
     try {
        const catalog = await dbService.getAllServices();
        setServicesCatalog(catalog);
     } catch (e) {
        console.error("Failed to load service catalog");
     }
  };

  const loadRecords = async () => {
    try {
      const allRecords = await dbService.getAllServiceRecords();
      let filtered = allRecords;
      if (activeOrgId && activeOrgId !== 'ALL') {
          filtered = allRecords.filter(r => r.organizationId === activeOrgId);
      }
      
      if (preSelectedService && preSelectedService.includes('Rabies')) {
          filtered = filtered.filter(r => 
             r.department === AppView.COMMUNICABLE || r.serviceType.toLowerCase().includes('rabies')
          );
      } else {
          filtered = filtered.filter(r => {
             const recordDept = r.department || AppView.GENERAL_TREATMENT;
             return recordDept === department;
          });
      }

      setRecords(filtered.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error("Failed to load records", e);
    }
  };

  // Memos
  const currentServicesList = useMemo(() => {
     return servicesCatalog.filter(s => s.category === department);
  }, [servicesCatalog, department]);

  const displayRecords = useMemo(() => {
     return records.filter(r => 
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.patientId.toLowerCase().includes(searchTerm.toLowerCase())
     );
  }, [records, searchTerm]);

  const filteredMeds = useMemo(() => {
     if (!medSearch) return [];
     return inventory.filter(m => 
       (m.name.toLowerCase().includes(medSearch.toLowerCase()) || 
       m.genericName.toLowerCase().includes(medSearch.toLowerCase())) && m.stock > 0
     );
  }, [medSearch, inventory]);

  const filteredLabTests = useMemo(() => {
     if (!newLabTestName) return [];
     const catalogTests = servicesCatalog.filter(s => s.category === 'LAB').map(s => s.name);
     const allTests = Array.from(new Set([...catalogTests, ...COMMON_LAB_TESTS]));
     return allTests.filter(t => t.toLowerCase().includes(newLabTestName.toLowerCase()));
  }, [newLabTestName, servicesCatalog]);
  
  const filteredServiceRequests = useMemo(() => {
      if(!requestCategory) return [];
      return servicesCatalog.filter(s => s.category === requestCategory);
  }, [requestCategory, servicesCatalog]);

  const patientFullHistory = useMemo(() => {
    if (!selectedHistory) return [];
    return records.filter(r => 
      r.patientId === selectedHistory.patientId && 
      r.status === 'COMPLETED' &&
      r.id !== selectedHistory.id 
    );
  }, [selectedHistory, records]);

  // Handlers
  const generateUniqueId = () => {
    const prefix = "PAT";
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000); 
    return `${prefix}-${year}-${random}`;
  };

  const handleOpenModal = () => {
    if (!permissions.patientRegister) return; 
    if (activeOrgId === 'ALL') {
        alert("कृपया बिरामी दर्ता गर्नको लागि एक विशिष्ट संस्था चयन गर्नुहोस्।");
        return;
    }
    
    let defaultLabel = DEPARTMENT_LABELS[department] || "General Services";
    let defaultPrice = (currentServicesList[0]?.price || 0);

    if (preSelectedService) {
        defaultLabel = preSelectedService;
        const found = currentServicesList.find(s => s.name === preSelectedService);
        if (found) defaultPrice = found.price;
    }

    setFormData({
      patientId: generateUniqueId(),
      patientName: '',
      age: '',
      address: '',
      contactNo: '',
      gender: 'Male',
      ethnicity: '1 - Dalit',
      serviceType: defaultLabel,
      cost: defaultPrice,
      department: department 
    });
    setIsModalOpen(true);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeOrgId === 'ALL') return;
    const nextQueueNumber = Math.floor(Math.random() * 100) + 1;
    const newRecord: ServiceRecord = {
      id: crypto.randomUUID(),
      patientId: formData.patientId,
      patientName: formData.patientName,
      age: parseInt(formData.age),
      address: formData.address,
      contactNo: formData.contactNo,
      gender: formData.gender,
      ethnicity: formData.ethnicity,
      serviceType: formData.serviceType,
      department: formData.department, 
      cost: formData.cost,
      timestamp: Date.now(),
      status: 'PENDING',
      queueNumber: nextQueueNumber,
      organizationId: activeOrgId
    };

    try {
      await dbService.addServiceRecord(newRecord);
      if (formData.department === department) {
          setRecords([newRecord, ...records]);
      } else {
          alert(`बिरामी ${DEPARTMENT_LABELS[formData.department] || formData.department} विभागमा दर्ता हुनुभयो।`);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert("रेकर्ड सुरक्षित गर्न असफल");
    }
  };

  const openConsultation = (record: ServiceRecord) => {
    if (!permissions.doctorConsultation) {
       alert("तपाईंलाई परामर्श गर्ने अनुमति छैन।");
       return;
    }
    
    if (preSelectedService && preSelectedService.includes('Rabies')) {
       setActiveConsultation(record);
       setIsRabiesModalOpen(true);
       setTempDemographics({
           age: record.age > 0 ? record.age.toString() : '',
           gender: record.gender !== 'Unknown' ? record.gender : 'Male'
       });
       if (record.rabiesData) {
          setRabiesFormData(record.rabiesData);
       } else {
           const todayBS = getCurrentDateBS();
           setRabiesFormData({
              previousRecord: 'No',
              dateOfBite: todayBS,
              animalType: 'Dog',
              biteSite: 'Leg',
              exposureNature: 'Bite',
              skinBroken: true,
              woundBleeding: true,
              whoCategory: 'II',
              humanRabiesCase: false,
              schedule: { 
                 day0: todayBS, 
                 day3: addDaysToBS(todayBS, 3), 
                 day7: addDaysToBS(todayBS, 7), 
                 day14: addDaysToBS(todayBS, 14), 
                 day28: addDaysToBS(todayBS, 28),
                 day0Given: false, day3Given: false, day7Given: false, day14Given: false, day28Given: false
              },
              registeredMonth: ''
           });
       }
       return;
    }

    setActiveConsultation(record);
    setFindings(record.findings || '');
    setDiagnosis(record.diagnosis || '');
    setPrescriptionList(record.prescription || []);
    setLabRequestList(record.labRequests || []);
    setServiceRequestList(record.serviceRequests || []);
    setMedSearch('');
    setSelectedMed(null);
    setDose('500mg');
    setFreq('1-0-1');
    setDuration('5');
    setQty(10); 
  };

  const handleSaveRabies = async () => {
     if (!activeConsultation) return;
     const ageNum = parseInt(tempDemographics.age);
     const genderStr = tempDemographics.gender;
     
     try {
        await dbService.updateRabiesRecord(activeConsultation.id, rabiesFormData, ageNum, genderStr);
        setRecords(prev => prev.map(r => r.id === activeConsultation.id ? { 
            ...r, 
            status: 'COMPLETED', 
            rabiesData: rabiesFormData,
            age: ageNum > 0 ? ageNum : r.age,
            gender: genderStr || r.gender
        } : r));
        setIsRabiesModalOpen(false);
        setActiveConsultation(null);
     } catch (e) {
        alert("Failed to save rabies record");
     }
  };

  const addMedicineToPrescription = () => {
    if (!selectedMed) return;
    const newItem: PrescriptionItem = {
      medicineId: selectedMed.id,
      medicineName: selectedMed.name,
      dosage: dose,
      frequency: freq, 
      duration: duration + ' Days', 
      quantity: qty,
      price: selectedMed.price
    };
    setPrescriptionList([...prescriptionList, newItem]);
    setMedSearch('');
    setSelectedMed(null);
    setDose('');
    setDuration('');
    setQty(1);
  };

  const removeMedicineFromPrescription = (idx: number) => {
     const newList = [...prescriptionList];
     newList.splice(idx, 1);
     setPrescriptionList(newList);
  };

  const handleAddLabRequest = (testName?: string) => {
    const nameToAdd = testName || newLabTestName;
    if (!nameToAdd.trim()) return;
    const catalogItem = servicesCatalog.find(s => s.name === nameToAdd && s.category === 'LAB');
    const price = catalogItem ? catalogItem.price : 500;
    const newTest: LabTest = {
       id: crypto.randomUUID(),
       testName: nameToAdd,
       status: 'PENDING',
       billingStatus: 'PENDING',
       price: price, 
       requestDate: Date.now()
    };
    setLabRequestList([...labRequestList, newTest]);
    setNewLabTestName('');
    setShowLabSuggestions(false);
  };

  const removeLabRequest = (idx: number) => {
     const newList = [...labRequestList];
     newList.splice(idx, 1);
     setLabRequestList(newList);
  };

  const handleAddServiceRequest = () => {
     if (!selectedRequestItem) return;
     const [idStr, name, priceStr] = selectedRequestItem.split('||');
     const newItem: ServiceItemRequest = {
        id: crypto.randomUUID(),
        name: name,
        category: requestCategory,
        price: parseFloat(priceStr),
        status: 'PENDING'
     };
     setServiceRequestList([...serviceRequestList, newItem]);
     setSelectedRequestItem('');
  };

  const removeServiceRequest = (idx: number) => {
     const newList = [...serviceRequestList];
     newList.splice(idx, 1);
     setServiceRequestList(newList);
  };

  const handleCompleteConsultation = async () => {
    if (!activeConsultation) return;
    try {
      const result = await dbService.completeConsultation(
         activeConsultation.id, diagnosis, findings, prescriptionList, labRequestList, serviceRequestList
      );
      setRecords(prev => prev.map(r => r.id === activeConsultation.id ? { 
              ...r, status: 'COMPLETED' as ServiceStatus, findings, diagnosis, prescription: prescriptionList,
              prescriptionStatus: prescriptionList.length > 0 ? 'PENDING' : 'BILLED', labRequests: labRequestList, serviceRequests: serviceRequestList
            } : r));
      if (onServiceComplete && result.newSale) {
         onServiceComplete(result.updatedInventory, result.newSale);
      }
      setActiveConsultation(null);
      setFindings('');
      setDiagnosis('');
      setPrescriptionList([]);
      setLabRequestList([]);
      setServiceRequestList([]);
    } catch (err) {
      alert("सेवा सम्पन्न गर्न असफल भयो");
    }
  };

  const handlePrintReport = (record: ServiceRecord) => {
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const storeName = settings.storeName || 'Smart Health';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <html>
        <head>
            <title>Medical Report - ${record.patientName}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { margin: 0; color: #000; font-size: 24px; }
                .meta-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
                .meta-table td { padding: 5px; font-size: 14px; }
                .section { margin-bottom: 20px; }
                .section h3 { background: #eee; padding: 5px; font-size: 14px; margin-bottom: 5px; }
                .content { font-size: 14px; line-height: 1.5; padding: 5px; }
                .rx-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                .rx-table th, .rx-table td { border: 1px solid #ddd; padding: 5px; text-align: left; }
                .footer { margin-top: 50px; text-align: right; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${storeName}</h1>
                <p>${record.organizationId || 'Main Branch'}</p>
                <p>OPD REPORT</p>
            </div>
            <table class="meta-table">
                <tr><td><strong>Patient ID:</strong> ${record.patientId}</td><td><strong>Date:</strong> ${new Date(record.timestamp).toLocaleDateString()}</td></tr>
                <tr><td><strong>Name:</strong> ${record.patientName}</td><td><strong>Age/Sex:</strong> ${record.age} / ${record.gender}</td></tr>
                <tr><td><strong>Address:</strong> ${record.address}</td><td><strong>Contact:</strong> ${record.contactNo}</td></tr>
            </table>
            
            <div class="section">
                <h3>Diagnosis (रोग पहिचान)</h3>
                <div class="content">${record.diagnosis || 'N/A'}</div>
            </div>
            
            <div class="section">
                <h3>Clinical Findings (क्लिनिकल विवरण)</h3>
                <div class="content">${record.findings || 'N/A'}</div>
            </div>

            ${record.prescription && record.prescription.length > 0 ? `
            <div class="section">
                <h3>Prescription (औषधी सिफारिस)</h3>
                <table class="rx-table">
                    <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Qty</th></tr></thead>
                    <tbody>
                        ${record.prescription.map(p => `<tr><td>${p.medicineName}</td><td>${p.dosage}</td><td>${p.frequency}</td><td>${p.duration}</td><td>${p.quantity}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>` : ''}

            ${record.labRequests && record.labRequests.length > 0 ? `
            <div class="section">
                <h3>Lab Reports (ल्याब रिपोर्ट)</h3>
                <table class="rx-table">
                    <thead><tr><th>Test Name</th><th>Result</th></tr></thead>
                    <tbody>
                        ${record.labRequests.map(l => `<tr><td>${l.testName}</td><td>${l.result || 'Pending'}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>` : ''}

            <div class="footer">
                <p>Checked By: __________________</p>
                <p>(Doctor / Medical Officer)</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const isRegistrationDisabled = activeOrgId === 'ALL';
  const showOrgColumn = activeOrgId === 'ALL';
  const isDemographicsValid = activeConsultation && activeConsultation.age > 0 && activeConsultation.gender !== 'Unknown';

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10">
       
       <div className="flex flex-col md:flex-row gap-6 justify-between items-end bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 w-full md:w-auto">
             <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
             <p className="text-teal-100 max-w-xl text-sm md:text-base">
               बिरामी दर्ता, प्रत्यक्ष लाम व्यवस्थापन र डिजिटल परामर्श सेवा।
             </p>
          </div>
          {autoOpenRegistration && permissions.patientRegister ? (
             <button 
                disabled={isRegistrationDisabled}
                onClick={() => handleOpenModal()}
                className={`relative z-10 w-full md:w-auto justify-center bg-white text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 ${isRegistrationDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <UserPlus className="w-5 h-5" />
                नयाँ बिरामी दर्ता
             </button>
          ) : null}
          <Stethoscope className="absolute right-10 -top-10 w-64 h-64 text-white opacity-10 rotate-12" />
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   <History className="w-5 h-5 text-teal-600" /> सक्रिय बिरामी सूची (Active List)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                   {preSelectedService ? "Search existing patients for follow-up doses." : "सेवा सुरु गर्न बिरामी छान्नुहोस्।"}
                </p>
             </div>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="बिरामी खोज्नुहोस्..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                      {showOrgColumn && <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Org</th>}
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">टोकन नं</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">बिरामीको नाम</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">सेवा</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">पर्खाइ समय</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">कार्य</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {displayRecords.length === 0 ? (
                      <tr>
                         <td colSpan={showOrgColumn ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center">
                               <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20 mb-2" />
                               <p>कुनै बिरामी फेला परेन।</p>
                            </div>
                         </td>
                      </tr>
                   ) : (
                      displayRecords.map((record) => (
                         <tr 
                            key={record.id} 
                            onClick={() => permissions.doctorConsultation && openConsultation(record)}
                            className={`transition-colors ${permissions.doctorConsultation ? 'hover:bg-teal-50/50 cursor-pointer group' : ''}`}
                         >
                            {showOrgColumn && (
                                <td className="px-6 py-4 text-xs font-mono text-slate-500">{record.organizationId}</td>
                            )}
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700">#{record.queueNumber}</span>
                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{record.patientId}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="font-bold text-slate-900 text-sm">{record.patientName}</div>
                               <div className="text-xs text-slate-500">{record.age} बर्ष / {record.gender}</div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="font-medium text-slate-700 text-sm">{record.serviceType}</div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-xs text-slate-500">
                                  {Math.floor((Date.now() - record.timestamp) / 60000)} मिनेट अघि
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               {permissions.doctorConsultation ? (
                                  <button className="text-sm font-medium text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end w-full">
                                     जाँच गर्नुहोस् <ChevronRight className="w-4 h-4" />
                                  </button>
                               ) : (
                                  <span className="text-xs text-slate-400 italic">View Only</span>
                               )}
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </div>

       {/* SERVICE HISTORY SECTION */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" /> सेवा इतिहास (Service History)
             </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0">
                   <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">मिति</th>
                      {showOrgColumn && <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">संस्था</th>}
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">बिरामी</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">सेवा</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">विवरण / कैफियत</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">कार्य</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {records.filter(r => r.status === 'COMPLETED').map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-3 text-xs text-slate-500">{new Date(r.timestamp).toLocaleDateString()}</td>
                         {showOrgColumn && <td className="px-6 py-3 text-xs text-slate-500 font-mono">{r.organizationId}</td>}
                         <td className="px-6 py-3">
                            <div className="text-sm font-medium text-slate-800">{r.patientName}</div>
                            <div className="text-xs text-slate-400">{r.patientId}</div>
                         </td>
                         <td className="px-6 py-3 text-sm text-slate-600">{r.serviceType}</td>
                         <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-xs">{r.findings || '-'}</td>
                         <td className="px-6 py-3 text-right">
                            <button 
                               onClick={() => setSelectedHistory(r)}
                               className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded transition-colors"
                            >
                               विवरण हेर्नुहोस्
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>

       {/* REGISTRATION MODAL */}
       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-[100dvh]">
           <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
             <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
               <h3 className="text-lg font-bold text-slate-800">नयाँ सेवाग्राही दर्ता फारम (Patient Registration)</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full">
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto flex-1">
               <form id="registrationForm" onSubmit={handleSubmitRegistration} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 md:col-span-2 flex justify-between items-center">
                    <div>
                        <span className="text-xs text-blue-600 uppercase font-bold block mb-1">Patient ID (Auto)</span>
                        <span className="text-xl font-mono font-bold text-blue-900 tracking-wider">{formData.patientId}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-blue-600 uppercase font-bold block mb-1">Date</span>
                        <span className="text-sm font-bold text-blue-900">{new Date().toLocaleDateString()}</span>
                    </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">बिरामीको नाम (Name)</label>
                   <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" 
                     value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">उमेर (Age)</label>
                        <input required type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" 
                        value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">लिङ्ग (Gender)</label>
                        <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                        value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                        </select>
                    </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">ठेगाना (Address)</label>
                   <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" 
                     value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">सम्पर्क नं (Contact)</label>
                   <input type="tel" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" 
                     value={formData.contactNo} onChange={e => setFormData({...formData, contactNo: e.target.value})} />
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">जातिगत विवरण (Ethnicity)</label>
                   <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                     value={formData.ethnicity} onChange={e => setFormData({...formData, ethnicity: e.target.value})}>
                     <option>1 - Dalit</option>
                     <option>2 - Janajati</option>
                     <option>3 - Madheshi</option>
                     <option>4 - Muslim</option>
                     <option>5 - Brahmin/Chhetri</option>
                     <option>6 - Other</option>
                   </select>
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">सेवाको प्रकार (Department / Service)</label>
                   <select 
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                      value={formData.department} 
                      onChange={(e) => {
                         const dept = e.target.value;
                         const label = DEPARTMENT_LABELS[dept] || dept;
                         // Find default cost from catalog for this department
                         const deptServices = servicesCatalog.filter(s => s.category === dept);
                         const price = deptServices.length > 0 ? deptServices[0].price : 0;
                         
                         setFormData({
                            ...formData, 
                            department: dept, 
                            serviceType: label,
                            cost: price
                         });
                      }}
                   >
                      <option value="">-- विभाग छान्नुहोस् --</option>
                      {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                         <option key={key} value={key}>{label}</option>
                      ))}
                   </select>
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">शुल्क (Fee)</label>
                   <input 
                      type="number" 
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold text-teal-600" 
                      value={formData.cost} 
                      onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} 
                   />
                 </div>

               </form>
             </div>

             <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium">रद्द गर्नुहोस्</button>
               <button type="submit" form="registrationForm" className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium shadow-lg shadow-teal-900/20">दर्ता गर्नुहोस्</button>
             </div>
           </div>
         </div>
       )}

       {/* CONSULTATION MODAL */}
       {activeConsultation && !isRabiesModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-[100dvh]">
           <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">
             <div className="px-6 py-4 border-b border-slate-200 bg-teal-50 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                     <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-800">डाक्टर परामर्श (Clinical Consultation)</h3>
                     <p className="text-xs text-slate-500">{activeConsultation.patientName} ({activeConsultation.age}/{activeConsultation.gender})</p>
                  </div>
               </div>
               <button onClick={() => setActiveConsultation(null)} className="text-slate-400 hover:text-slate-600">
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column: Clinical Notes & Diagnosis */}
                  <div className="space-y-6">
                     <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                           <Activity className="w-4 h-4 text-teal-500" /> Clinical Notes
                        </h4>
                        <div className="space-y-4">
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">रोग पहिचान (Diagnosis)</label>
                              <input 
                                 type="text" 
                                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                                 placeholder="e.g. Acute Gastritis"
                                 value={diagnosis}
                                 onChange={(e) => setDiagnosis(e.target.value)}
                              />
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">क्लिनिकल विवरण (Findings)</label>
                              <textarea 
                                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm h-32 resize-none"
                                 placeholder="बिरामीको समस्या र लक्षणहरू..."
                                 value={findings}
                                 onChange={(e) => setFindings(e.target.value)}
                              ></textarea>
                           </div>
                        </div>
                     </div>

                     {/* Lab Requests */}
                     <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                           <Activity className="w-4 h-4 text-purple-500" /> ल्याब परीक्षण अनुरोध (Lab Request)
                        </h4>
                        <div className="space-y-3">
                           <div className="flex gap-2 relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                 type="text" 
                                 className="flex-1 pl-9 p-2 border border-slate-200 rounded-lg text-sm"
                                 placeholder="Test खोज्नुहोस् (e.g. CBC)"
                                 value={newLabTestName}
                                 onChange={(e) => { setNewLabTestName(e.target.value); setShowLabSuggestions(true); }}
                                 onFocus={() => setShowLabSuggestions(true)}
                                 onBlur={() => setTimeout(() => setShowLabSuggestions(false), 200)}
                              />
                              <button onClick={() => handleAddLabRequest()} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium">थप्नुहोस्</button>
                              
                              {/* Suggestions */}
                              {showLabSuggestions && filteredLabTests.length > 0 && (
                                 <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
                                    {filteredLabTests.map((test, idx) => (
                                       <div 
                                          key={idx} 
                                          className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                                          onMouseDown={() => handleAddLabRequest(test)}
                                       >
                                          {test}
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                           
                           <div className="space-y-2">
                              {labRequestList.map((test, idx) => (
                                 <div key={idx} className="flex justify-between items-center bg-purple-50 p-2 rounded-lg border border-purple-100">
                                    <span className="text-sm font-medium text-purple-800">{test.testName}</span>
                                    <button onClick={() => removeLabRequest(idx)} className="text-purple-400 hover:text-purple-600"><X className="w-4 h-4" /></button>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Other Service Requests */}
                     <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                           <Activity className="w-4 h-4 text-orange-500" /> थप सेवा अनुरोध (Additional Requests)
                        </h4>
                        <div className="flex gap-2 mb-2">
                           <select 
                              className="p-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                              value={requestCategory}
                              onChange={(e) => setRequestCategory(e.target.value)}
                           >
                              <option value="X_RAY">X-Ray</option>
                              <option value="USG">USG</option>
                              <option value="ECG">ECG</option>
                              <option value="IMMUNIZATION">Vaccine</option>
                              <option value="DRESSING_MINOR_OT">Procedures</option>
                           </select>
                           <select 
                              className="flex-1 p-2 text-xs border border-slate-200 rounded-lg"
                              value={selectedRequestItem}
                              onChange={(e) => {
                                 setSelectedRequestItem(e.target.value);
                              }}
                           >
                              <option value="">सेवा छान्नुहोस्...</option>
                              {filteredServiceRequests.map(s => (
                                 <option key={s.id} value={`${s.id}||${s.name}||${s.price}`}>{s.name} (Rs.{s.price})</option>
                              ))}
                           </select>
                           <button onClick={handleAddServiceRequest} className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold">थप्नुहोस्</button>
                        </div>
                        <div className="space-y-1">
                           {serviceRequestList.map((req, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-orange-50 p-2 rounded border border-orange-100">
                                 <div className="text-xs">
                                    <span className="font-bold text-orange-800 block">{req.name}</span>
                                    <span className="text-orange-600">{req.category}</span>
                                 </div>
                                 <button onClick={() => removeServiceRequest(idx)} className="text-orange-400 hover:text-orange-600"><X className="w-3 h-3" /></button>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Prescription */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                     <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" /> औषधी सिफारिस (Prescription)
                     </h4>
                     
                     <div className="space-y-4 mb-4">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text" 
                              className="w-full pl-9 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="औषधि खोज्नुहोस्..."
                              value={medSearch}
                              onChange={(e) => setMedSearch(e.target.value)}
                           />
                           {medSearch && filteredMeds.length > 0 && (
                              <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto z-10">
                                 {filteredMeds.map(med => (
                                    <div 
                                       key={med.id} 
                                       className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                       onClick={() => { setSelectedMed(med); setMedSearch(med.name); }}
                                    >
                                       <div className="font-bold text-sm text-slate-700">{med.name}</div>
                                       <div className="text-xs text-slate-500 flex justify-between">
                                          <span>{med.genericName}</span>
                                          <span className="font-mono bg-slate-100 px-1 rounded">Stock: {med.stock}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <input type="text" placeholder="Dose (e.g. 500mg)" className="p-2 border border-slate-200 rounded text-sm" value={dose} onChange={e => setDose(e.target.value)} />
                           <select className="p-2 border border-slate-200 rounded text-sm bg-white" value={freq} onChange={e => setFreq(e.target.value)}>
                              {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                           </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2 items-center">
                           <div className="flex items-center gap-1 border border-slate-200 rounded px-2 bg-white">
                              <input type="number" placeholder="Duration" className="w-full p-2 text-sm outline-none" value={duration} onChange={e => setDuration(e.target.value)} />
                              <span className="text-xs text-slate-400 font-bold">Days</span>
                           </div>
                           <button 
                              onClick={addMedicineToPrescription}
                              disabled={!selectedMed}
                              className="bg-blue-600 text-white p-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                           >
                              सूचीमा थप्नुहोस्
                           </button>
                        </div>
                     </div>

                     <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-2 overflow-y-auto">
                        {prescriptionList.length === 0 ? (
                           <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">कुनै औषधि थपिएको छैन</div>
                        ) : (
                           <div className="space-y-2">
                              {prescriptionList.map((item, idx) => (
                                 <div key={idx} className="bg-white p-3 rounded border border-slate-200 shadow-sm flex justify-between items-start">
                                    <div>
                                       <div className="font-bold text-slate-800 text-sm">{item.medicineName}</div>
                                       <div className="text-xs text-slate-500 mt-1">
                                          {item.dosage} • {item.frequency} • {item.duration}
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                       <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">Qty: {item.quantity}</span>
                                       <button onClick={() => removeMedicineFromPrescription(idx)} className="text-red-400 hover:text-red-600 text-xs">हटाउनुहोस्</button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

               </div>
             </div>

             <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
               <button onClick={() => setActiveConsultation(null)} className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium">रद्द गर्नुहोस्</button>
               <button onClick={handleCompleteConsultation} className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium shadow-lg shadow-teal-900/20 flex items-center gap-2">
                  <Save className="w-4 h-4" /> सुरक्षित र बिलिङमा पठाउनुहोस्
               </button>
             </div>
           </div>
         </div>
       )}

       {/* HISTORY DETAILS MODAL */}
       {selectedHistory && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
               <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                  <h3 className="text-lg font-bold text-slate-800">बिरामीको विस्तृत विवरण (History)</h3>
                  <button onClick={() => setSelectedHistory(null)} className="text-slate-400 hover:text-slate-600">
                     <X className="w-6 h-6" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 bg-white">
                  {/* Patient Card */}
                  <div className="flex items-start gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg">
                        {selectedHistory.patientName.charAt(0)}
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedHistory.patientName}</h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                           <span>ID: <span className="font-mono text-slate-700">{selectedHistory.patientId}</span></span>
                           <span>Age: {selectedHistory.age}</span>
                           <span>Gender: {selectedHistory.gender}</span>
                           <span>Contact: {selectedHistory.contactNo}</span>
                        </div>
                     </div>
                  </div>

                  {/* Visit Details */}
                  <div className="space-y-6">
                     <section>
                        <h4 className="font-bold text-slate-700 mb-2 border-b pb-1 text-sm uppercase tracking-wide">Diagnosis & Findings</h4>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm space-y-2">
                           <p><strong className="text-slate-600">Service:</strong> {selectedHistory.serviceType}</p>
                           <p><strong className="text-slate-600">Diagnosis:</strong> {selectedHistory.diagnosis || 'N/A'}</p>
                           <p><strong className="text-slate-600">Findings:</strong> {selectedHistory.findings || 'N/A'}</p>
                        </div>
                     </section>

                     {selectedHistory.prescription && selectedHistory.prescription.length > 0 && (
                        <section>
                           <h4 className="font-bold text-slate-700 mb-2 border-b pb-1 text-sm uppercase tracking-wide">Prescription</h4>
                           <div className="overflow-x-auto border border-slate-200 rounded-lg">
                              <table className="w-full text-sm text-left">
                                 <thead className="bg-slate-50">
                                    <tr>
                                       <th className="p-2 font-semibold text-slate-600">Medicine</th>
                                       <th className="p-2 font-semibold text-slate-600">Dose</th>
                                       <th className="p-2 font-semibold text-slate-600">Freq</th>
                                       <th className="p-2 font-semibold text-slate-600 text-right">Qty</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                    {selectedHistory.prescription.map((p, i) => (
                                       <tr key={i}>
                                          <td className="p-2">{p.medicineName}</td>
                                          <td className="p-2 text-slate-500">{p.dosage}</td>
                                          <td className="p-2 text-slate-500">{p.frequency}</td>
                                          <td className="p-2 text-right font-mono">{p.quantity}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </section>
                     )}

                     {selectedHistory.labRequests && selectedHistory.labRequests.length > 0 && (
                        <section>
                           <h4 className="font-bold text-slate-700 mb-2 border-b pb-1 text-sm uppercase tracking-wide">Lab Reports</h4>
                           <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 space-y-2">
                              {selectedHistory.labRequests.map((l, i) => (
                                 <div key={i} className="flex justify-between items-center text-sm border-b border-purple-100 last:border-0 pb-1 last:pb-0">
                                    <span className="font-medium text-purple-900">{l.testName}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${l.result ? 'bg-white text-slate-700 border' : 'bg-yellow-100 text-yellow-700'}`}>
                                       {l.result || 'Pending'}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </section>
                     )}

                     {/* Past Timeline */}
                     {patientFullHistory.length > 0 && (
                        <section className="pt-4 border-t border-slate-200">
                           <h4 className="font-bold text-slate-400 mb-3 text-xs uppercase tracking-wide flex items-center gap-2">
                              <Clock className="w-3 h-3" /> Previous Visits
                           </h4>
                           <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                              {patientFullHistory.map(h => (
                                 <div key={h.id} className="pl-4 relative">
                                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-slate-300 rounded-full border-2 border-white"></div>
                                    <div className="text-xs text-slate-500">{new Date(h.timestamp).toLocaleDateString()}</div>
                                    <div className="text-sm font-medium text-slate-800">{h.diagnosis || h.serviceType}</div>
                                 </div>
                              ))}
                           </div>
                        </section>
                     )}
                  </div>
               </div>

               <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                  <button 
                     onClick={() => handlePrintReport(selectedHistory)}
                     className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-slate-900"
                  >
                     <Printer className="w-4 h-4" /> रिपोर्ट प्रिन्ट
                  </button>
               </div>
            </div>
         </div>
       )}

       {isRabiesModalOpen && activeConsultation && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">
                 <div className="px-6 py-4 border-b border-slate-200 bg-red-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                       <div className="bg-red-100 p-2 rounded-lg text-red-700">
                          <PawPrint className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-slate-800">रेबिज खोप दर्ता (Rabies Vaccine Registration)</h3>
                          <p className="text-xs text-slate-500">बिरामी: {activeConsultation.patientName} ({activeConsultation.patientId})</p>
                       </div>
                    </div>
                    <div className="flex gap-4 items-center bg-white/50 px-3 py-1 rounded-lg border border-slate-200">
                        {isDemographicsValid ? (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Age</span>
                                    <span className="text-sm font-bold text-slate-700">{activeConsultation.age} Years</span>
                                </div>
                                <div className="w-px h-6 bg-slate-300"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Gender</span>
                                    <span className="text-sm font-bold text-slate-700">{activeConsultation.gender}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-red-500 uppercase font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Update Age</span>
                                    <input 
                                        type="number" 
                                        className="w-16 p-1 text-sm border border-red-300 rounded focus:ring-1 focus:ring-red-500" 
                                        value={tempDemographics.age}
                                        onChange={e => setTempDemographics({...tempDemographics, age: e.target.value})}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="w-px h-6 bg-slate-300"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-red-500 uppercase font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Update Sex</span>
                                    <select 
                                        className="p-1 text-sm border border-red-300 rounded focus:ring-1 focus:ring-red-500"
                                        value={tempDemographics.gender}
                                        onChange={e => setTempDemographics({...tempDemographics, gender: e.target.value})}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => setIsRabiesModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                       <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-red-500" /> घटना विवरण (Incident Details)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">टोकेको मिति (B.S.)</label>
                                    <input 
                                        type="text" 
                                        placeholder="YYYY-MM-DD"
                                        className="w-full p-2 text-sm border border-slate-200 rounded-lg" 
                                        value={rabiesFormData.dateOfBite} 
                                        onChange={e => setRabiesFormData({...rabiesFormData, dateOfBite: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">जनावरको प्रकार (Type of Animal)</label>
                                    <select className="w-full p-2 text-sm border border-slate-200 rounded-lg"
                                        value={rabiesFormData.animalType} onChange={e => setRabiesFormData({...rabiesFormData, animalType: e.target.value})}>
                                        <option>Dog (कुकुर)</option>
                                        <option>Cat (बिरालो)</option>
                                        <option>Monkey (बाँदर)</option>
                                        <option>Jackal (स्याल)</option>
                                        <option>Rodent (मुसा)</option>
                                        <option>Cattle (गाई/भैंसी)</option>
                                        <option>Tiger (बाघ)</option>
                                        <option>Bear (भालु)</option>
                                        <option>Saliva (राल)</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">टोकेको स्थान (Site of Bite)</label>
                                <input type="text" className="w-full p-2 text-sm border border-slate-200 rounded-lg" placeholder="e.g. Right Leg" 
                                    value={rabiesFormData.biteSite} onChange={e => setRabiesFormData({...rabiesFormData, biteSite: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">प्रकृति (Exposure)</label>
                                    <select className="w-full p-2 text-sm border border-slate-200 rounded-lg"
                                        value={rabiesFormData.exposureNature} onChange={e => setRabiesFormData({...rabiesFormData, exposureNature: e.target.value})}>
                                        <option>Bite (टोकेको)</option>
                                        <option>Scratch (कोतरेको)</option>
                                        <option>Lick (चाटेको)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">WHO Category</label>
                                    <select className="w-full p-2 text-sm border border-slate-200 rounded-lg"
                                        value={rabiesFormData.whoCategory} onChange={e => setRabiesFormData({...rabiesFormData, whoCategory: e.target.value as any})}>
                                        <option>I</option>
                                        <option>II</option>
                                        <option>III</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={rabiesFormData.skinBroken} onChange={e => setRabiesFormData({...rabiesFormData, skinBroken: e.target.checked})} className="rounded text-red-600 focus:ring-red-500" />
                                    <span>छाला काटिएको (Skin Broken)</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={rabiesFormData.woundBleeding} onChange={e => setRabiesFormData({...rabiesFormData, woundBleeding: e.target.checked})} className="rounded text-red-600 focus:ring-red-500" />
                                    <span>रगत आएको (Bleeding)</span>
                                </label>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" /> खोप तालिका (Vaccination Schedule - BS)
                            </h4>
                            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                                <div className="text-xs font-bold text-blue-800">Day 0 (सुरुको मिति):</div>
                                <input 
                                    type="text" 
                                    className="w-32 p-1.5 text-xs border border-blue-200 rounded text-center font-mono"
                                    placeholder="YYYY-MM-DD"
                                    value={rabiesFormData.schedule.day0 || ''} 
                                    onChange={e => {
                                        const newSchedule = {...rabiesFormData.schedule, day0: e.target.value};
                                        setRabiesFormData({...rabiesFormData, schedule: newSchedule});
                                    }}
                                />
                            </div>
                            
                            <div className="space-y-3">
                                {[0, 3, 7, 14, 28].map((day) => {
                                   const keyDate = `day${day}` as keyof typeof rabiesFormData.schedule;
                                   const keyGiven = `day${day}Given` as keyof typeof rabiesFormData.schedule;
                                   
                                   const dateVal = rabiesFormData.schedule[keyDate] as string;
                                   const isGiven = rabiesFormData.schedule[keyGiven] as boolean;
                                   
                                   return (
                                       <div key={day} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                                           <div className="flex items-center gap-3">
                                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isGiven ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                                  {day}
                                               </div>
                                               <div>
                                                  <div className="text-sm font-semibold text-slate-700">Day {day}</div>
                                                  <div className="text-xs text-slate-500 font-mono">{dateVal || '-'}</div>
                                               </div>
                                           </div>
                                           <div className="flex items-center gap-2">
                                              <span className="text-xs text-slate-400">{isGiven ? 'Given' : 'Pending'}</span>
                                              <input 
                                                type="checkbox" 
                                                checked={isGiven || false} 
                                                onChange={(e) => {
                                                   const newSchedule = {...rabiesFormData.schedule};
                                                   (newSchedule as any)[keyGiven] = e.target.checked;
                                                   setRabiesFormData({...rabiesFormData, schedule: newSchedule});
                                                }}
                                                className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer" 
                                              />
                                           </div>
                                       </div>
                                   );
                                })}
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">दर्ता भएको महिना (Registered Month)</label>
                                <select 
                                    className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-slate-50"
                                    value={rabiesFormData.registeredMonth || ''}
                                    onChange={(e) => setRabiesFormData({...rabiesFormData, registeredMonth: e.target.value})}
                                >
                                    <option value="">-- महिना छान्नुहोस् --</option>
                                    {NEPALI_MONTHS.map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>
                 </div>

                 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button onClick={() => setIsRabiesModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium">रद्द गर्नुहोस्</button>
                    <button onClick={handleSaveRabies} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-lg shadow-red-900/20 flex items-center gap-2">
                       <Save className="w-4 h-4" /> सुरक्षित गर्नुहोस्
                    </button>
                 </div>
             </div>
         </div>
       )}
    </div>
  );
};
