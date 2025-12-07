
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, AlertTriangle, PackageCheck, TrendingUp, X, 
  AlertCircle, CheckCircle, ShoppingBag, Calendar, Lock, 
  Building2, Users, Activity, Wallet, ArrowRight, Clock, Stethoscope,
  ArrowLeft, FileText, Pill, History
} from 'lucide-react';
import { Medicine, Sale, UserPermissions, ServiceRecord } from '../types';
import { dbService } from '../services/db';

interface DashboardProps {
  inventory: Medicine[];
  sales: Sale[];
  permissions: UserPermissions;
  activeOrgId?: string;
  serviceRecords: ServiceRecord[];
}

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export const Dashboard: React.FC<DashboardProps> = ({ inventory, sales, permissions, activeOrgId, serviceRecords: allServiceRecords }) => {
  const [activeModal, setActiveModal] = useState<'lowStock' | 'expired' | 'sales' | 'patients' | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<ServiceRecord | null>(null);

  const serviceRecords = useMemo(() => {
     if (activeOrgId && activeOrgId !== 'ALL') {
        return allServiceRecords.filter(r => r.organizationId === activeOrgId);
     }
     return allServiceRecords;
  }, [allServiceRecords, activeOrgId]);

  useEffect(() => {
      if (!activeModal) setSelectedPatient(null);
  }, [activeModal]);

  // --- Derived Data & Summarization ---

  const today = new Date().toLocaleDateString();

  // 1. Inventory Stats
  const lowStockItems = useMemo(() => 
    inventory.filter(m => m.stock <= m.minStockLevel), 
  [inventory]);

  const expiredItems = useMemo(() => {
    const now = new Date();
    return inventory.filter(m => new Date(m.expiryDate) < now);
  }, [inventory]);

  const totalInventoryValue = useMemo(() => 
    inventory.reduce((acc, item) => acc + (item.price * item.stock), 0),
  [inventory]);

  // 2. Sales Stats
  const salesStats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const todaySales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
    const todayRevenue = todaySales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    
    return { totalRevenue, todayRevenue, todayCount: todaySales.length };
  }, [sales, today]);

  // 3. Patient/Service Stats
  const patientStats = useMemo(() => {
     const todayPatients = serviceRecords.filter(r => new Date(r.timestamp).toLocaleDateString() === today);
     
     // Group by Department for Pie Chart
     const deptCounts: Record<string, number> = {};
     serviceRecords.forEach(r => {
        const dept = r.department || 'General';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
     });
     
     const deptData = Object.keys(deptCounts).map(key => ({
        name: key.replace(/_/g, ' '),
        value: deptCounts[key]
     }));

     return {
        todayCount: todayPatients.length,
        totalCount: serviceRecords.length,
        deptData: deptData.sort((a,b) => b.value - a.value).slice(0, 6) // Top 6 depts
     };
  }, [serviceRecords, today]);

  // 4. Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      
      const daySales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === dateStr);
      const dayRevenue = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
      const dayPatients = serviceRecords.filter(r => new Date(r.timestamp).toLocaleDateString() === dateStr).length;
      
      data.push({ 
         name: dateStr.split('/')[0] + '/' + dateStr.split('/')[1], // MM/DD
         revenue: dayRevenue, 
         sales: daySales.length,
         patients: dayPatients
      });
    }
    return data;
  }, [sales, serviceRecords]);

  // Patient History Logic
  const patientHistory = useMemo(() => {
      if (!selectedPatient) return [];
      return serviceRecords
        .filter(r => r.patientId === selectedPatient.patientId)
        .sort((a,b) => b.timestamp - a.timestamp);
  }, [selectedPatient, serviceRecords]);

  // Permission Check
  if (!permissions.viewFinancials) {
     return (
        <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
           <div className="p-4 bg-slate-100 rounded-full">
              <Lock className="w-8 h-8 text-slate-500" />
           </div>
           <h3 className="text-xl font-semibold text-slate-700">पहुँच निषेधित (Access Restricted)</h3>
           <p>तपाईंलाई ड्यासबोर्ड तथ्याङ्क हेर्ने अनुमति छैन।</p>
        </div>
     );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* 1. TOP SUMMARY CARDS (Gradient Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div onClick={() => setActiveModal('sales')} className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-200 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-24 h-24" />
           </div>
           <div className="relative z-10">
              <p className="text-teal-100 font-medium text-sm mb-1">कुल आम्दानी (Total Revenue)</p>
              <h3 className="text-3xl font-bold mb-2">रु. {salesStats.totalRevenue.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                 <TrendingUp className="w-3 h-3" />
                 <span>आज: रु. {salesStats.todayRevenue.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Inventory Value */}
        <div onClick={() => setActiveModal('lowStock')} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-24 h-24" />
           </div>
           <div className="relative z-10">
              <p className="text-blue-100 font-medium text-sm mb-1">मौज्दात रकम (Inventory Value)</p>
              <h3 className="text-3xl font-bold mb-2">रु. {totalInventoryValue.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                 <PackageCheck className="w-3 h-3" />
                 <span>जम्मा सामान: {inventory.length}</span>
              </div>
           </div>
        </div>

        {/* Patient Count */}
        <div onClick={() => setActiveModal('patients')} className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24" />
           </div>
           <div className="relative z-10">
              <p className="text-indigo-100 font-medium text-sm mb-1">बिरामी सेवा (Total Patients)</p>
              <h3 className="text-3xl font-bold mb-2">{patientStats.totalCount.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                 <Activity className="w-3 h-3" />
                 <span>आज दर्ता: {patientStats.todayCount}</span>
              </div>
           </div>
        </div>

        {/* Alert Card */}
        <div onClick={() => setActiveModal('expired')} className="bg-gradient-to-br from-amber-500 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-200 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-24 h-24" />
           </div>
           <div className="relative z-10">
              <p className="text-orange-100 font-medium text-sm mb-1">ध्यान दिनुपर्ने (Action Required)</p>
              <h3 className="text-3xl font-bold mb-2">{lowStockItems.length + expiredItems.length}</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                 <span className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">Low Stock: {lowStockItems.length}</span>
                 <span className="bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">Expired: {expiredItems.length}</span>
              </div>
           </div>
        </div>
      </div>

      {/* 2. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Revenue Trend (Area Chart) */}
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" /> आम्दानी विश्लेषण (Revenue Trend)
               </h3>
               <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Last 7 Days</span>
            </div>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                     <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                     />
                     <Legend />
                     <Area type="monotone" dataKey="revenue" name="Revenue (Rs)" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                     <Area type="monotone" dataKey="patients" name="Patients" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPat)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Department Distribution (Pie Chart) */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Stethoscope className="w-5 h-5 text-indigo-600" /> विभाग अनुसार बिरामी
            </h3>
            <div className="flex-1 min-h-[250px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={patientStats.deptData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {patientStats.deptData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
               </ResponsiveContainer>
               {patientStats.deptData.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                     डाटा उपलब्ध छैन
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* 3. BOTTOM SECTION: Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Recent Patients */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Clock className="w-5 h-5 text-blue-500" /> भर्खरका बिरामीहरू (Recent Patients)
            </h3>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <th className="py-3 px-2">Name / ID</th>
                        <th className="py-3 px-2">Service</th>
                        <th className="py-3 px-2 text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {serviceRecords.slice(0, 5).map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setActiveModal('patients'); setSelectedPatient(record); }}>
                           <td className="py-3 px-2">
                              <div className="font-medium text-slate-800 text-sm">{record.patientName}</div>
                              <div className="text-xs text-slate-400 font-mono">{record.patientId}</div>
                           </td>
                           <td className="py-3 px-2">
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                 {record.serviceType}
                              </span>
                           </td>
                           <td className="py-3 px-2 text-right">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                 record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                 {record.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                     {serviceRecords.length === 0 && (
                        <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-sm">कुनै रेकर्ड छैन</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Alerts & Notifications */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-red-500" /> सूचना तथा चेतावनी (Alerts)
            </h3>
            <div className="space-y-3">
               {lowStockItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm">
                           <PackageCheck className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">{item.name}</p>
                           <p className="text-xs text-slate-500">Stock: <span className="text-amber-600 font-bold">{item.stock}</span> (Min: {item.minStockLevel})</p>
                        </div>
                     </div>
                     <button onClick={() => setActiveModal('lowStock')} className="text-xs text-amber-700 font-medium hover:underline">View</button>
                  </div>
               ))}
               
               {expiredItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-red-600 shadow-sm">
                           <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">{item.name}</p>
                           <p className="text-xs text-slate-500">Expired: <span className="text-red-600 font-bold">{item.expiryDate}</span></p>
                        </div>
                     </div>
                     <button onClick={() => setActiveModal('expired')} className="text-xs text-red-700 font-medium hover:underline">View</button>
                  </div>
               ))}

               {lowStockItems.length === 0 && expiredItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                     <CheckCircle className="w-12 h-12 text-green-500 opacity-20 mb-2" />
                     <p className="text-slate-500">सबै ठीक छ! (All Systems Nominal)</p>
                  </div>
               )}
            </div>
         </div>

      </div>

      {/* Details Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0
              ${activeModal === 'lowStock' ? 'bg-amber-50 border-amber-100' : 
                activeModal === 'expired' ? 'bg-red-50 border-red-100' : 
                activeModal === 'patients' ? 'bg-indigo-50 border-indigo-100' :
                'bg-teal-50 border-teal-100'}`}
            >
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 {activeModal === 'lowStock' && 'न्यून मौज्दात विवरण (Low Stock)'}
                 {activeModal === 'expired' && 'म्याद सकिएका (Expired Items)'}
                 {activeModal === 'sales' && 'बिक्री विवरण (Sales Report)'}
                 {activeModal === 'patients' && 'बिरामी सेवा विवरण (Patient Records)'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-black/5"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-y-auto p-0 flex-1">
              {/* PATIENTS MODE: LIST OR DETAIL */}
              {activeModal === 'patients' ? (
                  selectedPatient ? (
                      // DETAIL VIEW
                      <div className="flex flex-col h-full bg-slate-50">
                          <div className="flex items-center gap-4 p-4 border-b bg-white sticky top-0 z-10">
                              <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors">
                                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                              </button>
                              <div>
                                  <h3 className="font-bold text-xl text-slate-800">{selectedPatient.patientName}</h3>
                                  <p className="text-sm text-slate-500 font-mono">
                                      {selectedPatient.patientId} • {selectedPatient.age}Y / {selectedPatient.gender} • {selectedPatient.contactNo}
                                  </p>
                              </div>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-6 space-y-6">
                             <div className="flex items-center gap-2 mb-2">
                                <History className="w-5 h-5 text-indigo-600" />
                                <h4 className="font-bold text-slate-700">सेवा इतिहास (Service History)</h4>
                             </div>
                             
                             {patientHistory.length === 0 && (
                                <div className="text-center py-10 text-slate-400">No history found.</div>
                             )}

                             {patientHistory.map((record, index) => (
                                 <div key={record.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                     <div className="flex justify-between items-start mb-4">
                                         <div>
                                             <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{record.serviceType}</div>
                                             <div className="text-sm text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(record.timestamp).toLocaleDateString()} 
                                                <span className="mx-1">•</span>
                                                <Clock className="w-3 h-3" /> {new Date(record.timestamp).toLocaleTimeString()}
                                             </div>
                                         </div>
                                         <span className={`px-2 py-1 rounded text-xs font-bold ${record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                             {record.status}
                                         </span>
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         {/* Clinical Info */}
                                         <div className="space-y-3">
                                             {record.diagnosis && (
                                                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                     <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Diagnosis</span>
                                                     <p className="text-sm font-medium text-slate-800">{record.diagnosis}</p>
                                                 </div>
                                             )}
                                             {record.findings && (
                                                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                     <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Clinical Findings</span>
                                                     <p className="text-sm text-slate-700">{record.findings}</p>
                                                 </div>
                                             )}
                                         </div>

                                         {/* Treatments */}
                                         <div className="space-y-3">
                                             {record.prescription && record.prescription.length > 0 && (
                                                 <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                                                     <span className="text-xs font-bold text-teal-700 uppercase block mb-2 flex items-center gap-1">
                                                        <Pill className="w-3 h-3" /> Prescription
                                                     </span>
                                                     <ul className="space-y-1">
                                                         {record.prescription.map((rx, i) => (
                                                             <li key={i} className="text-xs text-slate-700 border-b border-teal-100 last:border-0 pb-1 last:pb-0">
                                                                 <span className="font-bold">{rx.medicineName}</span> - {rx.dosage} ({rx.frequency}) x {rx.duration}
                                                             </li>
                                                         ))}
                                                     </ul>
                                                 </div>
                                             )}
                                             
                                             {/* Lab Results */}
                                             {record.labRequests && record.labRequests.some(l => l.result) && (
                                                 <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                     <span className="text-xs font-bold text-purple-700 uppercase block mb-2 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> Lab Results
                                                     </span>
                                                     <ul className="space-y-1">
                                                         {record.labRequests.filter(l => l.result).map((lab, i) => (
                                                             <li key={i} className="text-xs text-slate-700 border-b border-purple-100 last:border-0 pb-1 last:pb-0">
                                                                 <span className="font-bold">{lab.testName}:</span> {lab.result}
                                                             </li>
                                                         ))}
                                                     </ul>
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                          </div>
                      </div>
                  ) : (
                      // LIST VIEW
                      <table className="w-full text-left">
                        <thead className="bg-indigo-50 sticky top-0 shadow-sm text-indigo-900">
                          <tr>
                            <th className="px-6 py-3 text-sm font-bold">Date</th>
                            <th className="px-6 py-3 text-sm font-bold">Patient ID</th>
                            <th className="px-6 py-3 text-sm font-bold">Name</th>
                            <th className="px-6 py-3 text-sm font-bold">Service</th>
                            <th className="px-6 py-3 text-sm font-bold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {serviceRecords.sort((a,b) => b.timestamp - a.timestamp).map(record => (
                            <tr 
                               key={record.id} 
                               className="hover:bg-indigo-50 cursor-pointer transition-colors"
                               onClick={() => setSelectedPatient(record)}
                            >
                              <td className="px-6 py-3 text-sm text-slate-500 whitespace-nowrap">{new Date(record.timestamp).toLocaleDateString()}</td>
                              <td className="px-6 py-3 text-sm font-mono text-slate-500">{record.patientId}</td>
                              <td className="px-6 py-3 text-sm font-medium text-slate-800">
                                  {record.patientName} <span className="text-xs text-slate-400 ml-1">({record.age}/{record.gender})</span>
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-600">
                                  {record.serviceType}
                              </td>
                              <td className="px-6 py-3 text-sm text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {record.status}
                                  </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  )
              ) : (
                  // OTHER MODALS (Sales, Low Stock)
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 sticky top-0 shadow-sm">
                      <tr>
                        {activeModal === 'sales' ? (
                          <>
                            <th className="px-6 py-3 text-sm text-slate-500">Date</th>
                            <th className="px-6 py-3 text-sm text-slate-500">Customer</th>
                            <th className="px-6 py-3 text-sm text-slate-500 text-right">Amount</th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-3 text-sm text-slate-500">Item</th>
                            <th className="px-6 py-3 text-sm text-slate-500 text-right">Stock</th>
                            {activeModal === 'expired' && <th className="px-6 py-3 text-sm text-slate-500 text-right">Expiry</th>}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeModal === 'sales' ? (
                        sales.slice(0, 50).map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 text-sm text-slate-600">{new Date(sale.timestamp).toLocaleDateString()}</td>
                            <td className="px-6 py-3 text-sm font-medium">{sale.customerName}</td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-teal-600">Rs. {sale.totalAmount.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        (activeModal === 'lowStock' ? lowStockItems : expiredItems).map(item => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 text-sm font-medium">{item.name}</td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-slate-600">{item.stock}</td>
                            {activeModal === 'expired' && <td className="px-6 py-3 text-sm text-right text-red-500">{item.expiryDate}</td>}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
