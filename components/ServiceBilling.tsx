
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash, Receipt, CheckCircle, Lock, Import, User, FileText, Pill, Activity, X, FlaskConical, Printer, ArrowRight, ScanLine, Grid, ListFilter, History } from 'lucide-react';
import { CartItem, Sale, ServiceRecord } from '../types';
import { dbService } from '../services/db';

interface ServiceBillingProps {
  onProcessBilling: (sale: Sale) => void;
  activeOrgId?: string;
}

// Predefined Service Catalog for Manual Billing
const BILLING_CATALOG = {
   'GENERAL': [
      { name: 'OPD Ticket (New)', price: 50 },
      { name: 'OPD Ticket (Follow-up)', price: 30 },
      { name: 'Emergency Ticket', price: 100 },
      { name: 'Health Card', price: 20 },
      { name: 'Medical Certificate', price: 500 },
   ],
   'LAB': [
      { name: 'CBC (Complete Blood Count)', price: 400 },
      { name: 'Blood Grouping', price: 100 },
      { name: 'Blood Sugar (F/PP/R)', price: 100 },
      { name: 'Urine R/E', price: 150 },
      { name: 'Stool R/E', price: 150 },
      { name: 'Lipid Profile', price: 800 },
      { name: 'Liver Function Test (LFT)', price: 900 },
      { name: 'Kidney Function Test (RFT)', price: 800 },
      { name: 'Thyroid Profile (T3/T4/TSH)', price: 1200 },
      { name: 'Uric Acid', price: 250 },
      { name: 'Widal Test', price: 300 },
      { name: 'HBsAg', price: 400 },
      { name: 'HIV I/II', price: 450 },
      { name: 'HCV', price: 450 },
      { name: 'VDRL', price: 200 },
      { name: 'Mantoux Test', price: 200 },
      { name: 'Sputum AFB', price: 150 },
      { name: 'Semen Analysis', price: 400 },
      { name: 'Urine Culture', price: 800 },
      { name: 'Blood Culture', price: 1000 },
      { name: 'CRP (Quantitative)', price: 400 },
      { name: 'HbA1c', price: 700 },
      { name: 'Vitamin D', price: 2500 },
      { name: 'Vitamin B12', price: 1500 },
      { name: 'Dengue Ag/Ab', price: 1000 },
      { name: 'Scrub Typhus', price: 1000 },
   ],
   'X-RAY/USG': [
      { name: 'Chest X-Ray', price: 350 },
      { name: 'X-Ray Limbs', price: 300 },
      { name: 'X-Ray Spine', price: 450 },
      { name: 'X-Ray Skull', price: 400 },
      { name: 'X-Ray Abdomen (Erect/Supine)', price: 400 },
      { name: 'USG Abdomen', price: 600 },
      { name: 'USG Pelvis', price: 550 },
      { name: 'USG OBS (Pregnancy)', price: 600 },
      { name: 'USG Breast', price: 700 },
      { name: 'USG Thyroid/Neck', price: 700 },
      { name: 'USG Scrotum', price: 600 },
      { name: 'ECG', price: 250 },
      { name: 'Echocardiography', price: 1500 },
   ],
   'HOSPITAL': [
      { name: 'Bed Charge (General)', price: 200 },
      { name: 'Bed Charge (Cabin)', price: 1000 },
      { name: 'Oxygen Charge (Per Hour)', price: 100 },
      { name: 'Nebulization', price: 150 },
      { name: 'Dressing (Small)', price: 100 },
      { name: 'Dressing (Medium)', price: 150 },
      { name: 'Dressing (Large)', price: 250 },
      { name: 'Stitch Removal', price: 150 },
      { name: 'Catheterization', price: 300 },
      { name: 'Ambulance Service', price: 1000 },
   ]
};

