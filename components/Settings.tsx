import React, { useState, useEffect } from 'react';
import { 
  Save, Shield, Database, LayoutTemplate, Download, CheckCircle, AlertCircle, 
  KeyRound, Users, UserCog, Edit2, X, CheckSquare, Square, Building2, UserPlus, 
  Trash2, CircleDollarSign, Search, Package, Stethoscope, PlusCircle, FlaskConical, 
  ListPlus, MinusCircle, Lock, ShieldCheck, Settings as SettingsIcon, FileBarChart, 
  Code, Copy, ClipboardList 
} from 'lucide-react';
import { Medicine, Sale, User, UserPermissions, UserRole, ServiceCatalogItem } from '../types';
import { dbService } from '../services/db';

interface SettingsProps {
  inventory: Medicine[];
  sales: Sale[];
  currentUser: string;
  permissions: UserPermissions;
}

const PermissionToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
  <div onClick={onChange} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors select-none border border-transparent hover:border-slate-100">
    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-teal-600 border-teal-600' : 'border-slate-300 bg-white'}`}>
      {checked ? <CheckSquare className="w-3.5 h-3.5 text-white" /> : null}
    </div>
    <span className={`text-xs font-medium ${checked ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
  </div>
);

export const Settings: React.FC<SettingsProps> = ({ inventory, sales, currentUser, permissions }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'USERS' | 'RATES' | 'DATA'>('GENERAL');
  
  // General Settings State
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Smart Health',
    address: 'Kathmandu, Nepal',
    phone: '',
    email: '',
    currency: 'Rs.'
  });

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [password, setPassword] = useState('');
  
  // Rate Management State
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadSettings();
    if (permissions.settings_Users) loadUsers();
    if (permissions.settings_Rates) loadServices();
  }, [permissions]);

  const loadSettings = () => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      setStoreSettings(JSON.parse(saved));
    }
  };

  const loadUsers = async () => {
    try {
      const fetchedUsers = await dbService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const loadServices = async () => {
    try {
      const fetchedServices = await dbService.getAllServices();
      setServices(fetchedServices);
    } catch (error) {
      console.error("Failed to load services", error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- GENERAL SETTINGS HANDLERS ---
  const handleSaveGeneral = () => {
    localStorage.setItem('appSettings', JSON.stringify(storeSettings));
    showNotification('Settings saved successfully', 'success');
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser({ ...user });
      setPassword(user.password || ''); // Ideally shouldn't expose password, but for simplicity
    } else {
      setEditingUser({
        username: '',
        role: UserRole.USER,
        organizationId: 'MAIN',
        permissions: {
           // Default Permissions
           inventoryView: true, inventoryAdd: false, inventoryEdit: false, inventoryDelete: false,
           posAccess: true, clinicAccess: false, patientRegister: false, doctorConsultation: false, viewPatientHistory: false,
           accessGeneralTreatment: false, accessPathology: false, accessXRay: false, accessUSG: false, accessECG: false,
           accessDressing: false, accessMCH: false, accessImmunization: false, accessTB: false, accessNutrition: false,
           accessCBIMNCI: false, accessCommunicable: false, accessRabies: false, accessNonCommunicable: false,
           accessJinshi: false,
           viewFinancials: false, viewReports: false, manageSettings: false, manageUsers: false,
           settings_General: false, settings_Rates: false, settings_Users: false, settings_Data: false
        }
      });
      setPassword('');
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser || !editingUser.username) return;
    
    try {
      if (users.find(u => u.username === editingUser.username) && !users.find(u => u.username === editingUser.username && u.created === editingUser.created)) {
         // Creating new user but username exists
         showNotification('Username already exists', 'error');
         return;
      }

      if (editingUser.created) {
         // Update existing
         await dbService.updateUserPermissions(editingUser.username, editingUser.permissions);
         if (password) await dbService.updateUserPassword(editingUser.username, password, password); // simplified update
         showNotification('User updated successfully', 'success');
      } else {
         // Create new
         await dbService.createUser(
            editingUser.username, 
            password, 
            editingUser.role || UserRole.USER, 
            editingUser.organizationId || 'MAIN',
            editingUser.fullName,
            editingUser.designation,
            editingUser.phoneNumber
         );
         // Manually update permissions if createUser defaults are different
         if (editingUser.permissions) {
             await dbService.updateUserPermissions(editingUser.username, editingUser.permissions);
         }
         showNotification('User created successfully', 'success');
      }
      setIsUserModalOpen(false);
      loadUsers();
    } catch (error) {
      showNotification('Operation failed', 'error');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      try {
        await dbService.deleteUser(username);
        loadUsers();
        showNotification('User deleted', 'success');
      } catch (e) {
        showNotification('Failed to delete user', 'error');
      }
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
     if (!editingUser || !editingUser.permissions) return;
     setEditingUser({
        ...editingUser,
        permissions: {
           ...editingUser.permissions,
           [key]: !editingUser.permissions[key]
        }
     });
  };

  // --- RATE MANAGEMENT HANDLERS ---
  const handleUpdateServicePrice = async (item: ServiceCatalogItem, newPrice: number) => {
     try {
        const updated = { ...item, price: newPrice };
        await dbService.updateServiceCatalogItem(updated);
        setServices(prev => prev.map(s => s.id === item.id ? updated : s));
        showNotification('Price updated', 'success');
     } catch (e) {
        showNotification('Failed to update price', 'error');
     }
  };

  // --- DATA MANAGEMENT ---
  const handleExportData = () => {
    const data = {
      inventory,
      sales,
      users: users.map(u => ({ ...u, password: '***' })), // strip passwords
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_health_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotification('Data exported successfully', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
       {/* Notification Toast */}
       {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-3
             ${notification.type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'}`}>
             {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
             <span className="font-medium">{notification.message}</span>
          </div>
       )}

       <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                   <SettingsIcon className="w-5 h-5 text-slate-500" /> सेटिङ्स
                </h2>
                
                <nav className="space-y-1">
                   {permissions.settings_General && (
                      <button 
                         onClick={() => setActiveTab('GENERAL')}
                         className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3
                         ${activeTab === 'GENERAL' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                         <Building2 className="w-4 h-4" /> साधारण जानकारी
                      </button>
                   )}
                   {permissions.settings_Users && (
                      <button 
                         onClick={() => setActiveTab('USERS')}
                         className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3
                         ${activeTab === 'USERS' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                         <Users className="w-4 h-4" /> प्रयोगकर्ता व्यवस्थापन
                      </button>
                   )}
                   {permissions.settings_Rates && (
                      <button 
                         onClick={() => setActiveTab('RATES')}
                         className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3
                         ${activeTab === 'RATES' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                         <CircleDollarSign className="w-4 h-4" /> सेवा तथा दरहरू
                      </button>
                   )}
                   {permissions.settings_Data && (
                      <button 
                         onClick={() => setActiveTab('DATA')}
                         className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3
                         ${activeTab === 'DATA' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                         <Database className="w-4 h-4" /> डाटा ब्याकअप
                      </button>
                   )}
                </nav>
             </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
             
             {/* GENERAL SETTINGS */}
             {activeTab === 'GENERAL' && permissions.settings_General && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in">
                   <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-teal-600" /> संस्थाको विवरण (Organization Profile)
                   </h3>
                   <div className="space-y-4 max-w-lg">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">संस्थाको नाम (Store Name)</label>
                         <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            value={storeSettings.storeName} onChange={e => setStoreSettings({...storeSettings, storeName: e.target.value})} />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">ठेगाना (Address)</label>
                         <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            value={storeSettings.address} onChange={e => setStoreSettings({...storeSettings, address: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">फोन (Phone)</label>
                            <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                               value={storeSettings.phone} onChange={e => setStoreSettings({...storeSettings, phone: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">मुद्रा (Currency)</label>
                            <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                               value={storeSettings.currency} onChange={e => setStoreSettings({...storeSettings, currency: e.target.value})} />
                         </div>
                      </div>
                      <button onClick={handleSaveGeneral} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2">
                         <Save className="w-4 h-4" /> Save Changes
                      </button>
                   </div>
                </div>
             )}

             {/* USERS SETTINGS */}
             {activeTab === 'USERS' && permissions.settings_Users && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                         <Users className="w-6 h-6 text-blue-600" /> प्रयोगकर्ताहरू (Users)
                      </h3>
                      <button onClick={() => handleOpenUserModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
                         <UserPlus className="w-4 h-4" /> नयाँ थप्नुहोस्
                      </button>
                   </div>

                   <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                               <th className="px-6 py-3">Username</th>
                               <th className="px-6 py-3">Full Name</th>
                               <th className="px-6 py-3">Role</th>
                               <th className="px-6 py-3">Organization</th>
                               <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                               <tr key={u.username} className="hover:bg-slate-50">
                                  <td className="px-6 py-3 font-medium text-slate-800">{u.username}</td>
                                  <td className="px-6 py-3 text-slate-600">{u.fullName || '-'}</td>
                                  <td className="px-6 py-3">
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' : u.role === UserRole.SUB_ADMIN ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {u.role}
                                     </span>
                                  </td>
                                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{u.organizationId || 'MAIN'}</td>
                                  <td className="px-6 py-3 text-right flex justify-end gap-2">
                                     <button onClick={() => handleOpenUserModal(u)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                                     {u.username !== 'admin' && (
                                        <button onClick={() => handleDeleteUser(u.username)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                     )}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             )}

             {/* RATES SETTINGS */}
             {activeTab === 'RATES' && permissions.settings_Rates && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                         <CircleDollarSign className="w-6 h-6 text-green-600" /> सेवा शुल्क (Service Rates)
                      </h3>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                            type="text" 
                            placeholder="Search services..." 
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                         />
                      </div>
                   </div>

                   <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                            <tr>
                               <th className="px-6 py-3">Category</th>
                               <th className="px-6 py-3">Service Name</th>
                               <th className="px-6 py-3 text-right">Price (Rs.)</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).map(s => (
                               <tr key={s.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-3">
                                     <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{s.category}</span>
                                  </td>
                                  <td className="px-6 py-3 font-medium text-slate-800">{s.name}</td>
                                  <td className="px-6 py-3 text-right">
                                     <input 
                                        type="number"
                                        className="w-24 text-right p-1 border border-slate-200 rounded focus:ring-2 focus:ring-green-500 bg-transparent hover:bg-white"
                                        defaultValue={s.price}
                                        onBlur={(e) => {
                                           const val = parseFloat(e.target.value);
                                           if (!isNaN(val) && val !== s.price) {
                                              handleUpdateServicePrice(s, val);
                                           }
                                        }}
                                     />
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             )}

             {/* DATA SETTINGS */}
             {activeTab === 'DATA' && permissions.settings_Data && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in">
                   <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Database className="w-6 h-6 text-indigo-600" /> डाटा व्यवस्थापन (Data Management)
                   </h3>
                   <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <h4 className="text-lg font-bold text-slate-700">Backup Data</h4>
                      <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
                         Download a full JSON backup of your inventory, sales, and user records. 
                         Keep this file safe for disaster recovery.
                      </p>
                      <button onClick={handleExportData} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 flex items-center gap-2 mx-auto">
                         <Download className="w-5 h-5" /> Download Backup
                      </button>
                   </div>
                </div>
             )}
          </div>
       </div>

       {/* EDIT USER MODAL */}
       {isUserModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <UserCog className="w-5 h-5" /> {editingUser.created ? 'Edit User' : 'New User'}
                   </h3>
                   <button onClick={() => setIsUserModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                         <input type="text" className="w-full p-2 border rounded-lg" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} disabled={!!editingUser.created} />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                         <input type="text" className="w-full p-2 border rounded-lg" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep same" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                         <input type="text" className="w-full p-2 border rounded-lg" value={editingUser.fullName || ''} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                         <select className="w-full p-2 border rounded-lg bg-white" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} disabled={editingUser.username === 'admin'}>
                            <option value={UserRole.USER}>User (Staff)</option>
                            <option value={UserRole.SUB_ADMIN}>Sub Admin (Branch Manager)</option>
                            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                         </select>
                      </div>
                      <div className="col-span-2">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Organization ID</label>
                         <input type="text" className="w-full p-2 border rounded-lg" value={editingUser.organizationId || ''} onChange={e => setEditingUser({...editingUser, organizationId: e.target.value})} placeholder="MAIN" />
                         <p className="text-[10px] text-slate-400 mt-1">Use 'MAIN' for headquarters or specific ID for branches.</p>
                      </div>
                   </div>

                   {/* Permissions Grid */}
                   <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                         <ShieldCheck className="w-4 h-4 text-teal-600" /> Access Permissions
                      </h4>
                      
                      <div className="space-y-4">
                         {/* Inventory Group */}
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <Package className="w-4 h-4" /> मौज्दात (Inventory)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                               <PermissionToggle label="View" checked={!!editingUser.permissions?.inventoryView} onChange={() => togglePermission('inventoryView')} />
                               <PermissionToggle label="Add" checked={!!editingUser.permissions?.inventoryAdd} onChange={() => togglePermission('inventoryAdd')} />
                               <PermissionToggle label="Edit" checked={!!editingUser.permissions?.inventoryEdit} onChange={() => togglePermission('inventoryEdit')} />
                               <PermissionToggle label="Delete" checked={!!editingUser.permissions?.inventoryDelete} onChange={() => togglePermission('inventoryDelete')} />
                            </div>
                         </div>

                         {/* Clinical Group */}
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <Stethoscope className="w-4 h-4" /> क्लिनिक सेवाहरू (Clinical)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 border-b border-slate-200 pb-4">
                               <PermissionToggle label="बिरामी दर्ता (Register)" checked={!!editingUser.permissions?.patientRegister} onChange={() => togglePermission('patientRegister')} />
                               <PermissionToggle label="परामर्श (Consultation)" checked={!!editingUser.permissions?.doctorConsultation} onChange={() => togglePermission('doctorConsultation')} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                               <PermissionToggle label="General OPD" checked={!!editingUser.permissions?.accessGeneralTreatment} onChange={() => togglePermission('accessGeneralTreatment')} />
                               <PermissionToggle label="Pathology (Lab)" checked={!!editingUser.permissions?.accessPathology} onChange={() => togglePermission('accessPathology')} />
                               <PermissionToggle label="X-Ray" checked={!!editingUser.permissions?.accessXRay} onChange={() => togglePermission('accessXRay')} />
                               <PermissionToggle label="USG" checked={!!editingUser.permissions?.accessUSG} onChange={() => togglePermission('accessUSG')} />
                               <PermissionToggle label="ECG" checked={!!editingUser.permissions?.accessECG} onChange={() => togglePermission('accessECG')} />
                               <PermissionToggle label="Dressing / OT" checked={!!editingUser.permissions?.accessDressing} onChange={() => togglePermission('accessDressing')} />
                               <PermissionToggle label="MCH" checked={!!editingUser.permissions?.accessMCH} onChange={() => togglePermission('accessMCH')} />
                               <PermissionToggle label="Immunization" checked={!!editingUser.permissions?.accessImmunization} onChange={() => togglePermission('accessImmunization')} />
                               <PermissionToggle label="TB / Leprosy" checked={!!editingUser.permissions?.accessTB} onChange={() => togglePermission('accessTB')} />
                               <PermissionToggle label="Nutrition" checked={!!editingUser.permissions?.accessNutrition} onChange={() => togglePermission('accessNutrition')} />
                               <PermissionToggle label="CBIMNCI" checked={!!editingUser.permissions?.accessCBIMNCI} onChange={() => togglePermission('accessCBIMNCI')} />
                               <PermissionToggle label="Communicable" checked={!!editingUser.permissions?.accessCommunicable} onChange={() => togglePermission('accessCommunicable')} />
                               <PermissionToggle label="Rabies" checked={!!editingUser.permissions?.accessRabies} onChange={() => togglePermission('accessRabies')} />
                            </div>
                         </div>

                         {/* Modules Group */}
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <LayoutTemplate className="w-4 h-4" /> अन्य मोड्युलहरू
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                               <PermissionToggle label="बिक्री (POS)" checked={!!editingUser.permissions?.posAccess} onChange={() => togglePermission('posAccess')} />
                               <PermissionToggle label="जिन्सी (Inventory)" checked={!!editingUser.permissions?.accessJinshi} onChange={() => togglePermission('accessJinshi')} />
                            </div>
                         </div>

                         {/* Admin Group */}
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <Shield className="w-4 h-4" /> प्रशासन (Admin)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                               <PermissionToggle label="Financials" checked={!!editingUser.permissions?.viewFinancials} onChange={() => togglePermission('viewFinancials')} />
                               <PermissionToggle label="Reports" checked={!!editingUser.permissions?.viewReports} onChange={() => togglePermission('viewReports')} />
                               <PermissionToggle label="Manage Users" checked={!!editingUser.permissions?.manageUsers} onChange={() => togglePermission('manageUsers')} />
                               <PermissionToggle label="Settings" checked={!!editingUser.permissions?.manageSettings} onChange={() => togglePermission('manageSettings')} />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                   <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                   <button onClick={handleSaveUser} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-lg">Save User</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
