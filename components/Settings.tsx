import React, { useState, useEffect } from 'react';
import { Save, Shield, Database, LayoutTemplate, Download, CheckCircle, AlertCircle, KeyRound, Users, UserCog, Edit2, X, CheckSquare, Square, Building2, UserPlus, Trash2 } from 'lucide-react';
import { dbService } from '../services/db';
import { Medicine, Sale, User, UserPermissions, UserRole } from '../types';

interface SettingsProps {
  inventory: Medicine[];
  sales: Sale[];
  currentUser: string;
}

export const Settings: React.FC<SettingsProps> = ({ inventory, sales, currentUser }) => {
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
     organization: ''
  });

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserForm, setNewUserForm] = useState({
     username: '',
     password: ''
  });

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
  }, [activeTab, currentUser]);

  const loadUsers = async () => {
    try {
       const allUsers = await dbService.getAllUsers();
       setUsers(allUsers);
    } catch (e) {
       console.error(e);
    }
  };

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
           subAdminForm.organization
        );
        showSuccess(`Sub-Admin '${subAdminForm.username}' सिर्जना भयो - ${subAdminForm.organization}`);
        setSubAdminForm({ username: '', password: '', organization: '' });
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
           currentUserData.organizationId
        );
        showSuccess(`User '${newUserForm.username}' सिर्जना गरियो।`);
        setNewUserForm({ username: '', password: '' });
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

  const handleExportData = () => {
    const data = {
      inventory,
      sales,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmaflow_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('डाटा निर्यात सुरु भयो');
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
     
     // Prevent removing admin rights from main admin
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === 'general' ? 'bg-white shadow-md text-teal-600 border border-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <LayoutTemplate className="w-5 h-5" /> सामान्य (General)
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === 'security' ? 'bg-white shadow-md text-teal-600 border border-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <Shield className="w-5 h-5" /> सुरक्षा (Security)
          </button>
          
          {/* User Access Button - Visible for Admin and SubAdmin */}
          {currentUserData && (currentUserData.role === UserRole.SUPER_ADMIN || currentUserData.role === UserRole.SUB_ADMIN) && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === 'users' ? 'bg-white shadow-md text-teal-600 border border-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <Users className="w-5 h-5" /> प्रयोगकर्ता पहुँच (Users)
            </button>
          )}

          <button 
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all ${activeTab === 'data' ? 'bg-white shadow-md text-teal-600 border border-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <Database className="w-5 h-5" /> डाटा ब्याकअप (Backup)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-teal-600" /> पसल प्रोफाइल
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
                  <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" /> सेटिङ सुरक्षित गर्नुहोस्
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
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
                     
                     <form onSubmit={handleCreateSubAdmin} className="max-w-md space-y-4">
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
                        <div className="grid grid-cols-2 gap-4">
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
          {activeTab === 'users' && currentUserData && (
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
                      <form onSubmit={handleCreateOrgUser} className="flex gap-4 items-end max-w-2xl">
                         <div className="space-y-1 flex-1">
                           <label className="text-xs font-bold text-teal-800 uppercase">नयाँ युजरनेम</label>
                           <input type="text" required value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-teal-200 bg-white" placeholder="e.g. nurse1" />
                         </div>
                         <div className="space-y-1 flex-1">
                           <label className="text-xs font-bold text-teal-800 uppercase">पासवर्ड</label>
                           <input type="password" required value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full p-2 text-sm rounded-lg border border-teal-200 bg-white" placeholder="******" />
                         </div>
                         <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2 h-[38px]">
                            <UserPlus className="w-4 h-4" /> सिर्जना गर्नुहोस्
                         </button>
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
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700">युजरनेम</th>
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700">भूमिका (Role)</th>
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700">संस्था</th>
                               <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-right">कार्य</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                               <tr key={user.username} className="hover:bg-slate-50">
                                  <td className="px-4 py-4 font-medium text-slate-900 flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                        {user.username.substring(0,2)}
                                     </div>
                                     {user.username} 
                                     {user.username === currentUser && <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full ml-2">You</span>}
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
          {activeTab === 'data' && (
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
                    <Download className="w-4 h-4" /> Export JSON
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
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">अनुमति: {editingUser.username}</h3>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Inventory Group */}
                  <div>
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">मौज्दात व्यवस्थापन (Inventory)</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <PermissionToggle 
                           label="मौज्दात हेर्ने (View)" 
                           checked={editingUser.permissions.inventoryView} 
                           onChange={() => togglePermission('inventoryView')} 
                        />
                        <PermissionToggle 
                           label="औषधि थप्ने (Add)" 
                           checked={editingUser.permissions.inventoryAdd} 
                           onChange={() => togglePermission('inventoryAdd')} 
                        />
                        <PermissionToggle 
                           label="सम्पादन गर्ने (Edit)" 
                           checked={editingUser.permissions.inventoryEdit} 
                           onChange={() => togglePermission('inventoryEdit')} 
                        />
                        <PermissionToggle 
                           label="हटाउने (Delete)" 
                           checked={editingUser.permissions.inventoryDelete} 
                           onChange={() => togglePermission('inventoryDelete')} 
                        />
                     </div>
                  </div>

                  {/* Service / Clinic Group */}
                  <div className="border-t border-slate-100 pt-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">क्लिनिक र सेवाहरू</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <PermissionToggle 
                           label="सेवा मोड्युल पहुँच" 
                           checked={editingUser.permissions.clinicAccess} 
                           onChange={() => togglePermission('clinicAccess')} 
                        />
                        <PermissionToggle 
                           label="बिरामी दर्ता गर्ने" 
                           checked={editingUser.permissions.patientRegister} 
                           onChange={() => togglePermission('patientRegister')} 
                        />
                        <PermissionToggle 
                           label="डाक्टर परामर्श" 
                           checked={editingUser.permissions.doctorConsultation} 
                           onChange={() => togglePermission('doctorConsultation')} 
                        />
                        <PermissionToggle 
                           label="पूर्ण इतिहास हेर्ने" 
                           checked={editingUser.permissions.viewPatientHistory} 
                           onChange={() => togglePermission('viewPatientHistory')} 
                        />
                     </div>
                  </div>

                  {/* Modules Group */}
                  <div className="border-t border-slate-100 pt-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">अन्य मोड्युलहरू</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <PermissionToggle 
                           label="बिक्री (POS)" 
                           checked={editingUser.permissions.posAccess} 
                           onChange={() => togglePermission('posAccess')} 
                        />
                        <PermissionToggle 
                           label="ल्याब (Pathology)" 
                           checked={editingUser.permissions.labAccess} 
                           onChange={() => togglePermission('labAccess')} 
                        />
                        <PermissionToggle 
                           label="AI सहायक" 
                           checked={editingUser.permissions.aiAccess} 
                           onChange={() => togglePermission('aiAccess')} 
                        />
                     </div>
                  </div>

                  {/* Admin Group */}
                  <div className="border-t border-slate-100 pt-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">प्रशासन (Admin)</h4>
                     <div className="grid grid-cols-2 gap-3">
                        <PermissionToggle 
                           label="आर्थिक रिपोर्ट हेर्ने" 
                           checked={editingUser.permissions.viewFinancials} 
                           onChange={() => togglePermission('viewFinancials')} 
                        />
                        <PermissionToggle 
                           label="प्रणाली सेटिङ्स" 
                           checked={editingUser.permissions.manageSettings} 
                           onChange={() => togglePermission('manageSettings')} 
                           disabled={editingUser.username === 'admin'}
                        />
                        <PermissionToggle 
                           label="प्रयोगकर्ता व्यवस्थापन" 
                           checked={editingUser.permissions.manageUsers} 
                           onChange={() => togglePermission('manageUsers')}
                           disabled={editingUser.username === 'admin'}
                        />
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