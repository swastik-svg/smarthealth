
import React, { useState, useEffect } from 'react';
import { Save, Shield, Database, LayoutTemplate, Download, CheckCircle, AlertCircle, KeyRound, Users, UserCog, Edit2, X, CheckSquare, Square, Building2, UserPlus, Trash2, CircleDollarSign, Search, Package, Stethoscope, PlusCircle, FlaskConical, ListPlus, MinusCircle, Lock, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { dbService } from '../services/db';
import { Medicine, Sale, User, UserPermissions, UserRole, ServiceCatalogItem, AppView, SubTest } from '../types';

interface SettingsProps {
  inventory: Medicine[];
  sales: Sale[];
  currentUser: string;
  permissions: UserPermissions;
}

export const Settings: React.FC<SettingsProps> = ({ inventory, sales, currentUser, permissions }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'data' | 'users'>('general');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Smart Health',
    address: '123 Medical St, Health City',
    currency: '$',
    taxRate: 13,
    minStockAlert: 10
  });

  // Password State
  const [passForm, setPassForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Sub Admin Create State
  const [subAdminForm, setSubAdminForm] = useState({
     username: '',
     password: '',
     organization: '',
     fullName: '',
     designation: '',
     phoneNumber: ''
  });

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserForm, setNewUserForm] = useState({
     username: '',
     password: '',
     fullName: '',
     designation: '',
     phoneNumber: ''
  });
  
  // Rate Management State
  const [rateMode, setRateMode] = useState<'SERVICE' | 'MEDICINE'>('SERVICE');
  
  // Service Data
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceCatalogItem[]>([]);
  const [serviceCategory, setServiceCategory] = useState<string>('ALL');
  
  // Medicine Data
  const [localInventory, setLocalInventory] = useState<Medicine[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Medicine[]>([]);
  const [medCategory, setMedCategory] = useState<string>('ALL');

  // Common Rate Editing
  const [itemSearch, setItemSearch] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Nursing/Pathology Setup
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState<ServiceCatalogItem | null>(null);
  
  const [newServiceForm, setNewServiceForm] = useState({
     id: '',
     name: '',
     category: 'LAB',
     price: '',
     description: '',
     unit: '',
     range: '',
     isSystem: false
  });
  
  const [subTests, setSubTests] = useState<SubTest[]>([]);
  const [newSubTest, setNewSubTest] = useState({ name: '', unit: '', range: '' });
  const [editingSubTestIndex, setEditingSubTestIndex] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      setGeneralSettings(JSON.parse(saved));
    }
    
    // Fetch Current User Details to determine Role
    const fetchCurrentUser = async () => {
       try {
          const user = await dbService.getUser(currentUser);
          setCurrentUserData(user);
       } catch (e) {
          console.error("Failed to fetch user data");
       }
    };
    fetchCurrentUser();
    
    // Load Users if needed
    if (activeTab === 'users') {
      loadUsers();
    }
    
    // Load Rates Data (Always load for General Tab or on mount)
    loadRatesData();

  }, [activeTab, currentUser]);

  const loadUsers = async () => {
    try {
       const allUsers = await dbService.getAllUsers();
       setUsers(allUsers);
    } catch (e) {
       console.error(e);
    }
  };

  const loadRatesData = async () => {
     try {
        const [allServices, allMeds] = await Promise.all([
           dbService.getAllServices(),
           dbService.getAllMedicines()
        ]);
        setServices(allServices);
        setLocalInventory(allMeds);
     } catch (e) {
        console.error("Failed to load rates");
     }
  };

  // Filter Services & Medicines based on Search/Category
  useEffect(() => {
     if (rateMode === 'SERVICE') {
        let result = services;
        if (serviceCategory !== 'ALL') {
           result = result.filter(s => s.category === serviceCategory);
        }
        if (itemSearch) {
           result = result.filter(s => s.name.toLowerCase().includes(itemSearch.toLowerCase()));
        }
        setFilteredServices(result);
     } else {
        let result = localInventory;
        if (medCategory !== 'ALL') {
           result = result.filter(m => m.category === medCategory);
        }
        if (itemSearch) {
           result = result.filter(m => m.name.toLowerCase().includes(itemSearch.toLowerCase()) || m.genericName.toLowerCase().includes(itemSearch.toLowerCase()));
        }
        setFilteredInventory(result);
     }
  }, [services, localInventory, rateMode, serviceCategory, medCategory, itemSearch]);

  // Filter Users based on Role
  useEffect(() => {
     if (!currentUserData) return;
     
     if (currentUserData.role === UserRole.SUPER_ADMIN) {
        setFilteredUsers(users);
     } else if (currentUserData.role === UserRole.SUB_ADMIN) {
        // Show only users in same organization
        setFilteredUsers(users.filter(u => u.organizationId === currentUserData.organizationId));
     } else {
        setFilteredUsers([]);
     }
  }, [users, currentUserData]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 3000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('appSettings', JSON.stringify(generalSettings));
    showSuccess('पसल सेटिङहरू सुरक्षित गरियो।');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
      showError('नयाँ पासवर्डहरू मेल खाएनन्');
      return;
    }
    if (passForm.new.length < 4) {
      showError('पासवर्ड कम्तिमा ४ अक्षरको हुनुपर्छ');
      return;
    }

    try {
      await dbService.updateUserPassword(currentUser, passForm.current, passForm.new);
      showSuccess('पासवर्ड सफलतापूर्वक परिवर्तन भयो');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      showError(err.message || 'पासवर्ड परिवर्तन गर्न असफल');
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
        await dbService.createUser(
           subAdminForm.username, 
           subAdminForm.password, 
           UserRole.SUB_ADMIN, 
           subAdminForm.organization,
           subAdminForm.fullName,
           subAdminForm.designation,
           subAdminForm.phoneNumber
        );
        showSuccess(`Sub-Admin '${subAdminForm.username}' सिर्जना भयो - ${subAdminForm.organization}`);
        setSubAdminForm({ username: '', password: '', organization: '', fullName: '', designation: '', phoneNumber: '' });
        loadUsers();
     } catch (e) {
        showError('सब-एडमिन सिर्जना गर्न असफल। युजरनेम पहिले नै हुन सक्छ।');
     }
  };

  const handleCreateOrgUser = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!currentUserData || !currentUserData.organizationId) {
        showError("Organization error.");
        return;
     }

     try {
        await dbService.createUser(
           newUserForm.username,
           newUserForm.password,
           UserRole.USER,
           currentUserData.organizationId,
           newUserForm.fullName,
           newUserForm.designation,
           newUserForm.phoneNumber
        );
        showSuccess(`User '${newUserForm.username}' सिर्जना गरियो।`);
        setNewUserForm({ username: '', password: '', fullName: '', designation: '', phoneNumber: '' });
        loadUsers(); // Refresh list
     } catch (e) {
        showError('प्रयोगकर्ता सिर्जना गर्न असफल।');
     }
  };

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`के तपाईं प्रयोगकर्ता '${username}' हटाउन निश्चित हुनुहुन्छ?`)) return;

    try {
      await dbService.deleteUser(username);
      showSuccess(`प्रयोगकर्ता '${username}' हटाइयो।`);
      loadUsers();
    } catch (e) {
      showError("हटाउन असफल।");
    }
  };

  const handleExportData = async () => {
    try {
      showSuccess('डाटा संकलन गर्दै... (Collecting Data...)');
      
      const [allInventory, allSales, allUsers, allServiceRecords] = await Promise.all([
        dbService.getAllMedicines(),
        dbService.getAllSales(),
        dbService.getAllUsers(),
        dbService.getAllServiceRecords()
      ]);

      const data = {
        meta: {
           version: '1.0',
           exportDate: new Date().toISOString(),
           exportedBy: currentUser,
           storeName: generalSettings.storeName
        },
        inventory: allInventory,
        sales: allSales,
        users: allUsers,
        serviceRecords: allServiceRecords
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartHealth_FullBackup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('पूर्ण डाटा निर्यात सफल भयो (Full System Backup Exported)');
    } catch (e) {
      showError('ब्याकअप असफल भयो (Backup Failed)');
      console.error(e);
    }
  };

  const handleSavePermissions = async () => {
     if (!editingUser) return;

     try {
        await dbService.updateUserPermissions(editingUser.username, editingUser.permissions);
        setUsers(prev => prev.map(u => u.username === editingUser.username ? editingUser : u));
        setEditingUser(null);
        showSuccess(`${editingUser.username} को अनुमतिहरू अद्यावधिक गरियो`);
     } catch (e) {
        showError("अनुमति परिवर्तन गर्न असफल।");
     }
  };

  const togglePermission = (key: keyof UserPermissions) => {
     if (!editingUser) return;
     
     if (editingUser.username === 'admin' && (key === 'manageUsers' || key === 'manageSettings')) {
        return;
     }

     setEditingUser({
        ...editingUser,
        permissions: {
           ...editingUser.permissions,
           [key]: !editingUser.permissions[key]
        }
     });
  };

  const startEditingRate = (item: ServiceCatalogItem) => {
     // Populate full editing form
     setNewServiceForm({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price.toString(),
        description: item.description || '',
        unit: item.unit || '',
        range: item.range || '',
        isSystem: item.isSystem || false
     });
     setSubTests(item.subTests || []);
     setEditingServiceItem(item);
     setIsAddServiceOpen(true);
     setEditingSubTestIndex(null);
     setNewSubTest({ name: '', unit: '', range: '' });
     
     // Scroll to the form smoothly
     setTimeout(() => {
         const formElement = document.getElementById('serviceFormSection');
         if (formElement) {
             formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
             // Optional: Focus the Name input
             const nameInput = formElement.querySelector('input[name="serviceName"]') as HTMLInputElement;
             if (nameInput) nameInput.focus();
         }
     }, 100);
  };

  const handleAddService = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newServiceForm.name || !newServiceForm.price) {
        showError("कृपया नाम र मूल्य भर्नुहोस्।");
        return;
     }

     const newItem: ServiceCatalogItem = {
        id: editingServiceItem ? editingServiceItem.id : crypto.randomUUID(),
        name: newServiceForm.name,
        category: newServiceForm.category,
        price: parseFloat(newServiceForm.price),
        description: newServiceForm.description,
        unit: newServiceForm.unit,
        range: newServiceForm.range,
        subTests: subTests.length > 0 ? subTests : undefined,
        isSystem: newServiceForm.isSystem
     };

     try {
        if (editingServiceItem) {
           await dbService.updateServiceCatalogItem(newItem);
           setServices(prev => prev.map(s => s.id === newItem.id ? newItem : s));
           showSuccess("सेवा अपडेट गरियो।");
        } else {
           await dbService.addServiceCatalogItem(newItem);
           setServices([...services, newItem]);
           showSuccess("नयाँ सेवा/टेस्ट सफलतापूर्वक थपियो।");
        }
        
        resetServiceForm();
        setRateMode('SERVICE');
        setServiceCategory(newItem.category);
        setItemSearch(newItem.name);
     } catch (err) {
        showError("सेवा सेभ गर्न असफल।");
     }
  };

  const resetServiceForm = () => {
     setNewServiceForm({ id: '', name: '', category: 'LAB', price: '', description: '', unit: '', range: '', isSystem: false });
     setSubTests([]);
     setEditingServiceItem(null);
     setIsAddServiceOpen(false);
     setEditingSubTestIndex(null);
     setNewSubTest({ name: '', unit: '', range: '' });
  };

  const addSubTestItem = () => {
     if (!newSubTest.name) return;

     if (editingSubTestIndex !== null) {
        // Update existing subtest
        const updatedSubTests = [...subTests];
        updatedSubTests[editingSubTestIndex] = { ...updatedSubTests[editingSubTestIndex], ...newSubTest };
        setSubTests(updatedSubTests);
        setEditingSubTestIndex(null);
     } else {
        // Add new subtest
        setSubTests([...subTests, { id: crypto.randomUUID(), ...newSubTest }]);
     }
     
     setNewSubTest({ name: '', unit: '', range: '' });
     
     // Keep focus on name input for rapid entry
     const nameInput = document.getElementById('subTestNameInput');
     if (nameInput) nameInput.focus();
  };

  const startEditingSubTest = (index: number) => {
    const test = subTests[index];
    setNewSubTest({ name: test.name, unit: test.unit || '', range: test.range || '' });
    setEditingSubTestIndex(index);
    const nameInput = document.getElementById('subTestNameInput');
    if (nameInput) nameInput.focus();
  };
  
  const handleSubTestKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter') {
         e.preventDefault();
         addSubTestItem();
     }
  };

  const removeSubTestItem = (idx: number) => {
     const n = [...subTests];
     n.splice(idx, 1);
     setSubTests(n);
     if (editingSubTestIndex === idx) {
        setEditingSubTestIndex(null);
        setNewSubTest({ name: '', unit: '', range: '' });
     }
  };

  // Determine which tabs to show based on permissions
  const showGeneral = permissions.settings_General || permissions.settings_Rates;
  const showSecurity = true; // Everyone can change password
  const showUsers = permissions.settings_Users && currentUserData && (currentUserData.role === UserRole.SUPER_ADMIN || currentUserData.role === UserRole.SUB_ADMIN);
  const showData = permissions.settings_Data;

  // Auto-redirect if current tab is forbidden
  useEffect(() => {
     if (activeTab === 'general' && !showGeneral) setActiveTab('security');
     if (activeTab === 'users' && !showUsers) setActiveTab('security');
     if (activeTab === 'data' && !showData) setActiveTab('security');
  }, [activeTab, showGeneral, showUsers, showData]);


  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* Header Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 sticky top-4 z-50 shadow-sm">
          <CheckCircle className="w-5 h-5" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 sticky top-4 z-50 shadow-sm">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          {showGeneral && (
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === 'general' ? 'bg-white shadow-md text-teal-600 border border-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <LayoutTemplate className="w-5 h-5" /> सामान्य (General)
            </button>
          )}

          {showSecurity && (
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === 'security' ? 'bg-white shadow-md text-teal-600 border border-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <Shield className="w-5 h-5" /> सुरक्षा (Security)
            </button>
          )}
          
          {showUsers && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === 'users' ? 'bg-white shadow-md text-teal-600 border border-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <Users className="w-5 h-5" /> प्रयोगकर्ता पहुँच (Users)
            </button>
          )}

          {showData && (
            <button 
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === 'data' ? 'bg-white shadow-md text-teal-600 border border-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <Database className="w-5 h-5" /> डाटा ब्याकअप (Backup)
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* General Tab */}
          {activeTab === 'general' && showGeneral && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300 divide-y divide-slate-100">
              
              {/* Store Profile Section */}
              {permissions.settings_General && (
                <div className="pb-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5 text-teal-600" /> पसल प्रोफाइल (Store Profile)
                  </h3>
                  <form onSubmit={handleSaveGeneral} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">पसलको नाम</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                          value={generalSettings.storeName}
                          onChange={(e) => setGeneralSettings({...generalSettings, storeName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">मुद्रा प्रतीक (Currency Symbol)</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                          value={generalSettings.currency}
                          onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">पसल ठेगाना</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={generalSettings.address}
                        onChange={(e) => setGeneralSettings({...generalSettings, address: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">कर दर (Tax Rate %)</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                          value={generalSettings.taxRate}
                          onChange={(e) => setGeneralSettings({...generalSettings, taxRate: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">न्यून मौज्दात सङ्केत (Low Stock Alert)</label>
                        <input 
                          type="number" 
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                          value={generalSettings.minStockAlert}
                          onChange={(e) => setGeneralSettings({...generalSettings, minStockAlert: Number(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 hover:bg-slate-800">
                        <Save className="w-4 h-4" /> प्रोफाइल सुरक्षित गर्नुहोस्
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Rate Update Section */}
              {permissions.settings_Rates && (
                <div className="pt-8">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <CircleDollarSign className="w-5 h-5 text-teal-600" /> दर तथा सेवा व्यवस्थापन (Rate & Service)
                      </h3>
                      <button 
                          onClick={() => isAddServiceOpen ? resetServiceForm() : setIsAddServiceOpen(true)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isAddServiceOpen ? 'bg-slate-100 text-slate-700' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
                      >
                          {isAddServiceOpen ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                          {isAddServiceOpen ? 'रद्द गर्नुहोस्' : 'नयाँ सेवा थप्नुहोस् (Add Service)'}
                      </button>
                  </div>

                  {/* Nursing/Lab Setup Form */}
                  {isAddServiceOpen && (
                      <div id="serviceFormSection" className="bg-teal-50 border border-teal-100 rounded-xl p-5 mb-6 animate-in slide-in-from-top-4 shadow-sm">
                          <h4 className="text-sm font-bold text-teal-800 uppercase mb-4 flex items-center gap-2 border-b border-teal-200 pb-2">
                            <Stethoscope className="w-4 h-4" /> {editingServiceItem ? 'सेवा सम्पादन (Edit Service Details)' : 'नयाँ सेवा थप्नुहोस् (Add New)'}
                          </h4>
                          <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-teal-700">सेवाको नाम (Service Name)</label>
                                <input 
                                  name="serviceName"
                                  type="text" 
                                  required 
                                  className="w-full p-2 text-sm border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                  placeholder="e.g. CBC or Blood Sugar"
                                  value={newServiceForm.name}
                                  onChange={e => setNewServiceForm({...newServiceForm, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-teal-700">वर्ग (Category)</label>
                                <select 
                                  className="w-full p-2 text-sm border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                                  value={newServiceForm.category}
                                  onChange={e => setNewServiceForm({...newServiceForm, category: e.target.value})}
                                >
                                  <option value="GENERAL_TREATMENT">OPD / General</option>
                                  <option value="LAB">Lab / Pathology</option>
                                  <option value="X_RAY">X-Ray</option>
                                  <option value="USG">USG (Video X-Ray)</option>
                                  <option value="ECG">ECG</option>
                                  <option value="HOSPITAL">Hospital Charge</option>
                                  <option value={AppView.DRESSING_MINOR_OT}>Dressing / Minor OT</option>
                                  <option value={AppView.IMMUNIZATION}>Vaccine</option>
                                  <option value={AppView.COMMUNICABLE}>Communicable Disease</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-teal-700">मूल्य (Rate)</label>
                                <input 
                                  type="number" 
                                  required 
                                  className="w-full p-2 text-sm border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                  placeholder="e.g. 500"
                                  value={newServiceForm.price}
                                  onChange={e => setNewServiceForm({...newServiceForm, price: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-teal-700">विवरण (Description)</label>
                                <input 
                                  type="text" 
                                  className="w-full p-2 text-sm border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                  placeholder="Optional details..."
                                  value={newServiceForm.description}
                                  onChange={e => setNewServiceForm({...newServiceForm, description: e.target.value})}
                                />
                            </div>

                            {/* Lab Specific Configuration */}
                            {newServiceForm.category === 'LAB' && (
                                <div className="md:col-span-2 bg-white p-4 rounded-xl border border-teal-100 mt-2">
                                  <h5 className="text-xs font-bold text-teal-600 uppercase mb-3 flex items-center gap-2">
                                      <FlaskConical className="w-4 h-4" /> ल्याब कन्फिगरेसन (Pathology Setup)
                                  </h5>
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">एकाइ (Unit) - <span className="text-[10px] text-slate-400">Optional</span></label>
                                        <input type="text" className="w-full p-2 text-xs border border-slate-200 rounded" placeholder="e.g. mg/dL" value={newServiceForm.unit} onChange={e => setNewServiceForm({...newServiceForm, unit: e.target.value})} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">सामान्य दायरा (Normal Range)</label>
                                        <input type="text" className="w-full p-2 text-xs border border-slate-200 rounded" placeholder="e.g. 70-110" value={newServiceForm.range} onChange={e => setNewServiceForm({...newServiceForm, range: e.target.value})} />
                                      </div>
                                  </div>
                                  
                                  <div className="border-t border-slate-100 pt-3">
                                      <label className="text-xs font-bold text-slate-700 block mb-2 flex justify-between">
                                          <span>Sub-Tests / Profile (For Groups like LFT)</span>
                                          <span className="text-[10px] font-normal text-slate-400">Click item to edit, Press Enter to add/update</span>
                                      </label>
                                      
                                      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                                        {subTests.length === 0 && <p className="text-xs text-slate-400 italic p-2 border border-dashed border-slate-200 rounded bg-slate-50">No sub-tests added yet.</p>}
                                        {subTests.map((t, i) => (
                                            <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs border cursor-pointer ${editingSubTestIndex === i ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`} onClick={() => startEditingSubTest(i)}>
                                              <ListPlus className="w-3 h-3 text-teal-500" />
                                              <span className="font-medium flex-1 text-slate-700">{t.name}</span>
                                              {t.unit && <span className="text-[10px] text-slate-500 bg-white px-1 rounded border">Unit: {t.unit}</span>}
                                              {t.range && <span className="text-[10px] text-slate-500 bg-white px-1 rounded border">Range: {t.range}</span>}
                                              <button type="button" onClick={(e) => { e.stopPropagation(); removeSubTestItem(i); }} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded"><MinusCircle className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                      </div>
                                      <div className="flex gap-2 items-start">
                                        <div className="flex-1 space-y-1">
                                              <input 
                                                  id="subTestNameInput"
                                                  type="text" 
                                                  className="w-full p-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-teal-500" 
                                                  placeholder={editingSubTestIndex !== null ? "Edit Name..." : "Sub-test Name (e.g. SGPT)"}
                                                  value={newSubTest.name} 
                                                  onChange={e => setNewSubTest({...newSubTest, name: e.target.value})}
                                                  onKeyDown={handleSubTestKeyDown}
                                              />
                                        </div>
                                        <div className="w-20 space-y-1">
                                              <input 
                                                  type="text" 
                                                  className="w-full p-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-teal-500" 
                                                  placeholder="Unit" 
                                                  value={newSubTest.unit} 
                                                  onChange={e => setNewSubTest({...newSubTest, unit: e.target.value})} 
                                                  onKeyDown={handleSubTestKeyDown} 
                                              />
                                        </div>
                                        <div className="w-20 space-y-1">
                                              <input 
                                                  type="text" 
                                                  className="w-full p-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-teal-500" 
                                                  placeholder="Range" 
                                                  value={newSubTest.range} 
                                                  onChange={e => setNewSubTest({...newSubTest, range: e.target.value})} 
                                                  onKeyDown={handleSubTestKeyDown} 
                                              />
                                        </div>
                                        <button type="button" onClick={addSubTestItem} className={`h-[34px] px-3 text-white rounded text-xs font-bold flex items-center ${editingSubTestIndex !== null ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'}`}>
                                            {editingSubTestIndex !== null ? 'Update' : 'Add'}
                                        </button>
                                        {editingSubTestIndex !== null && (
                                            <button type="button" onClick={() => { setEditingSubTestIndex(null); setNewSubTest({ name: '', unit: '', range: '' }); }} className="h-[34px] px-2 text-slate-500 border border-slate-200 rounded hover:bg-slate-50">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                      </div>
                                  </div>
                                </div>
                            )}

                            <div className="md:col-span-2 pt-2 flex justify-end gap-3 border-t border-teal-100 mt-2">
                                <button type="button" onClick={resetServiceForm} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-white font-medium">रद्द गर्नुहोस्</button>
                                <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md shadow-teal-900/10 flex items-center gap-2">
                                  <Save className="w-4 h-4" /> {editingServiceItem ? 'अपडेट गर्नुहोस् (Update)' : 'सूचीमा थप्नुहोस् (Save)'}
                                </button>
                            </div>
                          </form>
                      </div>
                  )}
                  
                  {/* Type Toggles */}
                  <div className="flex gap-4 mb-6">
                    <button 
                        onClick={() => { setRateMode('SERVICE'); setItemSearch(''); setEditingItemId(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${rateMode === 'SERVICE' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <LayoutTemplate className="w-4 h-4" />
                        सेवा र परीक्षण (Services & Tests)
                    </button>
                    <button 
                        onClick={() => { setRateMode('MEDICINE'); setItemSearch(''); setEditingItemId(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${rateMode === 'MEDICINE' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <Package className="w-4 h-4" />
                        औषधि (Medicines)
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder={rateMode === 'SERVICE' ? "सेवाको नाम खोज्नुहोस्..." : "औषधिको नाम खोज्नुहोस्..."}
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                        />
                    </div>
                    {rateMode === 'SERVICE' ? (
                        <select 
                          className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium w-full md:w-48"
                          value={serviceCategory}
                          onChange={(e) => setServiceCategory(e.target.value)}
                        >
                          <option value="ALL">सबै वर्ग (All)</option>
                          <option value="GENERAL_TREATMENT">OPD / General</option>
                          <option value="LAB">Lab / Pathology</option>
                          <option value="X_RAY">X-Ray</option>
                          <option value="USG">Video X-Ray</option>
                          <option value="ECG">ECG</option>
                          <option value="HOSPITAL">Hospital</option>
                          <option value={AppView.DRESSING_MINOR_OT}>Dressing / Minor OT</option>
                          <option value={AppView.IMMUNIZATION}>Vaccine</option>
                          <option value={AppView.COMMUNICABLE}>Communicable</option>
                        </select>
                    ) : (
                        <select 
                          className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium w-full md:w-48"
                          value={medCategory}
                          onChange={(e) => setMedCategory(e.target.value)}
                        >
                          <option value="ALL">सबै वर्ग (All)</option>
                          <option value="Tablets">Tablets</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injections">Injections</option>
                          <option value="Ointment">Ointment</option>
                          <option value="Equipment">Equipment</option>
                        </select>
                    )}
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-200">
                          <tr>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                                {rateMode === 'SERVICE' ? 'सेवाको नाम' : 'औषधिको नाम'}
                              </th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">वर्ग (Category)</th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700">हालको दर (Price)</th>
                              <th className="px-4 py-3 text-sm font-semibold text-slate-700 w-32 text-center">कार्य</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(rateMode === 'SERVICE' ? filteredServices : filteredInventory).length === 0 ? (
                              <tr><td colSpan={4} className="p-8 text-center text-slate-500">कुनै डाटा फेला परेन।</td></tr>
                          ) : (
                              (rateMode === 'SERVICE' ? filteredServices : filteredInventory).map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                      {item.name}
                                      {rateMode === 'MEDICINE' && <span className="text-xs text-slate-400 block font-normal">{item.genericName}</span>}
                                      {/* Show Lab Indicator */}
                                      {rateMode === 'SERVICE' && item.category === 'LAB' && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {item.unit && <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500 border border-slate-200">Unit: {item.unit}</span>}
                                            {item.subTests?.length > 0 && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded-full font-bold border border-purple-200 flex items-center gap-1"><ListPlus className="w-3 h-3"/> {item.subTests.length} Sub-tests</span>}
                                          </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">{item.category}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-teal-700">
                                        Rs. {item.price}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {rateMode === 'SERVICE' ? (
                                          // Edit Button for Service (Full Form)
                                          <button 
                                            onClick={() => startEditingRate(item)}
                                            className="flex items-center gap-1 mx-auto text-slate-500 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors text-xs font-medium"
                                            title="Edit Details"
                                          >
                                            <Edit2 className="w-3 h-3" /> Edit
                                          </button>
                                      ) : (
                                          // Simple Edit for Medicine
                                          <button className="text-slate-400 cursor-not-allowed p-1.5"><Lock className="w-3 h-3" /></button>
                                      )}
                                    </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && showSecurity && (
            <div className="space-y-6">
               {/* Change Password */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <KeyRound className="w-5 h-5 text-teal-600" /> पासवर्ड परिवर्तन
                  </h3>
                  <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                     <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">हालको पासवर्ड</label>
                        <input 
                        type="password" 
                        required
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={passForm.current}
                        onChange={(e) => setPassForm({...passForm, current: e.target.value})}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">नयाँ पासवर्ड</label>
                        <input 
                        type="password" 
                        required
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={passForm.new}
                        onChange={(e) => setPassForm({...passForm, new: e.target.value})}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">नयाँ पासवर्ड सुनिश्चित गर्नुहोस्</label>
                        <input 
                        type="password" 
                        required
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={passForm.confirm}
                        onChange={(e) => setPassForm({...passForm, confirm: e.target.value})}
                        />
                     </div>
                     <div className="pt-4">
                        <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                        <Save className="w-4 h-4" /> पासवर्ड अद्यावधिक गर्नुहोस्
                        </button>
                     </div>
                  </form>
               </div>

               {/* Add Sub Admin - Only for Super Admin */}
               {currentUserData?.role === UserRole.SUPER_ADMIN && (
                  <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 p-6 animate-in fade-in duration-300">
                     <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <Building2 className="w-5 h-5" /> नयाँ सब-एडमिन थप्नुहोस् (Sub-Admin)
                     </h3>
                     <p className="text-indigo-600 text-sm mb-6">शाखा वा संस्थाको लागि प्रशासक बनाउनुहोस्।</p>
                     
                     <form onSubmit={handleCreateSubAdmin} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-sm font-medium text-indigo-800">पूरा नाम (Full Name)</label>
                              <input 
                                 type="text" 
                                 required
                                 className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                 value={subAdminForm.fullName}
                                 onChange={(e) => setSubAdminForm({...subAdminForm, fullName: e.target.value})}
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-sm font-medium text-indigo-800">पद (Designation)</label>
                              <input 
                                 type="text" 
                                 placeholder="e.g. Branch Manager"
                                 className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                 value={subAdminForm.designation}
                                 onChange={(e) => setSubAdminForm({...subAdminForm, designation: e.target.value})}
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-sm font-medium text-indigo-800">संस्थाको नाम (Organization)</label>
                              <input 
                                 type="text" 
                                 required
                                 placeholder="e.g. City Hospital Branch"
                                 className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                 value={subAdminForm.organization}
                                 onChange={(e) => setSubAdminForm({...subAdminForm, organization: e.target.value})}
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-sm font-medium text-indigo-800">फोन नम्बर</label>
                              <input 
                                 type="tel" 
                                 className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                 value={subAdminForm.phoneNumber}
                                 onChange={(e) => setSubAdminForm({...subAdminForm, phoneNumber: e.target.value})}
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-sm font-medium text-indigo-800">युजरनेम</label>
                              <input 
                              type="text" 
                              required
                              className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                              value={subAdminForm.username}
                              onChange={(e) => setSubAdminForm({...subAdminForm, username: e.target.value})}
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-sm font-medium text-indigo-800">पासवर्ड</label>
                              <input 
                              type="password" 
                              required
                              className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                              value={subAdminForm.password}
                              onChange={(e) => setSubAdminForm({...subAdminForm, password: e.target.value})}
                              />
                           </div>
                        </div>
                        <div className="pt-2">
                           <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-md shadow-indigo-200">
                              <UserPlus className="w-4 h-4" /> सब-एडमिन सिर्जना गर्नुहोस्
                           </button>
                        </div>
                     </form>
                  </div>
               )}
            </div>
          )}

          {/* User Access Tab - Protected */}
          {activeTab === 'users' && showUsers && currentUserData && (
             <div className="space-y-6">
                
                {/* Create General User - Only for Sub Admin */}
                {currentUserData.role === UserRole.SUB_ADMIN && (
                   <div className="bg-teal-50 rounded-2xl shadow-sm border border-teal-100 p-6 animate-in fade-in duration-300">
                      <h3 className="text-lg font-bold text-teal-900 mb-2 flex items-center gap-2">
                         <UserPlus className="w-5 h-5" /> स्टाफ थप्नुहोस् (Staff User)
                      </h3>
                      <p className="text-teal-700 text-sm mb-4">
                         <strong>{currentUserData.organizationId}</strong> अन्तर्गत नयाँ प्रयोगकर्ता बनाउनुहोस्।
                      </p>
                      <form onSubmit={handleCreateOrgUser} className="space-y-4 max-w-2xl">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-xs font-bold text-teal-800 uppercase">पूरा नाम</label>
                              <input type="text" required value={newUserForm.fullName} onChange={e => setNewUserForm({...newUserForm, fullName: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-teal-200 bg-white" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-bold text-teal-800 uppercase">पद (Designation)</label>
                              <input type="text" value={newUserForm.designation} onChange={e => setNewUserForm({...newUserForm, designation: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-teal-200 bg-white" />
                           </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="text-xs font-bold text-teal-800 uppercase">फोन नम्बर</label>
                              <input type="tel" value={newUserForm.phoneNumber} onChange={e => setNewUserForm({...newUserForm, phoneNumber: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-teal-200 bg-white" />
                           </div>
                           <div className="space-y-1">
                             <label className="text-xs font-bold text-teal-800 uppercase">नयाँ युजरनेम</label>
                             <input type="text" required value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-teal-200 bg-white" placeholder="e.g. nurse1" />
                           </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                           <div className="space-y-1">
                             <label className="text-xs font-bold text-teal-800 uppercase">पासवर्ड</label>
                             <input type="password" required value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-teal-200 bg-white" placeholder="******" />
                           </div>
                           <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center justify-center gap-2 h-[38px]">
                              <UserPlus className="w-4 h-4" /> सिर्जना गर्नुहोस्
                           </button>
                         </div>
                      </form>
                   </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
                   <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <UserCog className="w-5 h-5 text-teal-600" /> प्रयोगकर्ता सूची र अनुमतिहरू
                   </h3>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700">युजरनेम / नाम</th>
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700">पद (Designation)</th>
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700">भूमिका (Role)</th>
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700">संस्था</th>
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-right">कार्य</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                               <tr key={user.username} className="hover:bg-slate-50">
                                  <td className="px-4 py-4 font-medium text-slate-900 flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase shrink-0">
                                        {user.username.substring(0,2)}
                                     </div>
                                     <div className="flex flex-col">
                                        <span>{user.fullName || user.username}</span>
                                        <span className="text-xs text-slate-400 font-normal">@{user.username}</span>
                                     </div>
                                     {user.username === currentUser && <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full ml-2">You</span>}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-slate-500">
                                     {user.designation || '-'}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-slate-500">
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-800' :
                                        user.role === UserRole.SUB_ADMIN ? 'bg-indigo-100 text-indigo-800' :
                                        'bg-slate-100 text-slate-600'
                                     }`}>
                                        {user.role}
                                     </span>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-slate-500">
                                     {user.organizationId || 'N/A'}
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                     <div className="flex justify-end gap-2">
                                       {user.username !== currentUser && user.role !== UserRole.SUPER_ADMIN && (
                                          <button 
                                             onClick={() => handleDeleteUser(user.username)}
                                             className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                             title="Delete User"
                                          >
                                             <Trash2 className="w-4 h-4" />
                                          </button>
                                       )}
                                       {user.role !== UserRole.SUPER_ADMIN && (
                                          <button 
                                             onClick={() => setEditingUser(user)}
                                             className="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                          >
                                             <Edit2 className="w-3 h-3" /> अनुमति (Permissions)
                                          </button>
                                       )}
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && showData && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" /> डाटा व्यवस्थापन
              </h3>
              
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">डाटा निर्यात (Export Data)</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    तपाईंको मौज्दात र बिक्री इतिहासको पूर्ण ब्याकअप JSON ढाँचामा डाउनलोड गर्नुहोस्।
                  </p>
                  <button onClick={handleExportData} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
                    <Download className="w-4 h-4" /> पूर्ण सिस्टम ब्याकअप (Full System Backup)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Permission Edit Modal */}
      {editingUser && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">अनुमति: {editingUser.username}</h3>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Inventory Group */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" /> मौज्दात व्यवस्थापन (Inventory)
                     </h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <PermissionToggle label="हेर्ने (View)" checked={editingUser.permissions.inventoryView} onChange={() => togglePermission('inventoryView')} />
                        <PermissionToggle label="थप्ने (Add)" checked={editingUser.permissions.inventoryAdd} onChange={() => togglePermission('inventoryAdd')} />
                        <PermissionToggle label="सम्पादन (Edit)" checked={editingUser.permissions.inventoryEdit} onChange={() => togglePermission('inventoryEdit')} />
                        <PermissionToggle label="हटाउने (Delete)" checked={editingUser.permissions.inventoryDelete} onChange={() => togglePermission('inventoryDelete')} />
                     </div>
                  </div>

                  {/* General Clinic Roles */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" /> क्लिनिक र सेवाहरू (General)
                     </h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <PermissionToggle label="बिरामी दर्ता" checked={editingUser.permissions.patientRegister} onChange={() => togglePermission('patientRegister')} />
                        <PermissionToggle label="डाक्टर परामर्श" checked={editingUser.permissions.doctorConsultation} onChange={() => togglePermission('doctorConsultation')} />
                        <PermissionToggle label="इतिहास हेर्ने" checked={editingUser.permissions.viewPatientHistory} onChange={() => togglePermission('viewPatientHistory')} />
                     </div>
                  </div>
                  
                  {/* Granular Service Access (Sub-Menu Level) */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                     <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4" /> विभाग पहुँच (Department Access)
                     </h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <PermissionToggle label="General OPD" checked={editingUser.permissions.accessGeneralTreatment} onChange={() => togglePermission('accessGeneralTreatment')} />
                        <PermissionToggle label="Pathology (Lab)" checked={editingUser.permissions.accessPathology} onChange={() => togglePermission('accessPathology')} />
                        <PermissionToggle label="X-Ray" checked={editingUser.permissions.accessXRay} onChange={() => togglePermission('accessXRay')} />
                        <PermissionToggle label="USG (Video X-Ray)" checked={editingUser.permissions.accessUSG} onChange={() => togglePermission('accessUSG')} />
                        <PermissionToggle label="ECG" checked={editingUser.permissions.accessECG} onChange={() => togglePermission('accessECG')} />
                        <PermissionToggle label="Dressing / OT" checked={editingUser.permissions.accessDressing} onChange={() => togglePermission('accessDressing')} />
                        <PermissionToggle label="MCH" checked={editingUser.permissions.accessMCH} onChange={() => togglePermission('accessMCH')} />
                        <PermissionToggle label="Immunization (खोप)" checked={editingUser.permissions.accessImmunization} onChange={() => togglePermission('accessImmunization')} />
                        <PermissionToggle label="TB & Leprosy" checked={editingUser.permissions.accessTB} onChange={() => togglePermission('accessTB')} />
                        <PermissionToggle label="Nutrition" checked={editingUser.permissions.accessNutrition} onChange={() => togglePermission('accessNutrition')} />
                        <PermissionToggle label="CBIMNCI" checked={editingUser.permissions.accessCBIMNCI} onChange={() => togglePermission('accessCBIMNCI')} />
                        <PermissionToggle label="Communicable Dis." checked={editingUser.permissions.accessCommunicable} onChange={() => togglePermission('accessCommunicable')} />
                        <PermissionToggle label="Rabies Vaccine" checked={editingUser.permissions.accessRabies} onChange={() => togglePermission('accessRabies')} />
                        <PermissionToggle label="Non-Communicable" checked={editingUser.permissions.accessNonCommunicable} onChange={() => togglePermission('accessNonCommunicable')} />
                     </div>
                  </div>

                  {/* Modules Group */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4" /> अन्य मोड्युलहरू
                     </h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <PermissionToggle label="बिक्री (POS)" checked={editingUser.permissions.posAccess} onChange={() => togglePermission('posAccess')} />
                        <PermissionToggle label="सेवा बिलिङ" checked={editingUser.permissions.posAccess} onChange={() => togglePermission('posAccess')} />
                        <PermissionToggle label="AI सहायक" checked={editingUser.permissions.aiAccess} onChange={() => togglePermission('aiAccess')} />
                     </div>
                  </div>

                  {/* Admin Group */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> प्रशासन (Admin)
                     </h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <PermissionToggle label="आर्थिक रिपोर्ट" checked={editingUser.permissions.viewFinancials} onChange={() => togglePermission('viewFinancials')} />
                        <PermissionToggle label="प्रणाली सेटिङ्स" checked={editingUser.permissions.manageSettings} onChange={() => togglePermission('manageSettings')} disabled={editingUser.username === 'admin'} />
                        <PermissionToggle label="प्रयोगकर्ता व्यवस्थापन" checked={editingUser.permissions.manageUsers} onChange={() => togglePermission('manageUsers')} disabled={editingUser.username === 'admin'} />
                     </div>
                  </div>

                  {/* NEW: Settings Granular Access */}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                     <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4" /> सेटिङ्स पहुँच (Settings Access)
                     </h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <PermissionToggle label="सामान्य (Store Profile)" checked={editingUser.permissions.settings_General} onChange={() => togglePermission('settings_General')} />
                        <PermissionToggle label="दर/सेवा (Rate Setup)" checked={editingUser.permissions.settings_Rates} onChange={() => togglePermission('settings_Rates')} />
                        <PermissionToggle label="प्रयोगकर्ता (Users)" checked={editingUser.permissions.settings_Users} onChange={() => togglePermission('settings_Users')} />
                        <PermissionToggle label="ब्याकअप (Data)" checked={editingUser.permissions.settings_Data} onChange={() => togglePermission('settings_Data')} />
                     </div>
                  </div>

               </div>

               <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">रद्द गर्नुहोस्</button>
                  <button onClick={handleSavePermissions} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">परिवर्तन सुरक्षित गर्नुहोस्</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

const PermissionToggle = ({ label, checked, onChange, disabled }: { label: string, checked: boolean, onChange: () => void, disabled?: boolean }) => (
   <div 
      onClick={!disabled ? onChange : undefined}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
         disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' :
         checked ? 'bg-teal-50 border-teal-200 cursor-pointer hover:bg-teal-100' : 'bg-white border-slate-200 cursor-pointer hover:bg-slate-50'
      }`}
   >
      <div className={`${checked ? 'text-teal-600' : 'text-slate-400'}`}>
         {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
      </div>
      <span className={`text-sm font-medium ${checked ? 'text-teal-900' : 'text-slate-600'}`}>{label}</span>
   </div>
);