export const ServiceBilling: React.FC<ServiceBillingProps> = ({ onProcessBilling, activeOrgId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Pending Orders State
  const [pendingOrders, setPendingOrders] = useState<ServiceRecord[]>([]);
  const [importedRecordId, setImportedRecordId] = useState<string | null>(null);

  // Recent Sales State
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  // Manual Search & Entry State
  const [manualSearchId, setManualSearchId] = useState('');
  
  // Search Autocomplete State
  const [allPatients, setAllPatients] = useState<ServiceRecord[]>([]);
  const [suggestions, setSuggestions] = useState<ServiceRecord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Printing State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Manual Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof BILLING_CATALOG>('GENERAL');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     loadData();
  }, [activeOrgId, success]); // Reload when org changes or after a successful bill

  // Focus search input when modal or category changes
  useEffect(() => {
     if (isManualModalOpen && searchInputRef.current) {
        searchInputRef.current.focus();
     }
  }, [isManualModalOpen, activeCategory]);

  const loadData = async () => {
     try {
        const [records, allSales] = await Promise.all([
           dbService.getAllServiceRecords(),
           dbService.getAllSales()
        ]);
        
        let orgRecords = records;
        let orgSales = allSales;

        if (activeOrgId && activeOrgId !== 'ALL') {
           orgRecords = records.filter(r => r.organizationId === activeOrgId);
           orgSales = allSales.filter(s => s.organizationId === activeOrgId);
        }

        // 1. Pending Orders (for the left list) - Clinically completed but unbilled
        const pending = orgRecords.filter(r => 
           r.status === 'COMPLETED' && (
              (r.serviceRequests && r.serviceRequests.some(req => req.status === 'PENDING')) ||
              (r.prescription && r.prescription.length > 0 && r.prescriptionStatus === 'PENDING') ||
              (r.labRequests && r.labRequests.some(lab => lab.billingStatus === 'PENDING'))
           )
        );
        setPendingOrders(pending.sort((a,b) => b.timestamp - a.timestamp));

        // 2. All Unique Patients (for Search Autocomplete)
        // Group by PatientID and keep the latest record to represent the patient
        const uniquePatientsMap = new Map<string, ServiceRecord>();
        orgRecords.forEach(r => {
           const existing = uniquePatientsMap.get(r.patientId);
           if (!existing || r.timestamp > existing.timestamp) {
              uniquePatientsMap.set(r.patientId, r);
           }
        });
        setAllPatients(Array.from(uniquePatientsMap.values()));

        // 3. Recent Sales (Top 10)
        setRecentSales(orgSales.sort((a,b) => b.timestamp - a.timestamp).slice(0, 10));

     } catch (e) {
        console.error("Failed to load billing data", e);
     }
  };

  const filteredOrders = pendingOrders.filter(order => 
    order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const importPendingRequest = (record: ServiceRecord) => {
     const newCartItems: CartItem[] = [];

     // 1. Import Service Requests (X-Ray, USG, etc.)
     if (record.serviceRequests) {
        const pendingServices = record.serviceRequests.filter(req => req.status === 'PENDING');
        pendingServices.forEach(req => {
           newCartItems.push({
               id: req.id,
               name: req.name,
               genericName: '',
               category: req.category, 
               price: req.price,
               stock: 9999, 
               minStockLevel: 0,
               batchNumber: 'SRV',
               expiryDate: 'N/A',
               quantity: 1,
               organizationId: activeOrgId
           });
        });
     }

     // 2. Import Prescriptions (Medicines)
     if (record.prescription && record.prescriptionStatus === 'PENDING') {
        record.prescription.forEach(med => {
           newCartItems.push({
               id: med.medicineId,
               name: med.medicineName,
               genericName: '',
               category: 'Prescription',
               price: med.price,
               stock: 9999,
               minStockLevel: 0,
               batchNumber: 'RX',
               expiryDate: 'N/A',
               quantity: med.quantity,
               organizationId: activeOrgId
           });
        });
     }

     // 3. Import Lab Requests
     if (record.labRequests) {
        const pendingLabs = record.labRequests.filter(req => req.billingStatus === 'PENDING');
        pendingLabs.forEach(lab => {
           newCartItems.push({
               id: lab.id,
               name: lab.testName,
               genericName: '',
               category: 'PATHOLOGY',
               price: lab.price || 0,
               stock: 9999,
               minStockLevel: 0,
               batchNumber: 'LAB',
               expiryDate: 'N/A',
               quantity: 1,
               organizationId: activeOrgId
           });
        });
     }

     // Use Cart
     if (newCartItems.length > 0) {
        setCart(newCartItems);
        setImportedRecordId(record.id);
     } else {
        setCart([]);
        setImportedRecordId(null);
     }
     
     setCustomerName(record.patientName + ` (${record.patientId})`);
     setManualSearchId('');
     setShowSuggestions(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     setManualSearchId(val);

     if (val.trim().length > 0) {
        const lower = val.toLowerCase();
        const matches = allPatients.filter(p => 
           p.patientName.toLowerCase().includes(lower) || 
           p.patientId.toLowerCase().includes(lower)
        ).sort((a, b) => a.patientName.localeCompare(b.patientName));
        
        setSuggestions(matches.slice(0, 8)); // Limit to top 8
        setShowSuggestions(true);
     } else {
        setShowSuggestions(false);
     }
  };

  const selectPatientSuggestion = (record: ServiceRecord) => {
     // Check if this patient has a more recent 'pending' order in the pending list
     const pendingRecord = pendingOrders.find(p => p.patientId === record.patientId);
     
     if (pendingRecord) {
        // Use existing flow for pending items
        importPendingRequest(pendingRecord);
     } else {
        // No pending items: Open Manual Billing Modal for this patient
        setCustomerName(record.patientName + ` (${record.patientId})`);
        setManualSearchId('');
        setShowSuggestions(false);
        setCart([]); // Clear cart
        setImportedRecordId(null);
        setIsManualModalOpen(true); // OPEN MODAL
     }
  };

  const addCatalogItem = (name: string, price: number, category: string) => {
     const newItem: CartItem = {
        id: crypto.randomUUID(),
        name: name,
        genericName: '',
        category: category,
        price: price,
        stock: 9999,
        minStockLevel: 0,
        batchNumber: 'MAN',
        expiryDate: 'N/A',
        quantity: 1,
        organizationId: activeOrgId
     };
     setCart(prev => [...prev, newItem]);
     setServiceSearchTerm(''); // Clear search after adding
     if (searchInputRef.current) searchInputRef.current.focus();
  };

  const addCustomItem = () => {
    if (!manualItemName || !manualItemPrice) return;
    const price = parseFloat(manualItemPrice);
    if (isNaN(price)) return;
    addCatalogItem(manualItemName, price, 'Manual');
    setManualItemName('');
    setManualItemPrice('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > 0) return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
     setCart([]);
     setCustomerName('');
     setImportedRecordId(null);
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleProcess = async () => {
    if (cart.length === 0) return;
    if (activeOrgId === 'ALL') {
       alert("कृपया बिलिङको लागि एक विशिष्ट संस्था चयन गर्नुहोस्।");
       return;
    }

    const sale: Sale = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      items: cart,
      totalAmount,
      customerName: customerName,
      organizationId: activeOrgId
    };

    onProcessBilling(sale);

    if (importedRecordId) {
       const processedIds = cart.map(c => c.id);
       const billingMeds = cart.some(c => c.category === 'Prescription');
       
       if (processedIds.length > 0 || billingMeds) {
          await dbService.markRequestsAsBilled(importedRecordId, processedIds, billingMeds);
       }
       await loadData(); 
    }

    setSuccess(true);
    setLastSale(sale);
    setShowPrintModal(true);
    
    // Reset States
    setCart([]);
    setCustomerName('');
    setImportedRecordId(null);
    setIsManualModalOpen(false); // Close modal if open
    
    setTimeout(() => setSuccess(false), 3000);
  };

  const handlePrintReceipt = (saleToPrint?: Sale) => {
    const sale = saleToPrint || lastSale;
    if (!sale) return;

    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    const storeName = settings.storeName || 'Smart Health';
    const storeAddress = settings.address || 'Address';
    const storeCurrency = settings.currency || 'Rs.';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print receipts");
        return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${sale.id.slice(0, 8)}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; margin: 0 auto; color: #000; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h2 { margin: 0; font-size: 18px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 12px; }
          .meta { margin-bottom: 15px; font-size: 12px; }
          .meta div { display: flex; justify-content: space-between; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; }
          td { padding: 5px 0; }
          .right { text-align: right; }
          .totals { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 12px; }
          .totals div { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${storeName}</h2>
          <p>${storeAddress}</p>
          ${sale.organizationId && sale.organizationId !== 'MAIN' ? `<p>Branch: ${sale.organizationId}</p>` : ''}
        </div>
        <div class="meta">
          <div><span>Receipt No:</span> <span>#${sale.id.slice(0, 8)}</span></div>
          <div><span>Date:</span> <span>${new Date(sale.timestamp).toLocaleDateString()}</span></div>
          <div><span>Time:</span> <span>${new Date(sale.timestamp).toLocaleTimeString()}</span></div>
          <div><span>Customer:</span> <span>${sale.customerName}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              <th class="right">Rate</th>
              <th class="right">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="right">${item.quantity}</td>
                <td class="right">${item.price.toFixed(2)}</td>
                <td class="right">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div><span>Total Amount:</span> <span>${storeCurrency} ${sale.totalAmount.toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <p>Thank you for visiting!</p>
          <p>Get Well Soon.</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const isBillingDisabled = activeOrgId === 'ALL';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 pb-4">
      
      {/* TOP SEARCH BAR: Manual Patient Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2">
             <div className="bg-blue-600 p-2 rounded-lg text-white">
                <ScanLine className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-slate-800">बिलिङ ड्यासबोर्ड (Billing Dashboard)</h3>
                <p className="text-xs text-slate-500">ID वा नामबाट बिरामी खोज्नुहोस्</p>
             </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="बिरामीको ID वा नाम लेख्नुहोस्..." 
                  value={manualSearchId}
                  onChange={handleSearchChange}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                   <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto overflow-hidden z-50">
                      {suggestions.map((s) => (
                         <div 
                            key={s.id}
                            onMouseDown={() => selectPatientSuggestion(s)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                         >
                            <div className="font-bold text-slate-800 text-sm">{s.patientName}</div>
                            <div className="flex justify-between items-center mt-0.5">
                               <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{s.patientId}</span>
                               <span className="text-[10px] text-slate-400">{s.gender}, {s.age}y</span>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden min-h-0">
      
         {/* LEFT COLUMN: Patient Queue (Pending Requests) */}
         <div className="w-full lg:w-1/2 flex flex-col gap-4 min-h-0">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
                  <div>
                     <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Import className="w-6 h-6 text-teal-600" /> अनुरोध सूची (Pending Requests)
                     </h3>
                     <p className="text-sm text-slate-500">डाक्टरको परामर्शबाट आएका बिलिङ अनुरोधहरू</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input
                        type="text"
                        placeholder="पेन्डिङ सूचीमा खोज्नुहोस्..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {filteredOrders.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-12 h-12 mb-3 opacity-20" />
                        <p>कुनै पेन्डिङ अनुरोध फेला परेन।</p>
                     </div>
                  ) : (
                     filteredOrders.map(order => (
                        <div 
                           key={order.id} 
                           className={`border rounded-xl p-4 transition-all cursor-pointer group hover:shadow-md
                              ${importedRecordId === order.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                           onClick={() => importPendingRequest(order)}
                        >
                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                                    <User className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-slate-800">{order.patientName}</h4>
                                    <div className="text-xs text-slate-500 font-mono">{order.patientId}</div>
                                 </div>
                              </div>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                 {new Date(order.timestamp).toLocaleDateString()}
                              </span>
                           </div>

                           <div className="space-y-2 mt-3">
                              {/* Show Pending Services */}
                              {order.serviceRequests && order.serviceRequests.some(r => r.status === 'PENDING') && (
                                 <div className="flex flex-wrap gap-2">
                                    {order.serviceRequests.filter(r => r.status === 'PENDING').map((req, i) => (
                                       <div key={i} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                                          <Activity className="w-3 h-3" />
                                          {req.name}
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {/* Show Pending Labs */}
                              {order.labRequests && order.labRequests.some(r => r.billingStatus === 'PENDING') && (
                                 <div className="flex flex-wrap gap-2">
                                    {order.labRequests.filter(r => r.billingStatus === 'PENDING').map((lab, i) => (
                                       <div key={i} className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                                          <FlaskConical className="w-3 h-3" />
                                          {lab.testName}
                                       </div>
                                    ))}
                                 </div>
                              )}
                              
                              {/* Show Prescriptions */}
                              {order.prescription && order.prescription.length > 0 && order.prescriptionStatus === 'PENDING' && (
                                 <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded border border-teal-100">
                                       <Pill className="w-3 h-3" />
                                       {order.prescription.length} Medicines Prescribed
                                    </div>
                                 </div>
                              )}
                           </div>
                           
                           <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                              <span className="text-sm font-medium text-blue-600 group-hover:underline">
                                 बिलमा थप्नुहोस् (Add to Bill) &rarr;
                              </span>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN: Invoice / Cart */}
         <div className="w-full lg:w-1/2 flex flex-col gap-4 min-h-0">
             <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-full z-10 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-2">
                      <div className="bg-teal-600 p-2 rounded-lg text-white">
                      <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                      <h3 className="font-bold text-slate-800">बिल विवरण (Invoice)</h3>
                      <p className="text-xs text-slate-500">
                         {importedRecordId ? 'Imported from Consultation' : 'Manual / Walk-in Bill'}
                      </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      {cart.length > 0 && (
                         <button 
                         onClick={clearCart}
                         className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded border border-transparent hover:border-red-200 transition-colors flex items-center gap-1"
                         >
                            <X className="w-3 h-3" /> खाली गर्नुहोस्
                         </button>
                      )}
                      {isBillingDisabled && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                         <Lock className="w-3 h-3" /> Disabled
                      </div>
                      )}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0 flex flex-col">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                         <tr>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">विवरण (Item)</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">मात्रा</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">दर</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">जम्मा</th>
                            <th className="px-4 py-3 w-10"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {cart.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="py-20 text-center text-slate-400">
                               <Receipt className="w-16 h-16 mx-auto mb-3 opacity-10" />
                               <p>बिल खाली छ। बिरामी छान्नुहोस् वा तल म्यानुअल थप्नुहोस्।</p>
                            </td>
                         </tr>
                         ) : (
                         cart.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                               <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800">{item.name}</div>
                                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                                     {item.category === 'Prescription' ? 'Medicine' : item.category}
                                  </div>
                               </td>
                               <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                     <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Minus className="w-3 h-3" /></button>
                                     <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                                     <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Plus className="w-3 h-3" /></button>
                                  </div>
                               </td>
                               <td className="px-4 py-3 text-right text-sm text-slate-600">
                                  {item.price.toFixed(2)}
                               </td>
                               <td className="px-4 py-3 text-right font-medium text-slate-800">
                                  {(item.price * item.quantity).toFixed(2)}
                               </td>
                               <td className="px-4 py-3 text-center">
                                  <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                     <Trash className="w-4 h-4" />
                                  </button>
                               </td>
                            </tr>
                         ))
                         )}
                      </tbody>
                   </table>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-2xl space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">बिरामीको नाम</label>
                      <input 
                      type="text" 
                      className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                      value={customerName}
                      readOnly={!!importedRecordId} // Read only if imported
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isBillingDisabled}
                      placeholder="म्यानुअल बिलको लागि नाम लेख्नुहोस्"
                      />
                   </div>
                   
                   <div className="flex justify-between items-center text-slate-600 pt-2">
                      <span>उप-योग (Subtotal)</span>
                      <span>रु. {totalAmount.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-2xl font-bold text-slate-800 border-t border-slate-200 pt-3 mt-2">
                      <span>जम्मा (Total)</span>
                      <span>रु. {totalAmount.toFixed(2)}</span>
                   </div>

                   <button 
                      disabled={cart.length === 0 || isBillingDisabled}
                      onClick={handleProcess}
                      className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 text-lg mt-4
                      ${cart.length > 0 && !isBillingDisabled ? 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-900/20 active:scale-[0.98]' : 'bg-slate-300 cursor-not-allowed'}`}
                   >
                      {success ? (
                         <>
                            <CheckCircle className="w-6 h-6 animate-bounce" /> भुक्तानी सफल (Paid)
                         </>
                      ) : (
                         <>
                            <Receipt className="w-5 h-5" /> बिल जारी गर्नुहोस् (Process Bill)
                         </>
                      )}
                   </button>
                </div>
             </div>
         </div>

      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <History className="w-4 h-4 text-slate-500" /> भर्खरका कारोबारहरू (Recent Bills)
              </h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                          <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase">Date</th>
                          <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase">Receipt No</th>
                          <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase">Customer</th>
                          <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase text-right">Amount</th>
                          <th className="px-6 py-3 w-16 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {recentSales.length === 0 ? (
                          <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-slate-400 italic">कुनै कारोबार भेटिएन।</td>
                          </tr>
                      ) : (
                          recentSales.map(sale => (
                              <tr key={sale.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                                      {new Date(sale.timestamp).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </td>
                                  <td className="px-6 py-3 font-mono text-slate-600 text-xs">
                                      #{sale.id.slice(0, 8)}
                                  </td>
                                  <td className="px-6 py-3 font-medium text-slate-800">
                                      {sale.customerName}
                                  </td>
                                  <td className="px-6 py-3 text-right font-bold text-teal-600">
                                      {sale.totalAmount.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                      <button 
                                          onClick={() => handlePrintReceipt(sale)}
                                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                          title="Re-print Receipt"
                                      >
                                          <Printer className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>
      
      {/* MANUAL BILLING MODAL (Service Picker - UPDATED WITH SEARCHABLE LIST) */}
      {isManualModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
               {/* Modal Header */}
               <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <ScanLine className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-slate-800">नयाँ बिलिङ (New Bill)</h3>
                        <p className="text-sm text-slate-500">{customerName}</p>
                     </div>
                  </div>
                  <button onClick={() => { setIsManualModalOpen(false); setCart([]); setServiceSearchTerm(''); }} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="flex flex-1 overflow-hidden">
                  
                  {/* Left: Service Catalog */}
                  <div className="w-7/12 border-r border-slate-200 flex flex-col bg-slate-50">
                     {/* Tabs */}
                     <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
                        {Object.keys(BILLING_CATALOG).map(cat => (
                           <button 
                              key={cat}
                              onClick={() => { setActiveCategory(cat as any); setServiceSearchTerm(''); }}
                              className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors ${
                                 activeCategory === cat 
                                 ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' 
                                 : 'text-slate-500 hover:bg-slate-50'
                              }`}
                           >
                              {cat}
                           </button>
                        ))}
                     </div>

                     {/* Search Input for Services */}
                     <div className="p-4 bg-white border-b border-slate-100 sticky top-[49px] z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                ref={searchInputRef}
                                type="text"
                                placeholder={`Search in ${activeCategory}...`}
                                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={serviceSearchTerm}
                                onChange={(e) => setServiceSearchTerm(e.target.value)}
                            />
                            {serviceSearchTerm && (
                                <button 
                                    onClick={() => setServiceSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                     </div>
                     
                     {/* Service Items List (Searchable Listbox) */}
                     <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        <div className="space-y-1">
                           {BILLING_CATALOG[activeCategory]
                             .filter(item => item.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
                             .map((item, idx) => (
                              <button 
                                 key={idx}
                                 onClick={() => addCatalogItem(item.name, item.price, activeCategory)}
                                 className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all text-left group hover:bg-blue-50/50"
                              >
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold group-hover:bg-blue-100 group-hover:text-blue-600">
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-700 group-hover:text-blue-800 text-sm">{item.name}</div>
                                        <div className="text-[10px] text-slate-400">Code: {idx+100}</div>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <div className="font-bold text-teal-600 text-sm">Rs. {item.price}</div>
                                    <div className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold mt-0.5">ADD +</div>
                                 </div>
                              </button>
                           ))}
                           
                           {/* Empty State */}
                           {BILLING_CATALOG[activeCategory].filter(item => item.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())).length === 0 && (
                                <div className="text-center py-10 text-slate-400">
                                    <ListFilter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No services found for "{serviceSearchTerm}"</p>
                                </div>
                           )}
                        </div>
                     </div>
                     
                     {/* Manual Entry Footer */}
                     <div className="p-4 border-t border-slate-200 bg-white">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">म्यानुअल थप्नुहोस् (Custom Item)</div>
                        <div className="flex gap-2">
                            <input 
                               type="text" 
                               placeholder="सेवा / औषधिको नाम"
                               className="flex-1 p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value={manualItemName}
                               onChange={(e) => setManualItemName(e.target.value)}
                            />
                            <input 
                               type="number" 
                               placeholder="मूल्य"
                               className="w-24 p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value={manualItemPrice}
                               onChange={(e) => setManualItemPrice(e.target.value)}
                            />
                            <button 
                               onClick={addCustomItem}
                               disabled={!manualItemName || !manualItemPrice}
                               className="px-4 bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                               <Plus className="w-5 h-5" />
                            </button>
                        </div>
                     </div>
                  </div>

                  {/* Right: Modal Invoice Preview */}
                  <div className="w-5/12 flex flex-col bg-white">
                     <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                           <Receipt className="w-4 h-4" /> छनोट गरिएका सेवाहरू (Selected)
                        </h4>
                     </div>
                     <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                           <thead className="bg-white sticky top-0 border-b border-slate-100">
                              <tr>
                                 <th className="px-4 py-2 font-semibold text-slate-600">Item</th>
                                 <th className="px-4 py-2 font-semibold text-slate-600 text-right">Price</th>
                                 <th className="px-4 py-2 w-8"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {cart.length === 0 ? (
                                 <tr>
                                    <td colSpan={3} className="py-12 text-center text-slate-400 italic">
                                       No items selected
                                    </td>
                                 </tr>
                              ) : (
                                 cart.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                       <td className="px-4 py-3">
                                          <div className="font-medium text-slate-800">{item.name}</div>
                                       </td>
                                       <td className="px-4 py-3 text-right text-slate-600">
                                          {item.price.toFixed(2)}
                                       </td>
                                       <td className="px-4 py-3 text-center">
                                          <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                                             <Trash className="w-4 h-4" />
                                          </button>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                     
                     {/* Modal Footer Actions */}
                     <div className="p-6 border-t border-slate-200 bg-slate-50">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-slate-600 font-medium">Total Payable</span>
                           <span className="text-2xl font-bold text-teal-700">Rs. {totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => { setIsManualModalOpen(false); setCart([]); }} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50">
                              रद्द गर्नुहोस्
                           </button>
                           <button 
                              onClick={handleProcess}
                              disabled={cart.length === 0}
                              className="flex-[2] py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <Printer className="w-5 h-5" /> सुरक्षित र प्रिन्ट गर्नुहोस्
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* SUCCESS / PRINT MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                 <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">बिल जारी भयो!</h3>
              <p className="text-slate-500 text-sm">
                 भुक्तानी सफल भयो। के तपाईं रसिद प्रिन्ट गर्न चाहनुहुन्छ?
              </p>
              
              <div className="w-full space-y-3 pt-2">
                 <button 
                    onClick={() => handlePrintReceipt()}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                 >
                    <Printer className="w-5 h-5" /> रसिद प्रिन्ट गर्नुहोस्
                 </button>
                 <button 
                    onClick={() => setShowPrintModal(false)}
                    className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                 >
                    नयाँ बिल सुरु गर्नुहोस् <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
