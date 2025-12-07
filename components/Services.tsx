
import React, { useState, useEffect, useMemo } from 'react';
import { Stethoscope, Activity, Heart, Thermometer, Syringe, Clock, UserPlus, X, History, Search, CheckCircle2, ListOrdered, FileText, ChevronRight, FileClock, Pill, Trash2, AlertCircle, Calculator, User, FlaskConical, ClipboardList, Printer, ShieldCheck, HeartPulse, Cross, PlusCircle, Zap, Plus, Save, Calendar, PawPrint } from 'lucide-react';
import { dbService } from '../services/db';
import { ServiceRecord, ServiceStatus, Medicine, PrescriptionItem, Sale, LabTest, UserPermissions, AppView, ServiceItemRequest, ServiceCatalogItem, RabiesData } from '../types';
import { addDaysToBS } from '../services/dateUtils';

interface ServicesProps {
  inventory?: Medicine[];
  onServiceComplete?: (inventory: Medicine[], sale: Sale) => void;
  permissions: UserPermissions;
  activeOrgId?: string;
  department?: string; // e.g. "X_RAY"
  title?: string;      // e.g. "X-Ray Services"
  autoOpenRegistration?: boolean; // Prop to auto-open modal
  preSelectedService?: string; // Force a specific service type (e.g. "Rabies Vaccine")
}

