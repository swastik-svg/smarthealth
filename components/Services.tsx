import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, UserPlus, Clock, CheckCircle2, ChevronRight, History, 
  FileText, Activity, Save, X, Stethoscope, Zap, HeartPulse, Cross, 
  Syringe, PawPrint, AlertCircle, Calendar, Printer, ClipboardList, Trash2,
  Users, ArrowRight
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
             r.department === AppView.COMMUNICABLE || r.serviceType.toLowerCase().includes('rabies') || r.serviceType.toLowerCase().includes('arv')
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

  // Rabies Queue Splitting Logic
  const isRabiesView = preSelectedService?.includes('Rabies');

  const rabiesNewQueue = useMemo(() => {
     if (!isRabiesView) return [];
     // Patients who don't have rabies data yet OR haven't taken Day 0 dose
     return displayRecords.filter(r => r.rabiesData === null || r.rabiesData === undefined || !r.rabiesData.schedule?.day0Given);
  }, [displayRecords, isRabiesView]);

  const rabiesFollowUpQueue = useMemo(() => {
     if (!isRabiesView) return [];
     // Patients who have started the course (Day 0 given)
     return displayRecords.filter(r => r.rabiesData && r.rabiesData.schedule?.day0Given);
  }, [displayRecords, isRabiesView]);


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
                <h3>Prescription (औषधि)</h3>
                <table class="rx-table">
                    <thead><tr><th>Medicine</th><th>Dose</th><th>Freq</th><th>Dur</th><th>Qty</th></tr></thead>
                    <tbody>
                        ${record.prescription.map(p => `<tr><td>${p.medicineName}</td><td>${p.dosage}</td><td>${p.frequency}</td><td>${p.duration}</td><td>${p.quantity}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>` : ''}
            
            <div class="footer">
                <p>Doctor's Signature</p>
                <p>____________________</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-teal-600" /> {title}
          </h2>
          <p className="text-slate-500 text-sm">
            {preSelectedService 
              ? 'Rabies Vaccination Clinic & Follow-up' 
              : `Patient Management for ${department.replace(/_/g, ' ')}`}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Patient ID / Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          
          {permissions.patientRegister && (
            <button 
              onClick={handleOpenModal}
              disabled={activeOrgId === 'ALL'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap
                ${activeOrgId === 'ALL' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-900/20'}`}
            >
              <UserPlus className="w-4 h-4" /> 
              {isRabiesView ? 'New Registration' : 'Register Patient'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Patient Details</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Service / Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="w-10 h-10 opacity-20" />
                      <p>No patients found in this queue.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                          ${record.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {record.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{record.patientName}</div>
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                            <span>{record.patientId}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{record.age}Y / {record.gender}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-700 text-sm">{record.serviceType}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit font-bold 
                          ${record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {record.status}
                        </span>
                        {record.timestamp && <span className="text-[10px] text-slate-400">{new Date(record.timestamp).toLocaleDateString()}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {record.status === 'COMPLETED' && (
                          <button 
                            onClick={() => handlePrintReport(record)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Print Report"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => openConsultation(record)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-teal-500 hover:text-teal-600 text-slate-600 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1 ml-auto"
                        >
                          {record.status === 'COMPLETED' ? 'View / Edit' : 'Consultation'} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">New Patient Registration</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="regForm" onSubmit={handleSubmitRegistration} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Patient ID (Auto)</label>
                    <input type="text" disabled value={formData.patientId} className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                    <input type="text" required value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="First Last" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                    <input type="number" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ethnicity</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" value={formData.ethnicity} onChange={e => setFormData({...formData, ethnicity: e.target.value})}>
                      <option>1 - Dalit</option>
                      <option>2 - Janajati</option>
                      <option>3 - Madhesi</option>
                      <option>4 - Muslim</option>
                      <option>5 - Brahmin/Chhetri</option>
                      <option>6 - Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                    <input type="text" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Contact No</label>
                    <input type="tel" value={formData.contactNo} onChange={e => setFormData({...formData, contactNo: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-teal-800 uppercase">Service Requested</label>
                      {preSelectedService ? (
                         <input type="text" disabled value={preSelectedService} className="w-full p-2 bg-white border border-teal-200 rounded-lg text-teal-900 font-medium" />
                      ) : (
                         <select 
                            className="w-full p-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                            value={formData.serviceType}
                            onChange={(e) => {
                               const selected = currentServicesList.find(s => s.name === e.target.value);
                               setFormData({...formData, serviceType: e.target.value, cost: selected ? selected.price : 0});
                            }}
                         >
                            {currentServicesList.map(s => (
                               <option key={s.id} value={s.name}>{s.name} (Rs. {s.price})</option>
                            ))}
                         </select>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-teal-800 uppercase">Service Charge</label>
                      <input 
                        type="number" 
                        value={formData.cost} 
                        onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
                        className="w-full p-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
              <button type="submit" form="regForm" className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-lg">Register & Queue</button>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Modal (Standard) */}
      {activeConsultation && !isRabiesView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" /> Medical Consultation
                </h3>
                <p className="text-xs text-slate-500">{activeConsultation.patientName} ({activeConsultation.age}Y/{activeConsultation.gender})</p>
              </div>
              <button onClick={() => setActiveConsultation(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Clinical Notes */}
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Clinical Findings / Symptoms</label>
                        <textarea 
                           className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 h-32 resize-none" 
                           placeholder="Patient complaints and observations..."
                           value={findings}
                           onChange={e => setFindings(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Provisional Diagnosis</label>
                        <input 
                           type="text" 
                           className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" 
                           placeholder="e.g. Acute Gastritis"
                           value={diagnosis}
                           onChange={e => setDiagnosis(e.target.value)}
                        />
                     </div>
                     
                     {/* Services & Lab Requests */}
                     <div className="space-y-4 pt-2">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                           <label className="block text-xs font-bold text-indigo-800 uppercase mb-2">Service / Procedure Request</label>
                           <div className="flex gap-2 mb-2">
                              <select 
                                 className="w-1/3 p-2 text-xs border border-indigo-200 rounded-lg"
                                 value={requestCategory}
                                 onChange={(e) => setRequestCategory(e.target.value)}
                              >
                                 <option value="X_RAY">X-Ray</option>
                                 <option value="USG">USG</option>
                                 <option value={AppView.DRESSING_MINOR_OT}>Procedure</option>
                                 <option value={AppView.IMMUNIZATION}>Vaccine</option>
                              </select>
                              <select 
                                 className="flex-1 p-2 text-xs border border-indigo-200 rounded-lg"
                                 value={selectedRequestItem}
                                 onChange={(e) => setSelectedRequestItem(e.target.value)}
                              >
                                 <option value="">Select Service...</option>
                                 {filteredServiceRequests.map(s => (
                                    <option key={s.id} value={`${s.id}||${s.name}||${s.price}`}>{s.name} (Rs. {s.price})</option>
                                 ))}
                              </select>
                              <button onClick={handleAddServiceRequest} className="bg-indigo-600 text-white p-2 rounded-lg text-xs font-bold">Add</button>
                           </div>
                           <div className="space-y-1">
                              {serviceRequestList.map((req, i) => (
                                 <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-indigo-100 text-xs">
                                    <span className="font-medium text-slate-700">{req.name}</span>
                                    <button onClick={() => removeServiceRequest(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                           <label className="block text-xs font-bold text-purple-800 uppercase mb-2">Lab Investigation Request</label>
                           <div className="relative mb-2">
                              <input 
                                 type="text" 
                                 className="w-full p-2 text-xs border border-purple-200 rounded-lg" 
                                 placeholder="Search Lab Test (e.g. CBC)..."
                                 value={newLabTestName}
                                 onChange={e => { setNewLabTestName(e.target.value); setShowLabSuggestions(true); }}
                                 onKeyDown={e => { if (e.key === 'Enter') handleAddLabRequest(); }}
                              />
                              {showLabSuggestions && filteredLabTests.length > 0 && (
                                 <div className="absolute top-full left-0 w-full bg-white border border-purple-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10 mt-1">
                                    {filteredLabTests.map((t, i) => (
                                       <div key={i} className="p-2 text-xs hover:bg-purple-50 cursor-pointer" onClick={() => handleAddLabRequest(t)}>{t}</div>
                                    ))}
                                 </div>
                              )}
                           </div>
                           <div className="space-y-1">
                              {labRequestList.map((req, i) => (
                                 <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100 text-xs">
                                    <span className="font-medium text-slate-700">{req.testName}</span>
                                    <button onClick={() => removeLabRequest(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right: Prescription */}
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 flex flex-col h-full">
                     <label className="block text-sm font-bold text-teal-800 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Prescription (Rx)
                     </label>
                     
                     {/* Medicine Search */}
                     <div className="mb-4 space-y-2">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <input 
                              type="text"
                              className="w-full pl-9 pr-4 py-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                              placeholder="Search Medicine..."
                              value={medSearch}
                              onChange={e => { setMedSearch(e.target.value); setSelectedMed(null); }}
                           />
                           {medSearch && !selectedMed && filteredMeds.length > 0 && (
                              <div className="absolute top-full left-0 w-full bg-white border border-teal-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20 mt-1">
                                 {filteredMeds.map(med => (
                                    <div 
                                       key={med.id} 
                                       className="p-2 hover:bg-teal-50 cursor-pointer border-b border-slate-50 text-xs flex justify-between items-center"
                                       onClick={() => { setSelectedMed(med); setMedSearch(med.name); }}
                                    >
                                       <span className="font-bold text-slate-700">{med.name}</span>
                                       <span className="text-slate-400">Stock: {med.stock}</span>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                           <input type="text" className="p-2 border border-teal-200 rounded text-xs" placeholder="Dose (500mg)" value={dose} onChange={e => setDose(e.target.value)} />
                           <select className="p-2 border border-teal-200 rounded text-xs" value={freq} onChange={e => setFreq(e.target.value)}>
                              {frequencyOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                           </select>
                           <input type="text" className="p-2 border border-teal-200 rounded text-xs" placeholder="Days (5)" value={duration} onChange={e => setDuration(e.target.value)} />
                           <div className="flex gap-1">
                              <input type="number" className="w-16 p-2 border border-teal-200 rounded text-xs" placeholder="Qty" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                              <button onClick={addMedicineToPrescription} disabled={!selectedMed} className="bg-teal-600 text-white p-2 rounded text-xs font-bold flex-1 disabled:opacity-50">Add</button>
                           </div>
                        </div>
                     </div>

                     {/* Prescription List */}
                     <div className="flex-1 bg-white rounded-xl border border-teal-100 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                           {prescriptionList.length === 0 ? (
                              <div className="text-center py-8 text-slate-400 text-xs italic">No medicines added</div>
                           ) : (
                              prescriptionList.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 text-xs group">
                                    <div>
                                       <div className="font-bold text-slate-700">{item.medicineName}</div>
                                       <div className="text-slate-500">{item.dosage} • {item.frequency} • {item.duration}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <span className="font-bold text-teal-600">Qty: {item.quantity}</span>
                                       <button onClick={() => removeMedicineFromPrescription(idx)} className="text-red-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
               <button onClick={() => setActiveConsultation(null)} className="px-6 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50">Cancel</button>
               <button onClick={handleCompleteConsultation} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save & Complete
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Rabies Consultation Modal */}
      {isRabiesModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
               <div className="px-6 py-4 border-b border-slate-200 bg-red-50 flex justify-between items-center">
                  <div>
                     <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                        <PawPrint className="w-5 h-5" /> रेबिज खोप रजिष्टर (Rabies Vaccine Register)
                     </h3>
                     <p className="text-xs text-red-700">{activeConsultation?.patientName} ({activeConsultation?.patientId})</p>
                  </div>
                  <button onClick={() => setIsRabiesModalOpen(false)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                  
                  {/* Demographic & Incident Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                              <input type="number" className="w-full p-2 border rounded" value={tempDemographics.age} onChange={e => setTempDemographics({...tempDemographics, age: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                              <select className="w-full p-2 border rounded" value={tempDemographics.gender} onChange={e => setTempDemographics({...tempDemographics, gender: e.target.value})}>
                                 <option>Male</option>
                                 <option>Female</option>
                                 <option>Other</option>
                              </select>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 uppercase">Date of Bite (BS)</label>
                           <input type="text" className="w-full p-2 border rounded" placeholder="YYYY-MM-DD" value={rabiesFormData.dateOfBite} onChange={e => setRabiesFormData({...rabiesFormData, dateOfBite: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 uppercase">Animal Type</label>
                           <select className="w-full p-2 border rounded" value={rabiesFormData.animalType} onChange={e => setRabiesFormData({...rabiesFormData, animalType: e.target.value})}>
                              <option>Dog (कुकुर)</option>
                              <option>Cat (बिरालो)</option>
                              <option>Monkey (बाँदर)</option>
                              <option>Cattle </option>
                              <option>Jackal (स्याल)</option>
                              <option>Rodent (मुसा)</option>
                              <option>Tiger (बाघ)</option>
                              <option>Bear (भालु)</option>
                              <option>Other</option>
                           </select>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 uppercase">Bite Site / Nature</label>
                           <div className="grid grid-cols-2 gap-2">
                              <input type="text" className="p-2 border rounded" placeholder="Site (Leg/Hand)" value={rabiesFormData.biteSite} onChange={e => setRabiesFormData({...rabiesFormData, biteSite: e.target.value})} />
                              <select className="p-2 border rounded" value={rabiesFormData.exposureNature} onChange={e => setRabiesFormData({...rabiesFormData, exposureNature: e.target.value})}>
                                 <option>Bite</option>
                                 <option>Scratch</option>
                                 <option>Lick</option>
                              </select>
                           </div>
                        </div>
                        <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={rabiesFormData.skinBroken} onChange={e => setRabiesFormData({...rabiesFormData, skinBroken: e.target.checked})} />
                              छाला पिलिसिएको (Skin Broken)
                           </label>
                           <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={rabiesFormData.woundBleeding} onChange={e => setRabiesFormData({...rabiesFormData, woundBleeding: e.target.checked})} />
                              रगत आएको (Bleeding)
                           </label>
                           <label className="flex items-center gap-2 text-sm text-red-600 font-bold">
                              <input type="checkbox" checked={rabiesFormData.humanRabiesCase} onChange={e => setRabiesFormData({...rabiesFormData, humanRabiesCase: e.target.checked})} />
                              Hydrophobia Case (Death)
                           </label>
                        </div>
                     </div>
                  </div>

                  {/* Vaccination Schedule */}
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                     <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2"><Syringe className="w-4 h-4" /> Vaccination Schedule (Intradermal 0.1ml)</h4>
                     <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="font-bold text-slate-600">Day 0</div>
                        <div className="font-bold text-slate-600">Day 3</div>
                        <div className="font-bold text-slate-600">Day 7</div>
                        <div className="font-bold text-slate-600">Day 14</div>
                        <div className="font-bold text-slate-600">Day 28</div>

                        {/* Dates */}
                        <input type="text" className="p-1 border rounded text-center" value={rabiesFormData.schedule.day0 || ''} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day0: e.target.value}})} />
                        <input type="text" className="p-1 border rounded text-center" value={rabiesFormData.schedule.day3 || ''} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day3: e.target.value}})} />
                        <input type="text" className="p-1 border rounded text-center" value={rabiesFormData.schedule.day7 || ''} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day7: e.target.value}})} />
                        <input type="text" className="p-1 border rounded text-center" value={rabiesFormData.schedule.day14 || ''} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day14: e.target.value}})} />
                        <input type="text" className="p-1 border rounded text-center" value={rabiesFormData.schedule.day28 || ''} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day28: e.target.value}})} />

                        {/* Status Checkboxes */}
                        <div className="flex justify-center pt-2"><input type="checkbox" className="w-5 h-5 accent-red-600" checked={rabiesFormData.schedule.day0Given} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day0Given: e.target.checked}})} /></div>
                        <div className="flex justify-center pt-2"><input type="checkbox" className="w-5 h-5 accent-red-600" checked={rabiesFormData.schedule.day3Given} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day3Given: e.target.checked}})} /></div>
                        <div className="flex justify-center pt-2"><input type="checkbox" className="w-5 h-5 accent-red-600" checked={rabiesFormData.schedule.day7Given} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day7Given: e.target.checked}})} /></div>
                        <div className="flex justify-center pt-2"><input type="checkbox" className="w-5 h-5 accent-red-600" checked={rabiesFormData.schedule.day14Given} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day14Given: e.target.checked}})} /></div>
                        <div className="flex justify-center pt-2"><input type="checkbox" className="w-5 h-5 accent-red-600" checked={rabiesFormData.schedule.day28Given} onChange={e => setRabiesFormData({...rabiesFormData, schedule: {...rabiesFormData.schedule, day28Given: e.target.checked}})} /></div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Registered Month (Report)</label>
                        <select 
                           className="w-full p-2 border rounded bg-slate-50"
                           value={rabiesFormData.registeredMonth || ''}
                           onChange={e => setRabiesFormData({...rabiesFormData, registeredMonth: e.target.value})}
                        >
                           <option value="">Auto (Based on Date)</option>
                           {NEPALI_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">WHO Category</label>
                        <select className="w-full p-2 border rounded" value={rabiesFormData.whoCategory} onChange={e => setRabiesFormData({...rabiesFormData, whoCategory: e.target.value as any})}>
                           <option>I</option>
                           <option>II</option>
                           <option>III</option>
                        </select>
                     </div>
                  </div>

               </div>

               <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setIsRabiesModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-700">Cancel</button>
                  <button onClick={handleSaveRabies} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg">Save Record</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};