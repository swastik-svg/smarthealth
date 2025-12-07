
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { POS } from './components/POS';
import { ServiceBilling } from './components/ServiceBilling';
import { Services } from './components/Services';
import { Pathology } from './components/Pathology';
import { AIAssistant } from './components/AIAssistant';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { ReportRabies } from './components/ReportRabies';
import { ReportServiceUser } from './components/ReportServiceUser';
import { ReportImmunization } from './components/ReportImmunization';
import { ReportCBIMNCI } from './components/ReportCBIMNCI';
import { ReportNutrition } from './components/ReportNutrition';
import { ReportMNH } from './components/ReportMNH';
import { ReportFamilyPlanning } from './components/ReportFamilyPlanning';
import { ReportReproductiveHealth } from './components/ReportReproductiveHealth';
import { ReportORC } from './components/ReportORC';
import { Medicine, Sale, AppView, UserPermissions, UserRole, User } from './types';
import { dbService } from './services/db';
import { Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Data States
  const [inventory, setInventory] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User Session State
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [userOrgId, setUserOrgId] = useState<string>('MAIN');
  const [activeFiscalYear, setActiveFiscalYear] = useState<string>('2081/82');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Super Admin Filter State
  const [orgFilter, setOrgFilter] = useState<string>('ALL');

  // Default permissions
  const [permissions, setPermissions] = useState<UserPermissions>({
    inventoryView: false,
    inventoryAdd: false,
    inventoryEdit: false,
    inventoryDelete: false,
    posAccess: false,
    clinicAccess: false,
    patientRegister: false,
    doctorConsultation: false,
    viewPatientHistory: false,
    
    // Specific Department Access (Sub-menu level)
    accessGeneralTreatment: false,
    accessPathology: false,
    accessXRay: false,
    accessUSG: false,
    accessECG: false,
    accessDressing: false,
    accessMCH: false,
    accessImmunization: false,
    accessTB: false,
    accessNutrition: false,
    accessCBIMNCI: false,
    accessCommunicable: false,
    accessRabies: false,
    accessNonCommunicable: false,

    viewFinancials: false,
    viewReports: false,
    manageSettings: false,
    manageUsers: false,
    aiAccess: false,

    settings_General: false,
    settings_Rates: false,
    settings_Users: false,
    settings_Data: false
  });

  // Shared Data Loader
  const loadData = async () => {
    try {
      const [loadedInventory, loadedSales, loadedUsers] = await Promise.all([
        dbService.getAllMedicines(),
        dbService.getAllSales(),
        dbService.getAllUsers()
      ]);
      
      // Sort sales by timestamp descending
      setSales(loadedSales.sort((a, b) => b.timestamp - a.timestamp));
      setInventory(loadedInventory);
      setAllUsers(loadedUsers);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load database:", err);
      // Safely handle error object to avoid [object Object]
      const errorMsg = err?.message || JSON.stringify(err) || "Unknown database error";
      setError(errorMsg);
    }
  };

  // Load Data from DB on Startup and Check Auth
  useEffect(() => {
    // Check Authentication
    const authStatus = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('currentUser');
    const storedPerms = localStorage.getItem('userPermissions');
    const storedRole = localStorage.getItem('userRole');
    const storedOrg = localStorage.getItem('userOrg');
    const storedFY = localStorage.getItem('fiscalYear');
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    if (storedUser) setCurrentUser(storedUser);
    if (storedPerms) setPermissions(JSON.parse(storedPerms));
    if (storedRole) setUserRole(storedRole as UserRole);
    if (storedOrg) setUserOrgId(storedOrg);
    if (storedFY) setActiveFiscalYear(storedFY);

    const init = async () => {
        await loadData();
        setIsLoading(false);
    };
    init();

    // Subscribe to Realtime Changes
    const unsubscribe = dbService.subscribeToChanges(() => {
       console.log("Remote changes detected, refreshing data...");
       loadData();
    });

    return () => {
       unsubscribe();
    };
  }, []);

  // When login successful, store session data
  const handleLogin = (user: { username: string, permissions: UserPermissions, role: UserRole, organizationId: string, fiscalYear: string }) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', user.username);
    localStorage.setItem('userPermissions', JSON.stringify(user.permissions));
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userOrg', user.organizationId);
    localStorage.setItem('fiscalYear', user.fiscalYear);
    
    setCurrentUser(user.username);
    setPermissions(user.permissions);
    setUserRole(user.role);
    setUserOrgId(user.organizationId);
    setActiveFiscalYear(user.fiscalYear);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setCurrentUser('');
    setUserRole(UserRole.USER);
    setUserOrgId('MAIN');
    setCurrentView(AppView.DASHBOARD); 
  };

  // ----- Data Filtering Logic -----
  
  const activeOrgContext = useMemo(() => {
     if (userRole === UserRole.SUPER_ADMIN) {
        return orgFilter === 'ALL' ? 'ALL' : orgFilter;
     }
     return userOrgId;
  }, [userRole, orgFilter, userOrgId]);

  const filteredInventory = useMemo(() => {
     if (userRole === UserRole.SUPER_ADMIN) {
        if (orgFilter === 'ALL') return inventory;
        return inventory.filter(i => i.organizationId === orgFilter);
     }
     return inventory.filter(i => i.organizationId === userOrgId);
  }, [inventory, userRole, orgFilter, userOrgId]);

  const filteredSales = useMemo(() => {
     if (userRole === UserRole.SUPER_ADMIN) {
        if (orgFilter === 'ALL') return sales;
        return sales.filter(s => s.organizationId === orgFilter);
     }
     return sales.filter(s => s.organizationId === userOrgId);
  }, [sales, userRole, orgFilter, userOrgId]);

  const organizationList = useMemo(() => {
     const orgs = new Set<string>();
     orgs.add('MAIN'); 
     allUsers.forEach(u => {
        if (u.organizationId) orgs.add(u.organizationId);
     });
     inventory.forEach(i => { if (i.organizationId) orgs.add(i.organizationId); });
     return Array.from(orgs).sort();
  }, [allUsers, inventory]);


  // ----- Handlers -----

  const handleAddMedicine = async (medicine: Medicine) => {
    if (!permissions.inventoryAdd) return;
    try {
      if (activeOrgContext === 'ALL') {
         alert("Please select a specific organization to add medicines.");
         return;
      }
      const newMed = { ...medicine, organizationId: activeOrgContext };
      await dbService.addMedicine(newMed);
      // No need to setInventory manually if realtime works, but good for instant feedback
      setInventory(prev => [...prev, newMed]);
    } catch (err) {
      console.error("Error adding medicine", err);
      alert("Failed to save medicine");
    }
  };

  const handleUpdateMedicine = async (updatedMedicine: Medicine) => {
    if (!permissions.inventoryEdit) return;
    try {
      await dbService.updateMedicine(updatedMedicine);
      setInventory(prev => prev.map(m => m.id === updatedMedicine.id ? updatedMedicine : m));
    } catch (err) {
      console.error("Error updating medicine", err);
      alert("Failed to update medicine");
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!permissions.inventoryDelete) return;
    try {
      await dbService.deleteMedicine(id);
      setInventory(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Error deleting medicine", err);
      alert("Failed to delete medicine");
    }
  };

  const handleProcessSale = async (sale: Sale) => {
    try {
      if (activeOrgContext === 'ALL') {
         alert("Please select a specific organization to process sales.");
         return;
      }

      const saleWithOrg = { ...sale, organizationId: activeOrgContext };

      const updatedMedicines: Medicine[] = [];
      const newInventoryState = inventory.map(item => {
        if (item.organizationId !== activeOrgContext) return item;
        const cartItem = sale.items.find(c => c.id === item.id);
        if (cartItem) {
          const updatedItem = { ...item, stock: item.stock - cartItem.quantity };
          updatedMedicines.push(updatedItem);
          return updatedItem;
        }
        return item;
      });

      await dbService.processSale(saleWithOrg, updatedMedicines);

      setSales(prev => [saleWithOrg, ...prev]);
      setInventory(newInventoryState);
      
    } catch (err) {
      console.error("Error processing sale", err);
      alert("Transaction failed. Please try again.");
    }
  };

  const handleProcessServiceBilling = async (sale: Sale) => {
     try {
        if (activeOrgContext === 'ALL') {
           alert("Select Organization first.");
           return;
        }
        const saleWithOrg = { ...sale, organizationId: activeOrgContext };
        
        await dbService.processSale(saleWithOrg, []);
        setSales(prev => [saleWithOrg, ...prev]);
     } catch (err) {
        console.error("Error billing service", err);
        alert("Billing failed.");
     }
  };

  const handleServiceComplete = (updatedInventory: Medicine[], newSale: Sale) => {
    const newMainInventory = inventory.map(item => {
       const updated = updatedInventory.find(u => u.id === item.id);
       return updated || item;
    });
    setInventory(newMainInventory);
    setSales(prev => [newSale, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <h2 className="text-slate-600 font-medium">Connecting to Cloud...</h2>
      </div>
    );
  }

  // Error State - Critical
  if (error) {
     return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-6 p-8 text-center">
           <div className="bg-red-50 p-4 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-600" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Database Connection Error</h2>
              <p className="text-slate-500 max-w-lg mb-4">{error}</p>
              
              <div className="text-xs bg-slate-100 p-4 rounded text-left font-mono text-slate-600 overflow-x-auto max-w-2xl border border-slate-200">
                 <strong>Setup Required:</strong><br/>
                 Please run the SQL commands in your Supabase SQL Editor to create tables: <br/>
                 `users`, `medicines`, `sales`, `serviceRecords`, `services`.
              </div>
           </div>
           <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800">
              Retry Connection
           </button>
        </div>
     );
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />; 
  }

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView} 
      onLogout={handleLogout} 
      currentUser={currentUser}
      userRole={userRole}
      currentOrgName={activeOrgContext === 'ALL' ? 'All Branches' : activeOrgContext}
      permissions={permissions}
      availableOrgs={organizationList}
      selectedOrgId={orgFilter}
      onSelectOrg={setOrgFilter}
    >
      {/* View Rendering */}
      {(() => {
        const commonServiceProps = {
           inventory: filteredInventory,
           onServiceComplete: handleServiceComplete,
           permissions: permissions,
           activeOrgId: activeOrgContext,
        };

        switch (currentView) {
          case AppView.DASHBOARD:
            return <Dashboard inventory={filteredInventory} sales={filteredSales} permissions={permissions} activeOrgId={activeOrgContext} />;
          
          case AppView.PATIENT_REGISTRATION:
            return <Services {...commonServiceProps} department={AppView.GENERAL_TREATMENT} title="सेवाग्राही दर्ता (Reception)" autoOpenRegistration={true} />;
            
          case AppView.GENERAL_TREATMENT:
            return <Services {...commonServiceProps} department={AppView.GENERAL_TREATMENT} title="General Treatment (OPD)" />;
            
          case AppView.X_RAY:
            return <Services {...commonServiceProps} department={AppView.X_RAY} title="X-Ray Department" />;
            
          case AppView.USG:
            return <Services {...commonServiceProps} department={AppView.USG} title="USG / Video X-Ray" />;
            
          case AppView.ECG:
            return <Services {...commonServiceProps} department={AppView.ECG} title="ECG Service" />;
            
          case AppView.DRESSING_MINOR_OT:
            return <Services {...commonServiceProps} department={AppView.DRESSING_MINOR_OT} title="Dressing & Minor OT" />;
            
          case AppView.MCH:
            return <Services {...commonServiceProps} department={AppView.MCH} title="Maternal & Child Health" />;
            
          case AppView.IMMUNIZATION:
            return <Services {...commonServiceProps} department={AppView.IMMUNIZATION} title="National Immunization Program (NIP)" />;
            
          case AppView.TB_LEPROSY:
            return <Services {...commonServiceProps} department={AppView.TB_LEPROSY} title="TB & Leprosy Clinic" />;
            
          case AppView.NUTRITION:
            return <Services {...commonServiceProps} department={AppView.NUTRITION} title="Nutrition Clinic" />;
            
          case AppView.CBIMNCI:
            return <Services {...commonServiceProps} department={AppView.CBIMNCI} title="CBIMNCI Clinic" />;
            
          case AppView.COMMUNICABLE:
            return <Services {...commonServiceProps} department={AppView.COMMUNICABLE} title="Communicable Disease" />;

          case AppView.RABIES_VACCINE:
            return <Services {...commonServiceProps} department={AppView.COMMUNICABLE} title="Rabies Vaccine Clinic" autoOpenRegistration={true} preSelectedService="Rabies Vaccine Registration" />;
            
          case AppView.NON_COMMUNICABLE:
            return <Services {...commonServiceProps} department={AppView.NON_COMMUNICABLE} title="Non-Communicable Disease" />;

          // Reports
          case AppView.REPORT_RABIES:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportRabies activeOrgId={activeOrgContext} currentUser={currentUser} userRole={userRole} />;

          case AppView.REPORT_SERVICE_USER:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportServiceUser activeOrgId={activeOrgContext} />;

          case AppView.REPORT_IMMUNIZATION:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportImmunization activeOrgId={activeOrgContext} />;

          case AppView.REPORT_CBIMNCI:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportCBIMNCI activeOrgId={activeOrgContext} />;

          case AppView.REPORT_NUTRITION:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportNutrition activeOrgId={activeOrgContext} />;

          case AppView.REPORT_MNH:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportMNH activeOrgId={activeOrgContext} />;

          case AppView.REPORT_FAMILY_PLANNING:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportFamilyPlanning activeOrgId={activeOrgContext} />;

          case AppView.REPORT_REPRODUCTIVE_HEALTH:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportReproductiveHealth activeOrgId={activeOrgContext} />;

          case AppView.REPORT_ORC:
             if (!permissions.viewReports) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ReportORC activeOrgId={activeOrgContext} />;

          case AppView.PATHOLOGY:
            if (!permissions.accessPathology) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
            return <Pathology />;

          case AppView.INVENTORY:
            if (!permissions.inventoryView) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
            return <Inventory inventory={filteredInventory} onAddMedicine={handleAddMedicine} onUpdateMedicine={handleUpdateMedicine} onDeleteMedicine={handleDeleteMedicine} permissions={permissions} activeOrgId={activeOrgContext} />;
          
          case AppView.POS:
            if (!permissions.posAccess) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
            return <POS inventory={filteredInventory} onProcessSale={handleProcessSale} activeOrgId={activeOrgContext} />;
          
          case AppView.SERVICE_BILLING:
             if (!permissions.posAccess) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
             return <ServiceBilling onProcessBilling={handleProcessServiceBilling} activeOrgId={activeOrgContext} />;
          
          case AppView.AI_ASSISTANT:
            if (!permissions.aiAccess) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
            return <AIAssistant inventory={filteredInventory} />;
          
          case AppView.SETTINGS:
            if (!permissions.manageSettings) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
            return <Settings inventory={filteredInventory} sales={filteredSales} currentUser={currentUser} permissions={permissions} />;
          
          default:
            return <Dashboard inventory={filteredInventory} sales={filteredSales} permissions={permissions} activeOrgId={activeOrgContext} />;
        }
      })()}
    </Layout>
  );
};

export default App;
