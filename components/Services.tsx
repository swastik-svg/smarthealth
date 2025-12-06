

import React, { useState, useEffect, useMemo } from 'react';
import { Stethoscope, Activity, Heart, Thermometer, Syringe, ClipboardPlus, Clock, UserPlus, X, Save, History, Search, CheckCircle2, ListOrdered, FileText, ChevronRight, FileClock, Pill, Plus, Trash2, AlertCircle, Calculator, User, Calendar, Phone, MapPin, FlaskConical, ClipboardList, Printer, Building2, Zap, Baby, Apple, ShieldCheck, HeartPulse, Cross, Users, PlusCircle } from 'lucide-react';
import { dbService } from '../services/db';
import { ServiceRecord, ServiceStatus, Medicine, PrescriptionItem, Sale, LabTest, UserPermissions, AppView, ServiceItemRequest } from '../types';

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

// Comprehensive list of common lab tests
const COMMON_LAB_TESTS = [
  "Albumin",
  "Alkaline Phosphatase (ALP)",
  "Amylase",
  "ASO Titer",
  "Bilirubin (Total/Direct)",
  "Bleeding Time (BT) / Clotting Time (CT)",
  "Blood Culture",
  "Blood Grouping & Rh",
  "Blood Sugar (Fasting)",
  "Blood Sugar (PP)",
  "Blood Sugar (Random)",
  "Calcium",
  "CBC (Complete Blood Count)",
  "Cholesterol (Total)",
  "CRP (C-Reactive Protein)",
  "Dengue NS1 Ag",
  "Dengue IgM/IgG",
  "Electrolytes (Na/K/Cl)",
  "ESR (Erythrocyte Sedimentation Rate)",
  "Ferritin",
  "HBA1C (Glycated Hemoglobin)",
  "HBsAg",
  "HCV Antibody",
  "Hemoglobin",
  "HIV I & II",
  "Iron Profile",
  "Lipid Profile",
  "Liver Function Test (LFT)",
  "Magnesium",
  "Mantoux Test",
  "Pap Smear",
  "Platelet Count",
  "Pregnancy Test (UPT)",
  "Prothrombin Time (PT/INR)",
  "RA Factor",
  "Renal Function Test (RFT)",
  "Reticulocyte Count",
  "Semen Analysis",
  "SGOT (AST)",
  "SGPT (ALT)",
  "Sputum for AFB",
  "Stool Culture",
  "Stool Occult Blood",
  "Stool R/E",
  "T3, T4, TSH (Thyroid Profile)",
  "Triglycerides",
  "Troponin I / T",
  "Typhoid (Widal)",
  "Urea",
  "Uric Acid",
  "Urine Culture",
  "Urine Ketone",
  "Urine Pregnancy Test",
  "Urine R/E",
  "VDRL / RPR",
  "Vitamin B12",
  "Vitamin D"
].sort();

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
  
  // New: Service Request State
  const [serviceRequestList, setServiceRequestList] = useState<ServiceItemRequest[]>([]);
  const [requestCategory, setRequestCategory] = useState(AppView.X_RAY);
  const [selectedRequestItem, setSelectedRequestItem] = useState('');

  // Prescription Builder State
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('1-0-0'); // Default OD
  const [duration, setDuration] = useState('');
  const [qty, setQty] = useState(1);

  // Hide service cards (catalog) for ALL departments as per request to clean up UI
  const hideServiceCards = true;

  // Department specific service catalogs
  const DEPARTMENT_SERVICES: Record<string, Array<{id: number, name: string, price: number, icon: any, desc: string, duration: string}>> = {
     [AppView.GENERAL_TREATMENT]: [
         { id: 1, name: 'General Consultation', price: 50.00, icon: Stethoscope, desc: 'Basic health checkup.', duration: '15 mins' },
         { id: 2, name: 'Follow-up', price: 30.00, icon: Clock, desc: 'Review visit.', duration: '10 mins' },
         { id: 3, name: 'Emergency Check', price: 100.00, icon: Activity, desc: 'Urgent care assessment.', duration: '20 mins' },
     ],
     [AppView.X_RAY]: [
         { id: 101, name: 'Chest X-Ray (PA/AP)', price: 300.00, icon: Zap, desc: 'Chest radiography.', duration: '10 mins' },
         { id: 102, name: 'X-Ray Limbs', price: 250.00, icon: Zap, desc: 'Hand/Leg X-Ray.', duration: '15 mins' },
         { id: 103, name: 'X-Ray Spine', price: 400.00, icon: Zap, desc: 'Spinal column radiography.', duration: '20 mins' },
     ],
     [AppView.USG]: [
         { id: 201, name: 'Abdomen USG', price: 500.00, icon: Activity, desc: 'Full abdomen ultrasound.', duration: '20 mins' },
         { id: 202, name: 'Pelvic USG', price: 450.00, icon: Activity, desc: 'Pelvic region scan.', duration: '15 mins' },
         { id: 203, name: 'Obstetric USG', price: 500.00, icon: Baby, desc: 'Pregnancy scan.', duration: '20 mins' },
     ],
     [AppView.ECG]: [
         { id: 301, name: 'Standard ECG', price: 200.00, icon: HeartPulse, desc: '12-lead ECG.', duration: '10 mins' },
     ],
     [AppView.DRESSING_MINOR_OT]: [
         { id: 401, name: 'Simple Dressing', price: 100.00, icon: Cross, desc: 'Wound cleaning and bandaging.', duration: '15 mins' },
         { id: 402, name: 'Stitch Removal', price: 150.00, icon: Syringe, desc: 'Removing sutures.', duration: '10 mins' },
         { id: 403, name: 'Abscess Drainage', price: 500.00, icon: Cross, desc: 'Minor procedure.', duration: '30 mins' },
     ],
     [AppView.MCH]: [
         { id: 501, name: 'ANC Checkup', price: 50.00, icon: Baby, desc: 'Antenatal care.', duration: '20 mins' },
     ],
     [AppView.IMMUNIZATION]: [
         { id: 1101, name: 'BCG Vaccine', price: 0.00, icon: Syringe, desc: 'Tuberculosis vaccine.', duration: '5 mins' },
         { id: 1102, name: 'DPT-HepB-Hib', price: 0.00, icon: Syringe, desc: 'Pentavalent vaccine.', duration: '5 mins' },
         { id: 1103, name: 'Polio (OPV/IPV)', price: 0.00, icon: Syringe, desc: 'Polio vaccine.', duration: '5 mins' },
         { id: 1104, name: 'Measles-Rubella', price: 0.00, icon: Syringe, desc: 'MR vaccine.', duration: '5 mins' },
         { id: 1105, name: 'JE Vaccine', price: 0.00, icon: Syringe, desc: 'Japanese Encephalitis.', duration: '5 mins' },
         { id: 1106, name: 'PCV Vaccine', price: 0.00, icon: Syringe, desc: 'Pneumococcal vaccine.', duration: '5 mins' },
         { id: 1107, name: 'Td Vaccine', price: 0.00, icon: Syringe, desc: 'Tetanus & Diphtheria.', duration: '5 mins' },
     ],
     [AppView.TB_LEPROSY]: [
         { id: 601, name: 'TB Screening', price: 0.00, icon: Thermometer, desc: 'Sputum collection/referral.', duration: '15 mins' },
         { id: 602, name: 'DOTS Service', price: 0.00, icon: Pill, desc: 'Directly observed therapy.', duration: '5 mins' },
     ],
     [AppView.NUTRITION]: [
         { id: 701, name: 'Growth Monitoring', price: 0.00, icon: Apple, desc: 'Child weight/height check.', duration: '10 mins' },
         { id: 702, name: 'Nutrition Counseling', price: 50.00, icon: Apple, desc: 'Dietary advice.', duration: '20 mins' },
     ],
     // Default fallbacks for others
     [AppView.CBIMNCI]: [{ id: 801, name: 'CBIMNCI Assessment', price: 0.00, icon: Baby, desc: 'Integrated child illness management.', duration: '20 mins' }],
     [AppView.COMMUNICABLE]: [
         { id: 901, name: 'Infection Screen', price: 50.00, icon: ShieldCheck, desc: 'Screening for diseases.', duration: '15 mins' },
         { id: 902, name: 'Rabies Vaccine Registration', price: 0.00, icon: Syringe, desc: 'Anti-rabies vaccination course.', duration: '5 mins' }
     ],
     [AppView.NON_COMMUNICABLE]: [{ id: 1001, name: 'NCD Screening', price: 50.00, icon: Heart, desc: 'BP, Sugar, BMI Check.', duration: '15 mins' }],
  };

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

  const currentServicesList = DEPARTMENT_SERVICES[department] || DEPARTMENT_SERVICES[AppView.GENERAL_TREATMENT];

  // Standard Frequency Options
  const frequencyOptions = [
    { label: 'OD - दिनको एक पटक (1-0-0)', value: '1-0-0', multiplier: 1 },
    { label: 'BID - दिनको दुई पटक (1-0-1)', value: '1-0-1', multiplier: 2 },
    { label: 'TDS - दिनको तीन पटक (1-1-1)', value: '1-1-1', multiplier: 3 },
    { label: 'QID - चार पटक (1-1-1-1)', value: '1-1-1-1', multiplier: 4 },
    { label: 'HS - राती सुत्ने बेला (0-0-1)', value: '0-0-1', multiplier: 1 },
    { label: 'SOS - आवश्यक पर्दा (As Needed)', value: 'SOS', multiplier: 0 },
  ];

  const ethnicityOptions = [
    "1 - Dalit",
    "2 - Janajati",
    "3 - Madhesi",
    "4 - Muslim",
    "5 - Brahmin/Chhetri",
    "6 - Others"
  ];

  const generateUniqueId = () => {
    const prefix = "PAT";
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000); 
    return `${prefix}-${year}-${random}`;
  };

  const handleOpenModal = (serviceName: string = '', price: number = 0) => {
    if (!permissions.patientRegister) return; 
    if (activeOrgId === 'ALL') {
        alert("कृपया बिरामी दर्ता गर्नको लागि एक विशिष्ट संस्था चयन गर्नुहोस्।");
        return;
    }
    
    // Determine default label/cost
    let defaultLabel = DEPARTMENT_LABELS[department] || "General Services";
    let defaultPrice = price || currentServicesList[0]?.price || 0;

    // Override if preSelectedService is provided
    if (preSelectedService) {
        defaultLabel = preSelectedService;
        // Try to find price for this specific service
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
      department: department // Reset to current view's department initially
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    loadRecords();
  }, [activeOrgId, department]);

  // Handle Auto Open Registration
  useEffect(() => {
    if (autoOpenRegistration && permissions.patientRegister && activeOrgId !== 'ALL') {
       handleOpenModal();
    }
  }, [autoOpenRegistration, permissions.patientRegister, activeOrgId, preSelectedService]);

  // Auto-Calculate Quantity when Frequency or Duration changes
  useEffect(() => {
    if (!duration) return;
    
    const selectedFreq = frequencyOptions.find(f => f.value === freq);
    const multiplier = selectedFreq ? selectedFreq.multiplier : 0;
    const days = parseInt(duration) || 0;
    
    if (multiplier > 0 && days > 0) {
      setQty(multiplier * days);
    }
  }, [freq, duration]);

  const loadRecords = async () => {
    try {
      const allRecords = await dbService.getAllServiceRecords();
      
      // Filter by Organization
      let filtered = allRecords;
      if (activeOrgId && activeOrgId !== 'ALL') {
          filtered = allRecords.filter(r => r.organizationId === activeOrgId);
      }
      
      // Filter by Department
      // Note: We strictly filter by the current 'department' view unless it's a shared/global view request.
      filtered = filtered.filter(r => {
         // Fallback for old records without department: assume General Treatment
         const recordDept = r.department || AppView.GENERAL_TREATMENT;
         return recordDept === department;
      });

      setRecords(filtered.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error("Failed to load records", e);
    }
  };

  const pendingQueues = useMemo(() => {
    const pending = records.filter(r => r.status === 'PENDING');
    const grouped: Record<string, ServiceRecord[]> = {};
    
    pending.forEach(record => {
      if (!grouped[record.serviceType]) {
        grouped[record.serviceType] = [];
      }
      grouped[record.serviceType].push(record);
    });

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.queueNumber - b.queueNumber);
    });

    return grouped;
  }, [records]);

  const filteredMeds = useMemo(() => {
     if (!medSearch) return [];
     return inventory.filter(m => 
       (m.name.toLowerCase().includes(medSearch.toLowerCase()) || 
       m.genericName.toLowerCase().includes(medSearch.toLowerCase())) &&
       m.stock > 0
     );
  }, [medSearch, inventory]);

  const filteredLabTests = useMemo(() => {
     if (!newLabTestName) return [];
     return COMMON_LAB_TESTS.filter(t => 
        t.toLowerCase().includes(newLabTestName.toLowerCase())
     );
  }, [newLabTestName]);

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
    
    // Default cost to the first service price of that department
    const defaultCost = DEPARTMENT_SERVICES[selectedDeptKey]?.[0]?.price || 0;

    setFormData({
      ...formData,
      serviceType: label, // Service Type is now the Main Department Name
      department: selectedDeptKey,
      cost: defaultCost
    });
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeOrgId === 'ALL') return;

    // Queue generation logic simplified for demo
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
      department: formData.department, // Use the detected department
      cost: formData.cost,
      timestamp: Date.now(),
      status: 'PENDING',
      queueNumber: nextQueueNumber,
      organizationId: activeOrgId
    };

    try {
      await dbService.addServiceRecord(newRecord);
      
      // If the new record belongs to the CURRENT view's department, add it to state immediately
      if (formData.department === department) {
          setRecords([newRecord, ...records]);
      } else {
          // If registered for another department, show a notification
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

    const newTest: LabTest = {
       id: crypto.randomUUID(),
       testName: nameToAdd,
       status: 'PENDING',
       billingStatus: 'PENDING',
       price: 500, // Default generic price for lab tests
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
         activeConsultation.id, 
         diagnosis, 
         findings, 
         prescriptionList,
         labRequestList,
         serviceRequestList
      );
      
      setRecords(prev => prev.map(r => 
        r.id === activeConsultation.id 
          ? { 
              ...r, 
              status: 'COMPLETED' as ServiceStatus, 
              findings, 
              diagnosis, 
              prescription: prescriptionList,
              prescriptionStatus: prescriptionList.length > 0 ? 'PENDING' : 'BILLED',
              labRequests: labRequestList,
              serviceRequests: serviceRequestList
            } 
          : r
      ));
      
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
      console.error("Failed to update status", err);
      alert("सेवा सम्पन्न गर्न असफल भयो");
    }
  };

  const handlePrintReport = () => {
    if (!selectedHistory) return;
  
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const storeName = settings.storeName || 'Smart Health';
    const storeAddress = settings.address || 'Address';
  
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print reports");
        return;
    }
  
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Report - ${selectedHistory.patientName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #0f766e; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
          .patient-info { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
          .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
          .value { font-weight: 600; color: #0f172a; font-size: 15px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: 700; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
          .content-box { font-size: 14px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 12px 8px; background: #f1f5f9; color: #475569; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
          td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${storeName}</h1>
          <p>${storeAddress}</p>
          <p style="margin-top: 10px; font-weight: bold; color: #0f172a;">${title.toUpperCase()} REPORT</p>
          ${selectedHistory.organizationId && selectedHistory.organizationId !== 'MAIN' ? `<p style="font-size: 12px; color: #64748b; margin-top: 4px;">Branch: ${selectedHistory.organizationId}</p>` : ''}
        </div>
        <div class="patient-info">
          <div class="info-grid">
             <div><div class="label">Patient Name</div><div class="value">${selectedHistory.patientName}</div></div>
             <div><div class="label">Patient ID</div><div class="value">${selectedHistory.patientId}</div></div>
             <div><div class="label">Age / Gender</div><div class="value">${selectedHistory.age} Years / ${selectedHistory.gender}</div></div>
             <div><div class="label">Visit Date</div><div class="value">${new Date(selectedHistory.timestamp).toLocaleDateString()}</div></div>
             <div><div class="label">Service Type</div><div class="value">${selectedHistory.serviceType}</div></div>
          </div>
        </div>
        <div class="section">
           <div class="section-title">Clinical Findings</div>
           <div class="content-box">
              <p style="margin-bottom: 10px;"><strong>Diagnosis:</strong> ${selectedHistory.diagnosis || 'N/A'}</p>
              <p><strong>Clinical Notes:</strong> ${selectedHistory.findings || 'N/A'}</p>
           </div>
        </div>
        ${selectedHistory.prescription && selectedHistory.prescription.length > 0 ? `
        <div class="section">
           <div class="section-title">Prescribed Medication (Rx)</div>
           <table>
              <thead><tr><th>Medicine</th><th>Dosage</th><th>Duration</th><th style="text-align:right">Qty</th></tr></thead>
              <tbody>
                 ${selectedHistory.prescription.map(p => `<tr><td>${p.medicineName}</td><td>${p.dosage} - ${p.frequency}</td><td>${p.duration}</td><td style="text-align:right">${p.quantity}</td></tr>`).join('')}
              </tbody>
           </table>
        </div>` : ''}
        <div class="footer">
           <div>Generated on ${new Date().toLocaleString()}</div>
           <div>Authorized Signature</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const pendingRecords = records.filter(r => r.status === 'PENDING');
  
  const filteredRecords = pendingRecords.filter(r => 
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const historyRecords = records.filter(r => r.status === 'COMPLETED');
  const filteredHistory = historyRecords.filter(r => 
    r.patientName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    r.patientId.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    r.contactNo.includes(historySearchTerm)
  );

  const viewHistoryRecord = (record: ServiceRecord) => {
     if (permissions.viewPatientHistory) {
        setSelectedHistory(record);
     } else {
        alert("पूर्ण विवरण हेर्ने अनुमति छैन।");
     }
  };

  const isRegistrationDisabled = activeOrgId === 'ALL';
  const showOrgColumn = activeOrgId === 'ALL';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
       
       {/* Header Section */}
       <div className="flex flex-col md:flex-row gap-6 justify-between items-end bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
             <h2 className="text-3xl font-bold mb-2">{title}</h2>
             <p className="text-teal-100 max-w-xl">
               बिरामी दर्ता, प्रत्यक्ष लाम व्यवस्थापन र डिजिटल परामर्श सेवा।
             </p>
          </div>
          {/* Show Registration button ONLY if autoOpenRegistration is true (Shortcut View) */}
          {autoOpenRegistration && permissions.patientRegister ? (
             <button 
                disabled={isRegistrationDisabled}
                onClick={() => handleOpenModal()}
                className={`relative z-10 bg-white text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 ${isRegistrationDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isRegistrationDisabled ? "दर्ता गर्न संस्था छान्नुहोस्" : ""}
             >
                <UserPlus className="w-5 h-5" />
                नयाँ बिरामी दर्ता
             </button>
          ) : null}
          <Stethoscope className="absolute right-10 -top-10 w-64 h-64 text-white opacity-10 rotate-12" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Services Grid - Hidden for ALL services */}
          {!hideServiceCards && (
             <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" /> उपलब्ध सेवाहरू (Available Services)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {currentServicesList.map((service) => (
                      <div 
                         key={service.id} 
                         onClick={() => !isRegistrationDisabled && permissions.patientRegister && handleOpenModal(service.name, service.price)}
                         className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all group relative overflow-hidden flex flex-col justify-between h-full
                            ${permissions.patientRegister && !isRegistrationDisabled ? 'hover:border-teal-400 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                      >
                         <div className="absolute top-0 right-0 p-2 bg-teal-50 text-teal-700 font-bold rounded-bl-2xl text-xs">
                           रु. {service.price}
                         </div>
                         
                         <div>
                            <div className="flex items-center gap-3 mb-3">
                               <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                  <service.icon className="w-6 h-6" />
                               </div>
                               <h3 className="text-md font-bold text-slate-800 group-hover:text-teal-700 transition-colors leading-tight">{service.name}</h3>
                            </div>
                            <p className="text-slate-500 text-xs mb-3 leading-relaxed">{service.desc}</p>
                         </div>
                         
                         <div className="flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                            <Clock className="w-3 h-3" />
                            <span>{service.duration}</span>
                            {permissions.patientRegister && !isRegistrationDisabled && (
                              <span className="ml-auto text-teal-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Book Now &rarr;</span>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* Live Queue Section - Always Full width now that Services Grid is hidden */}
          <div className={hideServiceCards ? "lg:col-span-3" : "lg:col-span-1"}>
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
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
                                            {record.queueNumber}
                                            </div>
                                            <div>
                                            <div className="font-bold text-slate-800 text-sm">{record.patientName}</div>
                                            <div className="text-[10px] text-slate-500">{record.gender}, {record.age}y</div>
                                            </div>
                                        </div>
                                        {permissions.doctorConsultation && (
                                            <button className="p-2 text-slate-400 hover:text-teal-600 rounded-lg transition-colors">
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
                <p className="text-xs text-slate-500 mt-1">सेवा सुरु गर्न बिरामी छान्नुहोस्।</p>
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
             <table className="w-full text-left">
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
                   {filteredRecords.length === 0 ? (
                      <tr>
                         <td colSpan={showOrgColumn ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center">
                               <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20 mb-2" />
                               <p>सेवाका लागि कुनै बिरामी बाँकी छैनन्।</p>
                            </div>
                         </td>
                      </tr>
                   ) : (
                      filteredRecords.map((record) => (
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

       {/* Recent Reports */}
       {historyRecords.length > 0 && permissions.viewPatientHistory && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <ClipboardList className="w-5 h-5 text-blue-600" /> भर्खरका मेडिकल रिपोर्टहरू
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">पछिल्ला क्लिनिकल रिपोर्ट र निदान नतिजाहरू।</p>
                </div>
             </div>
             
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30">
                {historyRecords.slice(0, 3).map(record => (
                   <div key={record.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                               {record.patientName.charAt(0)}
                            </div>
                            <div>
                               <div className="font-bold text-slate-800 line-clamp-1">{record.patientName}</div>
                               <div className="text-xs text-slate-500">{record.patientId}</div>
                            </div>
                         </div>
                         <div className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">
                            {new Date(record.timestamp).toLocaleDateString()}
                         </div>
                      </div>
                      
                      <div className="flex-1 space-y-2 mb-4">
                         <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">सेवा</span>
                            <span className="text-sm font-medium text-slate-800">{record.serviceType}</span>
                         </div>
                         {record.diagnosis && (
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                               <span className="text-xs font-semibold text-blue-500 uppercase block mb-1">रोग निदान (Diagnosis)</span>
                               <span className="text-sm text-blue-900 line-clamp-2">{record.diagnosis}</span>
                            </div>
                         )}
                         {showOrgColumn && (
                             <div className="text-[10px] text-slate-400 font-mono text-right mt-1">
                                 {record.organizationId}
                             </div>
                         )}
                      </div>

                      <button 
                         onClick={() => viewHistoryRecord(record)}
                         className="w-full py-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                         <FileText className="w-4 h-4" /> पूरा रिपोर्ट हेर्नुहोस्
                      </button>
                   </div>
                ))}
             </div>
          </div>
       )}

       {/* Service History Section */}
       {permissions.viewPatientHistory && (
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   <FileClock className="w-5 h-5 text-slate-500" /> सेवा इतिहास (Service History)
                </h3>
                <p className="text-xs text-slate-500 mt-1">पुराना बिरामी विवरण हेर्न रेकर्डमा क्लिक गर्नुहोस्।</p>
             </div>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="इतिहास खोज्नुहोस्..." 
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                />
             </div>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                      {showOrgColumn && <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Org</th>}
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">मिति</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">बिरामी</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">निदान (Diagnosis)</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">सिफारिस औषधि</th>
                      <th className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">कुल बिल</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredHistory.length === 0 ? (
                      <tr>
                         <td colSpan={showOrgColumn ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center">
                               <History className="w-10 h-10 text-slate-300 mb-2" />
                               <p>कुनै इतिहास फेला परेन।</p>
                            </div>
                         </td>
                      </tr>
                   ) : (
                      filteredHistory.map((record) => (
                         <tr 
                            key={record.id} 
                            onClick={() => viewHistoryRecord(record)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                         >
                            {showOrgColumn && (
                                <td className="px-6 py-4 text-xs font-mono text-slate-500">{record.organizationId}</td>
                            )}
                            <td className="px-6 py-4 text-xs text-slate-500">
                               {new Date(record.timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                               <div className="font-medium text-slate-900 text-sm">{record.patientName}</div>
                               <div className="text-xs text-slate-500">{record.patientId}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700 max-w-[150px] truncate" title={record.diagnosis}>
                               {record.diagnosis || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                               {record.prescription && record.prescription.length > 0 ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                     {record.prescription.length} items
                                  </span>
                               ) : (
                                  <span className="text-slate-400 text-xs">None</span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-800">
                               रु. {record.totalBill?.toFixed(2) || record.cost.toFixed(2)}
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </div>
       )}

       {/* Registration Modal - RESTORED */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
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
              
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium">रद्द गर्नुहोस्</button>
                 <button type="submit" form="regForm" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">दर्ता गर्नुहोस्</button>
              </div>
           </div>
        </div>
       )}
       
       {activeConsultation && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                       <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-800">क्लिनिकल परामर्श (Consultation)</h3>
                       <p className="text-xs text-slate-500">Patient: <span className="font-semibold text-slate-700">{activeConsultation.patientName}</span></p>
                    </div>
                 </div>
                 <button onClick={() => setActiveConsultation(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                 {/* Left Panel: Vitals, Findings & Requests */}
                 <div className="w-full md:w-5/12 border-r border-slate-200 p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
                    <div className="space-y-6">
                       
                       {/* Patient Summary */}
                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">बिरामी विवरण</h4>
                           <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-slate-500">Gender/Age:</span> <span className="font-medium">{activeConsultation.gender}, {activeConsultation.age}y</span></div>
                              <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between">
                                 <span className="text-slate-500">Service:</span> <span className="font-bold text-teal-700">{activeConsultation.serviceType}</span>
                              </div>
                           </div>
                       </div>
                       
                       {/* Clinical Notes */}
                       <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <Activity className="w-4 h-4 text-blue-500" /> रोग निदान (Diagnosis)
                           </label>
                           <textarea className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" rows={2} placeholder="Diagnosis..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}></textarea>
                       </div>
                       <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-800">क्लिनिकल नोटहरू / टिप्पणी</label>
                           <textarea className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" rows={2} placeholder="Findings..." value={findings} onChange={(e) => setFindings(e.target.value)}></textarea>
                       </div>
                       
                       {/* Lab Requests */}
                       <div className="space-y-3 pt-4 border-t border-slate-200">
                           <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <FlaskConical className="w-4 h-4 text-purple-600" /> ल्याब परीक्षण अनुरोध (Lab)
                           </label>
                           <div className="relative flex gap-2">
                                <input type="text" placeholder="Search Test (e.g. CBC)" className="flex-1 p-2 border border-slate-300 rounded-lg text-sm" value={newLabTestName} onChange={(e) => { setNewLabTestName(e.target.value); setShowLabSuggestions(true); }} onFocus={() => setShowLabSuggestions(true)} />
                                <button onClick={() => handleAddLabRequest()} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200">Add</button>
                                {showLabSuggestions && newLabTestName && filteredLabTests.length > 0 && (
                                  <div className="absolute top-full left-0 w-full z-10 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                     {filteredLabTests.map(t => (
                                       <div key={t} className="px-3 py-2 text-sm hover:bg-purple-50 cursor-pointer text-slate-700" onClick={() => handleAddLabRequest(t)}>{t}</div>
                                     ))}
                                  </div>
                                )}
                           </div>
                           <div className="space-y-1">
                              {labRequestList.map((test, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg text-sm">
                                    <span className="font-medium text-slate-700">{test.testName}</span>
                                    <button onClick={() => removeLabRequest(idx)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                 </div>
                              ))}
                           </div>
                       </div>

                       {/* Additional Service Requests (X-Ray, USG, Procedures) */}
                       <div className="space-y-3 pt-4 border-t border-slate-200">
                           <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <PlusCircle className="w-4 h-4 text-indigo-600" /> थप सेवा अनुरोध (Additional Requests)
                           </label>
                           <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                 <select 
                                    className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                                    value={requestCategory}
                                    onChange={(e) => {
                                       setRequestCategory(e.target.value as AppView);
                                       setSelectedRequestItem('');
                                    }}
                                 >
                                    <option value={AppView.X_RAY}>X-Ray</option>
                                    <option value={AppView.USG}>USG</option>
                                    <option value={AppView.DRESSING_MINOR_OT}>Procedures/OT</option>
                                    <option value={AppView.IMMUNIZATION}>Vaccine</option>
                                    <option value={AppView.ECG}>ECG</option>
                                 </select>
                                 <select 
                                    className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                                    value={selectedRequestItem}
                                    onChange={(e) => setSelectedRequestItem(e.target.value)}
                                 >
                                    <option value="">सेवा छान्नुहोस्</option>
                                    {(DEPARTMENT_SERVICES[requestCategory] || []).map(s => (
                                       <option key={s.id} value={`${s.id}||${s.name}||${s.price}`}>
                                          {s.name} - रु.{s.price}
                                       </option>
                                    ))}
                                 </select>
                              </div>
                              <button 
                                 onClick={handleAddServiceRequest}
                                 disabled={!selectedRequestItem}
                                 className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold hover:bg-indigo-100 disabled:opacity-50"
                              >
                                 + अनुरोध थप्नुहोस् (Add Request)
                              </button>
                           </div>
                           
                           {/* List of Requested Services */}
                           <div className="space-y-1">
                              {serviceRequestList.map((req, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-2 rounded-lg text-sm">
                                    <div className="flex flex-col">
                                       <span className="font-medium text-slate-800">{req.name}</span>
                                       <span className="text-[10px] text-slate-500">{req.category}</span>
                                    </div>
                                    <button onClick={() => removeServiceRequest(idx)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                 </div>
                              ))}
                           </div>
                       </div>
                    </div>
                 </div>
                 
                 {/* Right Panel: Rx */}
                 <div className="w-full md:w-7/12 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <Pill className="w-5 h-5 text-teal-600" />
                       प्रेस्क्रिप्शन (औषधि सिफारिस)
                    </h4>
                    
                    {/* Prescription Builder UI */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                       <div className="space-y-4">
                          <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                                type="text"
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                placeholder="औषधि खोज्नुहोस्..."
                                value={medSearch}
                                onChange={(e) => { setMedSearch(e.target.value); setSelectedMed(null); }}
                             />
                             {medSearch && !selectedMed && filteredMeds.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto z-10">
                                   {filteredMeds.map(m => (
                                      <div key={m.id} onClick={() => { setSelectedMed(m); setMedSearch(m.name); }} className="p-2 hover:bg-teal-50 cursor-pointer text-sm flex justify-between">
                                         <span className="font-medium">{m.name}</span>
                                         <span className="text-slate-500 text-xs">{m.stock} in stock</span>
                                      </div>
                                   ))}
                                </div>
                             )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">मात्रा (Dose)</label>
                                <input type="text" placeholder="e.g. 500mg" className="w-full p-2 border border-slate-300 rounded-lg text-sm" value={dose} onChange={e => setDose(e.target.value)} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">समय (Frequency)</label>
                                <select className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white" value={freq} onChange={e => setFreq(e.target.value)}>
                                   {frequencyOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">अवधि (दिनमा)</label>
                                <div className="relative">
                                   <input type="number" min="1" className="w-full p-2 border border-slate-300 rounded-lg text-sm pr-8" value={duration} onChange={e => setDuration(e.target.value)} />
                                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">दिन</span>
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Calculator className="w-3 h-3" /> जम्मा मात्रा</label>
                                <input type="number" min="1" className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-100 font-medium text-slate-800" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                             </div>
                          </div>
                          <button disabled={!selectedMed} onClick={addMedicineToPrescription} className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                             <Plus className="w-4 h-4" /> प्रेस्क्रिप्शनमा थप्नुहोस्
                          </button>
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                             <tr>
                                <th className="px-4 py-3 font-semibold text-slate-700">औषधि</th>
                                <th className="px-4 py-3 font-semibold text-slate-700">खाने तरिका</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Qty</th>
                                <th className="px-4 py-3 font-semibold text-slate-700 text-right">मूल्य</th>
                                <th className="w-10"></th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {prescriptionList.length === 0 ? (
                                <tr>
                                   <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">कुनै औषधि थपिएको छैन।</td>
                                </tr>
                             ) : (
                                prescriptionList.map((item, idx) => (
                                   <tr key={idx}>
                                      <td className="px-4 py-3 font-medium text-slate-800">{item.medicineName}</td>
                                      <td className="px-4 py-3 text-slate-600">{item.dosage} | {item.frequency} | {item.duration}</td>
                                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                                      <td className="px-4 py-3 text-right">रु. {(item.price * item.quantity).toFixed(2)}</td>
                                      <td className="px-4 py-3 text-center">
                                         <button onClick={() => removeMedicineFromPrescription(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                      </td>
                                   </tr>
                                ))
                             )}
                          </tbody>
                       </table>
                    </div>
                    
                    <div className="mt-4 flex justify-end gap-6 text-sm">
                       <div className="text-slate-500">Service Fee: <span className="font-semibold text-slate-800">रु. {activeConsultation.cost.toFixed(2)}</span></div>
                       <div className="text-slate-500">Meds Total: <span className="font-semibold text-slate-800">रु. {prescriptionList.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span></div>
                       <div className="text-lg font-bold text-teal-700">Total: रु. {(activeConsultation.cost + prescriptionList.reduce((acc, i) => acc + (i.price * i.quantity), 0)).toFixed(2)}</div>
                    </div>
                 </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="text-xs text-slate-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    सेवा सम्पन्न गर्दा मौज्दात घट्नेछ र बिक्री रेकर्ड हुनेछ।
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setActiveConsultation(null)} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium transition-colors">रद्द गर्नुहोस्</button>
                    <button onClick={handleCompleteConsultation} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium shadow-lg shadow-teal-900/20 flex items-center gap-2 transition-all active:scale-95"><CheckCircle2 className="w-4 h-4" /> सम्पन्न र बिलिङ</button>
                 </div>
              </div>
           </div>
         </div>
       )}

       {selectedHistory && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="bg-slate-200 p-2 rounded-lg text-slate-600">
                         <FileText className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="text-lg font-bold text-slate-800">बिरामीको विस्तृत इतिहास</h3>
                         <p className="text-xs text-slate-500">{selectedHistory.patientName} ({selectedHistory.patientId})</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                       <button onClick={handlePrintReport} className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm font-medium">
                          <Printer className="w-4 h-4" /> Print Report
                       </button>
                       <button onClick={() => setSelectedHistory(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
                          <X className="w-5 h-5" />
                       </button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                   <div className="max-w-3xl mx-auto space-y-8">
                      {/* Patient Info Card */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" /> बिरामी जानकारी
                         </h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                               <div className="text-xs text-slate-500 mb-1">नाम</div>
                               <div className="font-semibold text-slate-800">{selectedHistory.patientName}</div>
                            </div>
                            <div>
                               <div className="text-xs text-slate-500 mb-1">उमेर / लिङ्ग</div>
                               <div className="font-medium text-slate-800">{selectedHistory.age} / {selectedHistory.gender}</div>
                            </div>
                            <div>
                               <div className="text-xs text-slate-500 mb-1">सम्पर्क</div>
                               <div className="font-medium text-slate-800">{selectedHistory.contactNo}</div>
                            </div>
                            <div>
                               <div className="text-xs text-slate-500 mb-1">ठेगाना</div>
                               <div className="font-medium text-slate-800">{selectedHistory.address}</div>
                            </div>
                         </div>
                      </div>

                      {/* Clinical Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">रोग निदान (Diagnosis)</h4>
                            <p className="text-slate-800 font-medium">{selectedHistory.diagnosis || 'No diagnosis recorded'}</p>
                         </div>
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">क्लिनिकल नोटहरू</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">{selectedHistory.findings || 'No notes recorded'}</p>
                         </div>
                      </div>

                      {/* Rx Table */}
                      {selectedHistory.prescription && selectedHistory.prescription.length > 0 && (
                         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">सिफारिस गरिएको औषधि (Medication)</h4>
                            </div>
                            <table className="w-full text-left text-sm">
                               <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                     <th className="px-6 py-3 font-semibold text-slate-700">औषधि</th>
                                     <th className="px-6 py-3 font-semibold text-slate-700">मात्रा/समय</th>
                                     <th className="px-6 py-3 font-semibold text-slate-700 text-right">कुल</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {selectedHistory.prescription.map((item, idx) => (
                                     <tr key={idx}>
                                        <td className="px-6 py-3 font-medium text-slate-800">{item.medicineName}</td>
                                        <td className="px-6 py-3 text-slate-600">{item.dosage} ({item.frequency}) for {item.duration}</td>
                                        <td className="px-6 py-3 text-right text-slate-800">{item.quantity}</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      )}
                      
                      {/* Lab Results Section in History */}
                      {selectedHistory.labRequests && selectedHistory.labRequests.length > 0 && (
                          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="px-6 py-4 border-b border-slate-100 bg-purple-50">
                                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                                   <FlaskConical className="w-4 h-4" /> ल्याब रिपोर्ट (Lab Reports)
                                </h4>
                             </div>
                             <div className="p-6 grid gap-4">
                                {selectedHistory.labRequests.map((test, idx) => (
                                   <div key={idx} className="flex justify-between items-start border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                                      <div>
                                         <div className="font-bold text-slate-700">{test.testName}</div>
                                         <div className="text-xs text-slate-400 mt-1">{new Date(test.requestDate).toLocaleDateString()}</div>
                                      </div>
                                      <div className="text-right">
                                         <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-1 ${test.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{test.status}</span>
                                         {test.result && <div className="text-sm font-medium text-slate-900 mt-1">{test.result}</div>}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                      )}
                      
                      {/* Other Requests History */}
                      {selectedHistory.serviceRequests && selectedHistory.serviceRequests.length > 0 && (
                          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50">
                                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">अन्य सेवा अनुरोधहरू</h4>
                             </div>
                             <div className="p-4">
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                   {selectedHistory.serviceRequests.map((req, i) => (
                                      <li key={i}>
                                         <span className="font-medium">{req.name}</span> <span className="text-slate-500">({req.category})</span> - <span className={req.status === 'BILLED' ? 'text-green-600 font-bold text-xs' : 'text-amber-600 font-bold text-xs'}>{req.status}</span>
                                      </li>
                                   ))}
                                </ul>
                             </div>
                          </div>
                      )}

                      {/* Timeline of Past Visits */}
                      <div className="pt-8 border-t border-slate-200">
                         <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400" /> अघिल्लो भ्रमणहरू (Past Visits)
                         </h4>
                         <div className="space-y-4">
                            {patientFullHistory.length === 0 ? (
                               <p className="text-sm text-slate-400 italic">यो बिरामीको कुनै अघिल्लो रेकर्ड छैन।</p>
                            ) : (
                               patientFullHistory.map(history => (
                                  <div key={history.id} className="flex gap-4 group">
                                     <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-teal-500 transition-colors"></div>
                                        <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                                     </div>
                                     <div className="pb-6">
                                        <div className="text-sm font-bold text-slate-700">{new Date(history.timestamp).toLocaleDateString()}</div>
                                        <div className="text-xs font-semibold text-teal-600 mb-1">{history.serviceType}</div>
                                        <p className="text-sm text-slate-600 line-clamp-1">{history.diagnosis || 'No diagnosis'}</p>
                                     </div>
                                  </div>
                               ))
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
         </div>
       )}

    </div>
  );
};