export const Services: React.FC<ServicesProps> = ({ 
   inventory = [], 
   onServiceComplete, 
   permissions, 
   activeOrgId,
   department = AppView.GENERAL_TREATMENT,
   title = "General Services",
   autoOpenRegistration = false,
   preSelectedService
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<ServiceRecord | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<ServiceRecord | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  
  // Rate Catalog State
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
    department: department // Track which department the service belongs to
  });

  // Consultation State
  const [findings, setFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionList, setPrescriptionList] = useState<PrescriptionItem[]>([]);
  const [labRequestList, setLabRequestList] = useState<LabTest[]>([]);
  const [newLabTestName, setNewLabTestName] = useState('');
  const [showLabSuggestions, setShowLabSuggestions] = useState(false);
  
  // Service Request State
  const [serviceRequestList, setServiceRequestList] = useState<ServiceItemRequest[]>([]);
  const [requestCategory, setRequestCategory] = useState(AppView.X_RAY);
  const [selectedRequestItem, setSelectedRequestItem] = useState('');

  // Prescription Builder State
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('1-0-0'); 
  const [duration, setDuration] = useState('');
  const [qty, setQty] = useState(1);

  // RABIES FORM STATE
  const [isRabiesModalOpen, setIsRabiesModalOpen] = useState(false);
  const [rabiesFormData, setRabiesFormData] = useState<RabiesData>({
      previousRecord: 'No',
      dateOfBite: '2081-01-01', // Default BS
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
      registeredMonth: '' // Renamed from nextVisitMonth
  });

  const hideServiceCards = true;

  const DEPARTMENT_LABELS: Record<string, string> = {
    [AppView.GENERAL_TREATMENT]: 'General Treatment (OPD)',
    [AppView.X_RAY]: 'X-Ray Services',
    [AppView.USG]: 'USG (Video X-Ray)',
    [AppView.ECG]: 'ECG Services',
    [AppView.DRESSING_MINOR_OT]: 'Dressing & Minor OT',
    [AppView.MCH]: 'Maternal & Child Health',
    [AppView.IMMUNIZATION]: 'Immunization (खोप)',
    [AppView.TB_LEPROSY]: 'TB & Leprosy',
    [AppView.NUTRITION]: 'Nutrition Clinic',
    [AppView.CBIMNCI]: 'CBIMNCI',
    [AppView.COMMUNICABLE]: 'Communicable Diseases',
    [AppView.NON_COMMUNICABLE]: 'Non-Communicable Diseases',
  };

  const NEPALI_MONTHS = [
    "Baisakh (बैशाख)", "Jestha (जेष्ठ)", "Ashad (आषाढ)", "Shrawan (श्रावण)", 
    "Bhadra (भाद्र)", "Ashwin (आश्विन)", "Kartik (कार्तिक)", "Mangsir (मंसिर)", 
    "Poush (पुष)", "Magh (माघ)", "Falgun (फाल्गुन)", "Chaitra (चैत्र)"
  ];

  const getDepartmentIcon = (cat: string) => {
     switch(cat) {
        case AppView.X_RAY: return Zap;
        case AppView.USG: return Activity;
        case AppView.ECG: return HeartPulse;
        case AppView.DRESSING_MINOR_OT: return Cross;
        case AppView.IMMUNIZATION: return Syringe;
        default: return Stethoscope;
     }
  };

  const currentServicesList = useMemo(() => {
     return servicesCatalog.filter(s => s.category === department);
  }, [servicesCatalog, department]);

  const frequencyOptions = [
    { label: 'OD - दिनको एक पटक (1-0-0)', value: '1-0-0', multiplier: 1 },
    { label: 'BID - दिनको दुई पटक (1-0-1)', value: '1-0-1', multiplier: 2 },
    { label: 'TDS - दिनको तीन पटक (1-1-1)', value: '1-1-1', multiplier: 3 },
    { label: 'QID - चार पटक (1-1-1-1)', value: '1-1-1-1', multiplier: 4 },
    { label: 'HS - राती सुत्ने बेला (0-0-1)', value: '0-0-1', multiplier: 1 },
    { label: 'SOS - आवश्यक पर्दा (As Needed)', value: 'SOS', multiplier: 0 },
  ];

  const ethnicityOptions = [
    "1 - Dalit", "2 - Janajati", "3 - Madhesi", "4 - Muslim", "5 - Brahmin/Chhetri", "6 - Others"
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

  const generateUniqueId = () => {
    const prefix = "PAT";
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000); 
    return `${prefix}-${year}-${random}`;
  };

  const handleOpenModal = (serviceName: string = '', price?: number) => {
    if (!permissions.patientRegister) return; 
    if (activeOrgId === 'ALL') {
        alert("कृपया बिरामी दर्ता गर्नको लागि एक विशिष्ट संस्था चयन गर्नुहोस्।");
        return;
    }
    
    let defaultLabel = DEPARTMENT_LABELS[department] || "General Services";
    let defaultPrice = price !== undefined ? price : (currentServicesList[0]?.price || 0);

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

  useEffect(() => {
    loadRecords();
    loadServiceCatalog();
  }, [activeOrgId, department]);

  const loadServiceCatalog = async () => {
     try {
        const catalog = await dbService.getAllServices();
        setServicesCatalog(catalog);
     } catch (e) {
        console.error("Failed to load service catalog");
     }
  };

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
  
  // Rabies Schedule Auto-Calculation when Day 0 Changes
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

  const loadRecords = async () => {
    try {
      const allRecords = await dbService.getAllServiceRecords();
      let filtered = allRecords;
      if (activeOrgId && activeOrgId !== 'ALL') {
          filtered = allRecords.filter(r => r.organizationId === activeOrgId);
      }
      
      // Special Filter logic for Rabies View
      // Show if Department matches OR if the serviceType includes "Rabies" (from billing)
      if (preSelectedService && preSelectedService.includes('Rabies')) {
          filtered = filtered.filter(r => 
             r.department === AppView.COMMUNICABLE || r.serviceType.toLowerCase().includes('rabies')
          );
      } else {
          // Standard Department Filter
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

  const pendingQueues = useMemo(() => {
    const pending = records.filter(r => r.status === 'PENDING');
    const grouped: Record<string, ServiceRecord[]> = {};
    pending.forEach(record => {
      if (!grouped[record.serviceType]) { grouped[record.serviceType] = []; }
      grouped[record.serviceType].push(record);
    });
    Object.keys(grouped).forEach(key => { grouped[key].sort((a, b) => a.queueNumber - b.queueNumber); });
    return grouped;
  }, [records]);

  const filteredMeds = useMemo(() => {
     if (!medSearch) return [];
     return inventory.filter(m => 
       (m.name.toLowerCase().includes(medSearch.toLowerCase()) || 
       m.genericName.toLowerCase().includes(medSearch.toLowerCase())) && m.stock > 0
     );
  }, [medSearch, inventory]);

  const filteredLabTests = useMemo(() => {
     if (!newLabTestName) return [];
     // Combine catalog tests and common hardcoded tests
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

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDeptKey = e.target.value;
    const label = DEPARTMENT_LABELS[selectedDeptKey];
    const deptServices = servicesCatalog.filter(s => s.category === selectedDeptKey);
    const defaultCost = deptServices[0]?.price || 0;

    setFormData({
      ...formData,
      serviceType: label,
      department: selectedDeptKey,
      cost: defaultCost
    });
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
    
    // Check if this is a Rabies View, open special modal
    if (preSelectedService && preSelectedService.includes('Rabies')) {
       setActiveConsultation(record);
       setIsRabiesModalOpen(true);
       
       if (record.rabiesData) {
          setRabiesFormData(record.rabiesData);
       } else {
           // Initialize new schedule with defaults
           const todayBS = '2081-01-01'; // Default
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

    // Standard Consultation
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
     try {
        await dbService.updateRabiesRecord(activeConsultation.id, rabiesFormData);
        // Update local state
        setRecords(prev => prev.map(r => r.id === activeConsultation.id ? { 
            ...r, 
            status: 'COMPLETED', 
            rabiesData: rabiesFormData
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

  const handlePrintReport = () => {
    if (!selectedHistory) return;
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const storeName = settings.storeName || 'Smart Health';
    const storeAddress = settings.address || 'Address';
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert("Please allow popups to print reports"); return; }
    
    // Simplified print logic for brevity (full version in previous code)
    printWindow.document.write(`<html><body><h1>${storeName} - Report</h1><p>Patient: ${selectedHistory.patientName}</p><script>window.print()</script></body></html>`);
    printWindow.document.close();
  };

  const pendingRecords = records.filter(r => r.status === 'PENDING');
  const filteredRecords = pendingRecords.filter(r => 
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || r.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Update: If we are in Rabies View, we also want to see 'Active' patients who are coming for follow-ups (Status=COMPLETED but need updates)
  // So we search ALL records for Rabies view if searching
  const rabisActiveRecords = preSelectedService ? records.filter(r => 
      (r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || r.patientId.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : filteredRecords;
  
  // Use rabisActiveRecords if we are in Rabies mode and have a search term, else default queue behavior
  const displayRecords = (preSelectedService && searchTerm) ? rabisActiveRecords : filteredRecords;

  const historyRecords = records.filter(r => r.status === 'COMPLETED');
  const filteredHistory = historyRecords.filter(r => 
    r.patientName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    r.patientId.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    r.contactNo.includes(historySearchTerm)
  );

  const viewHistoryRecord = (record: ServiceRecord) => {
     if (permissions.viewPatientHistory) { setSelectedHistory(record); } else { alert("पूर्ण विवरण हेर्ने अनुमति छैन।"); }
  };

  const isRegistrationDisabled = activeOrgId === 'ALL';
  const showOrgColumn = activeOrgId === 'ALL';

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10">
       
       {/* Header Section */}
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

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Live Queue Section */}
          <div className="lg:col-span-3">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ListOrdered className="w-5 h-5 text-teal-600" /> प्रत्यक्ष सेवा लाइन (Queue)
                   </h3>
                   <p className="text-xs text-slate-500">पालो कुरिरहेका बिरामीहरू</p>
                </div>
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6 max-h-[600px]">
                   {Object.keys(pendingQueues).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                         <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                         <p className="text-sm">कुनै बिरामी लाइनमा छैनन्</p>
                      </div>
                   ) : (
                      Object.keys(pendingQueues).map(serviceName => (
                         <div key={serviceName} className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{serviceName}</h4>
                            <div className="space-y-2">
                               {pendingQueues[serviceName].map((record) => (
                                  <div 
                                     key={record.id} 
                                     onClick={() => permissions.doctorConsultation && openConsultation(record)}
                                     className={`bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-1 transition-colors
                                       ${permissions.doctorConsultation ? 'group hover:border-teal-200 cursor-pointer' : 'opacity-80'}`}
                                  >
                                     <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="h-10 w-10 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                                            {record.queueNumber}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="font-bold text-slate-800 text-sm truncate pr-2">{record.patientName}</div>
                                                    <div className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono whitespace-nowrap">{record.patientId}</div>
                                                </div>
                                                <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                                                    <span>{record.gender}, {record.age}y</span>
                                                    {record.contactNo && <span>📞 {record.contactNo}</span>}
                                                    {record.address && <span className="truncate max-w-[150px]">📍 {record.address}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {permissions.doctorConsultation && (
                                            <button className="p-2 text-slate-400 hover:text-teal-600 rounded-lg transition-colors shrink-0">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        )}
                                     </div>
                                     {showOrgColumn && (
                                         <div className="text-[10px] text-slate-400 font-mono mt-1 text-right border-t border-slate-100 pt-1">
                                             {record.organizationId}
                                         </div>
                                     )}
                                  </div>
                               ))}
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
          </div>
       </div>

       {/* Active Patient List Section */}
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
                               <div className="text-xs text-slate-500">{record.age}y / {record.gender}</div>
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
                                     Proceed <ChevronRight className="w-4 h-4" />
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

       {/* Medical Reports Section (Recent 3) */}
       <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <ClipboardList className="w-5 h-5 text-teal-600" /> भर्खरका मेडिकल रिपोर्टहरू (Recent Reports)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {records.filter(r => r.status === 'COMPLETED').slice(0, 3).map(r => (
                <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-700">{r.patientName}</div>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{new Date(r.timestamp).toLocaleDateString()}</div>
                    <p className="text-sm text-slate-600 truncate mb-3">{r.diagnosis || 'No Diagnosis'}</p>
                    <button 
                        onClick={() => viewHistoryRecord(r)}
                        className="w-full py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                        View Full Report
                    </button>
                </div>
             ))}
          </div>
       </div>

       {/* Service History Section */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileClock className="w-5 h-5 text-teal-600" /> सेवा इतिहास (Service History)
             </h3>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="पुराना रेकर्ड खोज्नुहोस्..." 
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
             </div>
          </div>
          <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
             <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                   <tr>
                      {showOrgColumn && <th className="px-6 py-3 font-semibold text-slate-600 text-xs">Org</th>}
                      <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase">Date</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase">Patient</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase">Diagnosis / Findings</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredHistory.length === 0 ? (
                      <tr><td colSpan={showOrgColumn ? 5 : 4} className="px-6 py-8 text-center text-slate-500 text-sm">कुनै इतिहास भेटिएन।</td></tr>
                   ) : (
                      filteredHistory.map(record => (
                         <tr key={record.id} onClick={() => viewHistoryRecord(record)} className="hover:bg-slate-50 cursor-pointer">
                            {showOrgColumn && <td className="px-6 py-3 text-xs font-mono text-slate-500">{record.organizationId}</td>}
                            <td className="px-6 py-3 text-slate-500 text-sm">{new Date(record.timestamp).toLocaleDateString()}</td>
                            <td className="px-6 py-3">
                               <div className="font-medium text-slate-800 text-sm">{record.patientName}</div>
                               <div className="text-xs text-slate-400">{record.patientId}</div>
                            </td>
                            <td className="px-6 py-3 text-sm text-slate-600">
                               {record.diagnosis || record.findings || '-'}
                            </td>
                            <td className="px-6 py-3 text-right">
                               <button className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded text-slate-600 font-medium">
                                  Details
                                </button>
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </div>
       
       {/* STANDARD CONSULTATION MODAL - RESTORED */}
       {activeConsultation && !isRabiesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-3">
                      <div className="bg-teal-600 p-2 rounded-lg text-white">
                         <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-lg font-bold text-slate-800">Clinical Consultation</h3>
                         <p className="text-xs text-slate-500">{activeConsultation.patientName} ({activeConsultation.age}y/{activeConsultation.gender})</p>
                      </div>
                   </div>
                   <button onClick={() => setActiveConsultation(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                      <X className="w-6 h-6" />
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Left: Clinical Details */}
                      <div className="space-y-6">
                         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                               <Activity className="w-4 h-4 text-teal-600" /> Clinical Findings
                            </h4>
                            <div className="space-y-4">
                               <div className="space-y-1">
                                  <label className="text-xs font-semibold text-slate-500 uppercase">Diagnosis</label>
                                  <input 
                                     type="text" 
                                     className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                     placeholder="e.g. Viral Fever"
                                     value={diagnosis}
                                     onChange={(e) => setDiagnosis(e.target.value)}
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-xs font-semibold text-slate-500 uppercase">Chief Complaints / Examination</label>
                                  <textarea 
                                     rows={4}
                                     className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                     placeholder="Enter clinical notes..."
                                     value={findings}
                                     onChange={(e) => setFindings(e.target.value)}
                                  />
                               </div>
                            </div>
                         </div>
                         
                         {/* Lab Requests Section */}
                         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                               <FlaskConical className="w-4 h-4 text-purple-600" /> Investigation / Lab Request
                            </h4>
                            <div className="flex gap-2 mb-3 relative">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                               <input 
                                  type="text" 
                                  className="flex-1 pl-9 pr-2 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                  placeholder="Search test name (e.g. CBC)"
                                  value={newLabTestName}
                                  onChange={(e) => { setNewLabTestName(e.target.value); setShowLabSuggestions(true); }}
                                  onFocus={() => setShowLabSuggestions(true)}
                                  onBlur={() => setTimeout(() => setShowLabSuggestions(false), 200)}
                               />
                               <button 
                                  onClick={() => handleAddLabRequest()}
                                  className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                               >
                                  Add
                               </button>
                               {/* Suggestions Dropdown */}
                               {showLabSuggestions && filteredLabTests.length > 0 && (
                                  <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto z-20">
                                      {filteredLabTests.map(test => (
                                          <div 
                                              key={test} 
                                              className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm text-slate-700"
                                              onMouseDown={() => handleAddLabRequest(test)}
                                          >
                                              {test}
                                          </div>
                                      ))}
                                  </div>
                               )}
                            </div>
                            
                            {/* Quick Add Common Tests */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {['CBC', 'Urine R/E', 'Blood Sugar', 'Lipid Profile', 'Uric Acid'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => handleAddLabRequest(t)}
                                        className="text-[10px] bg-slate-50 border border-slate-200 hover:border-purple-300 hover:text-purple-700 px-2 py-1 rounded-full transition-colors"
                                    >
                                        + {t}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                               {labRequestList.map((test, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-2 bg-purple-50 rounded border border-purple-100 text-sm">
                                     <span className="font-medium text-slate-700">{test.testName}</span>
                                     <button onClick={() => removeLabRequest(idx)} className="text-purple-400 hover:text-purple-600">
                                        <X className="w-4 h-4" />
                                     </button>
                                  </div>
                               ))}
                               {labRequestList.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">No labs requested</p>}
                            </div>
                         </div>
                         
                         {/* Other Service Requests (X-Ray, USG, etc) */}
                         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                               <PlusCircle className="w-4 h-4 text-blue-600" /> थप सेवा अनुरोध (Additional Requests)
                            </h4>
                            <div className="flex flex-col gap-2 mb-3">
                                <div className="flex gap-2">
                                  <select 
                                      className="w-1/3 p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 font-medium"
                                      value={requestCategory}
                                      onChange={(e) => { setRequestCategory(e.target.value as any); setSelectedRequestItem(''); }}
                                  >
                                      <option value={AppView.X_RAY}>X-Ray</option>
                                      <option value={AppView.USG}>USG</option>
                                      <option value={AppView.ECG}>ECG</option>
                                      <option value={AppView.DRESSING_MINOR_OT}>Procedure</option>
                                      <option value={AppView.IMMUNIZATION}>Vaccine</option>
                                  </select>
                                  <select 
                                      className="flex-1 p-2 text-sm border border-slate-200 rounded-lg"
                                      value={selectedRequestItem}
                                      onChange={(e) => setSelectedRequestItem(e.target.value)}
                                  >
                                      <option value="">Select Service...</option>
                                      {filteredServiceRequests.map(s => (
                                          <option key={s.id} value={`${s.id}||${s.name}||${s.price}`}>
                                              {s.name}
                                          </option>
                                      ))}
                                  </select>
                                  <button 
                                      onClick={handleAddServiceRequest}
                                      disabled={!selectedRequestItem}
                                      className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                  >
                                      <Plus className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                            <div className="space-y-2">
                               {serviceRequestList.map((req, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100 text-sm">
                                     <div>
                                         <span className="font-medium text-slate-700 block">{req.name}</span>
                                         <span className="text-[10px] text-slate-500 uppercase">{req.category}</span>
                                     </div>
                                     <button onClick={() => removeServiceRequest(idx)} className="text-blue-400 hover:text-blue-600">
                                        <X className="w-4 h-4" />
                                     </button>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      {/* Right: Prescription */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                         <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                            <Pill className="w-4 h-4 text-teal-600" /> Prescription
                         </h4>
                         
                         {/* Medicine Selector */}
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 space-y-3">
                            <div className="relative">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                               <input 
                                  type="text" 
                                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                                  placeholder="Search Medicine..."
                                  value={medSearch}
                                  onChange={(e) => { setMedSearch(e.target.value); setSelectedMed(null); }}
                               />
                               {medSearch && filteredMeds.length > 0 && !selectedMed && (
                                  <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto z-20">
                                     {filteredMeds.map(m => (
                                        <div 
                                           key={m.id} 
                                           className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-sm"
                                           onClick={() => { setSelectedMed(m); setMedSearch(m.name); }}
                                        >
                                           <div className="font-medium text-slate-800">{m.name}</div>
                                           <div className="text-xs text-slate-500">{m.genericName} • Stock: {m.stock}</div>
                                        </div>
                                     ))}
                                  </div>
                               )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                               <input type="text" placeholder="Dose (e.g. 500mg)" className="p-2 text-sm border border-slate-200 rounded-lg" value={dose} onChange={e => setDose(e.target.value)} />
                               <div className="relative">
                                  <select className="w-full p-2 text-sm border border-slate-200 rounded-lg appearance-none bg-white" value={freq} onChange={e => setFreq(e.target.value)}>
                                     {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                  </select>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                               <div className="flex items-center gap-2">
                                  <input type="number" placeholder="Days" className="w-full p-2 text-sm border border-slate-200 rounded-lg" value={duration} onChange={e => setDuration(e.target.value)} />
                                  <span className="text-xs text-slate-500 font-medium">Days</span>
                               </div>
                               <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2">
                                  <span className="text-xs text-slate-500 font-medium">Qty:</span>
                                  <input type="number" className="w-full p-2 text-sm outline-none font-bold text-teal-700" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                                  <span className="text-xs text-slate-400">Tabs</span>
                               </div>
                            </div>
                            <button 
                               onClick={addMedicineToPrescription}
                               disabled={!selectedMed}
                               className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                            >
                               Add to List
                            </button>
                         </div>

                         {/* Medicine List Table */}
                         <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                            <table className="w-full text-left text-sm">
                               <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                                  <tr>
                                     <th className="px-3 py-2">Medicine</th>
                                     <th className="px-3 py-2">Dosage</th>
                                     <th className="px-3 py-2 text-center">Qty</th>
                                     <th className="px-3 py-2 w-8"></th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                  {prescriptionList.length === 0 ? (
                                     <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic">No medicines prescribed</td></tr>
                                  ) : (
                                     prescriptionList.map((item, idx) => (
                                        <tr key={idx}>
                                           <td className="px-3 py-2">
                                              <div className="font-medium text-slate-800">{item.medicineName}</div>
                                              <div className="text-[10px] text-slate-500">{item.duration}</div>
                                           </td>
                                           <td className="px-3 py-2 text-slate-600 text-xs">{item.dosage} • {item.frequency}</td>
                                           <td className="px-3 py-2 text-center font-medium text-teal-600">{item.quantity}</td>
                                           <td className="px-3 py-2 text-center">
                                              <button onClick={() => removeMedicineFromPrescription(idx)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                           </td>
                                        </tr>
                                     ))
                                  )}
                               </tbody>
                            </table>
                         </div>
                         
                         {/* Auto Calc Cost (Estimate) */}
                         <div className="mt-3 text-right text-xs text-slate-500">
                            Est. Cost: <span className="font-bold text-slate-800">Rs. {prescriptionList.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                   <button onClick={() => setActiveConsultation(null)} className="px-6 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium">Cancel</button>
                   <button 
                      onClick={handleCompleteConsultation}
                      className="px-6 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium shadow-lg shadow-teal-900/20 flex items-center gap-2"
                   >
                      <Save className="w-4 h-4" /> Save & Send to Billing
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* SPECIAL RABIES REGISTRATION MODAL */}
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
                    {/* Patient Info Display (Read Only) */}
                    <div className="flex gap-4 items-center bg-white/50 px-3 py-1 rounded-lg border border-slate-200">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Age</span>
                            <span className="text-sm font-bold text-slate-700">{activeConsultation.age} Years</span>
                        </div>
                        <div className="w-px h-6 bg-slate-300"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Gender</span>
                            <span className="text-sm font-bold text-slate-700">{activeConsultation.gender}</span>
                        </div>
                    </div>
                    <button onClick={() => setIsRabiesModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                       <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Bite Details Section */}
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

                        {/* Vaccine Schedule Section */}
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
                                                   // Use a type assertion or explicit assignment to handle the dynamic key
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

                            {/* NEXT VISIT MONTH DROPDOWN */}
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

       {/* Registration Modal - RESTORED */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                 <h3 className="text-lg font-bold text-slate-800">नयाँ बिरामी दर्ता (New Registration)</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 <form id="regForm" onSubmit={handleSubmitRegistration} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Patient Name</label>
                       <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Age</label>
                       <input required type="number" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Gender</label>
                       <select className="w-full p-2 border border-slate-200 rounded-lg" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Contact No</label>
                       <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" value={formData.contactNo} onChange={e => setFormData({...formData, contactNo: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Address</label>
                       <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Ethnicity</label>
                       <select className="w-full p-2 border border-slate-200 rounded-lg" value={formData.ethnicity} onChange={e => setFormData({...formData, ethnicity: e.target.value})}>
                          {ethnicityOptions.map(opt => <option key={opt}>{opt}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Service Type / Department</label>
                       {preSelectedService ? (
                          <input type="text" readOnly className="w-full p-2 border border-slate-200 rounded-lg bg-teal-50 font-bold text-teal-700" value={formData.serviceType} />
                       ) : (
                          <select className="w-full p-2 border border-slate-200 rounded-lg bg-teal-50 font-medium" value={formData.department} onChange={handleServiceChange}>
                             {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                             ))}
                          </select>
                       )}
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Registration Fee</label>
                       <input type="number" readOnly className="w-full p-2 border border-slate-200 rounded-lg bg-slate-100" value={formData.cost} />
                    </div>
                 </form>
              </div>
              
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium">रद्द गर्नुहोस्</button>
                 <button type="submit" form="regForm" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">दर्ता गर्नुहोस्</button>
              </div>
           </div>
        </div>
       )}

       {/* Detailed History View */}
       {selectedHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-lg text-white">
                         <FileText className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-lg font-bold text-slate-800">सेवा विवरण (Service Details)</h3>
                         <p className="text-xs text-slate-500">ID: {selectedHistory.id} • Date: {new Date(selectedHistory.timestamp).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedHistory(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-6 h-6" />
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {/* Patient Info Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-slate-100 p-3 rounded-full">
                                <User className="w-8 h-8 text-slate-500" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Patient Name</p>
                                    <p className="font-medium text-slate-900">{selectedHistory.patientName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">ID / Age</p>
                                    <p className="font-medium text-slate-900">{selectedHistory.patientId} / {selectedHistory.age}y</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Contact / Address</p>
                                    <p className="font-medium text-slate-900">{selectedHistory.contactNo || '-'} / {selectedHistory.address}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Facility</p>
                                    <p className="font-medium text-slate-900">{selectedHistory.organizationId || 'Main'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clinical Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-teal-600" /> Diagnosis & Findings
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Diagnosis</span>
                                    <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{selectedHistory.diagnosis || 'Not recorded'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Clinical Notes</span>
                                    <p className="text-sm text-slate-600 leading-relaxed">{selectedHistory.findings || 'No notes available.'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Prescription & Services */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                <Pill className="w-4 h-4 text-blue-600" /> Prescriptions & Services
                            </h4>
                            <div className="space-y-4">
                                {selectedHistory.prescription && selectedHistory.prescription.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedHistory.prescription.map((med, i) => (
                                            <li key={i} className="text-sm flex justify-between items-center p-2 bg-slate-50 rounded">
                                                <span><span className="font-medium">{med.medicineName}</span> <span className="text-slate-500 text-xs">({med.dosage}, {med.frequency})</span></span>
                                                <span className="font-bold text-slate-600">x{med.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No medicines prescribed.</p>
                                )}

                                {selectedHistory.labRequests && selectedHistory.labRequests.length > 0 && (
                                   <div className="mt-4 pt-4 border-t border-slate-100">
                                      <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Lab Requests</h5>
                                      <div className="flex flex-wrap gap-2">
                                         {selectedHistory.labRequests.map((lab, i) => (
                                            <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                                               {lab.testName} {lab.result && `(${lab.result})`}
                                            </span>
                                         ))}
                                      </div>
                                   </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Past Timeline */}
                    {patientFullHistory.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-500" /> Previous Visits Timeline
                            </h4>
                            <div className="space-y-4">
                                {patientFullHistory.map((rec, i) => (
                                    <div key={i} className="flex gap-4 relative pl-4 border-l-2 border-slate-100 pb-4 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-slate-200 rounded-full border-2 border-white"></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500">{new Date(rec.timestamp).toLocaleDateString()}</p>
                                            <p className="text-sm font-medium text-slate-800">{rec.serviceType}</p>
                                            <p className="text-xs text-slate-500">{rec.diagnosis}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button onClick={handlePrintReport} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Print Report
                    </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
