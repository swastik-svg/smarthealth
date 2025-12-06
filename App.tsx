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
import { Medicine, Sale, AppView, UserPermissions, UserRole, User } from './types';
import { dbService } from './services/db';
import { Loader2 } from 'lucide-react';

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
    labAccess: false,
    viewFinancials: false,
    manageSettings: false,
    manageUsers: false,
    aiAccess: false
  });

  // Load Data from IndexedDB on Startup and Check Auth
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
      } catch (err) {
        console.error("Failed to load database:", err);
        setError("Failed to load database. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
  
  // 1. Determine the "Active Organization Context" for creating new items
  const activeOrgContext = useMemo(() => {
     if (userRole === UserRole.SUPER_ADMIN) {
        return orgFilter === 'ALL' ? 'ALL' : orgFilter;
     }
     return userOrgId;
  }, [userRole, orgFilter, userOrgId]);

  // 2. Filter Inventory based on Role and Filter Selection
  const filteredInventory = useMemo(() => {
     if (userRole === UserRole.SUPER_ADMIN) {
        if (orgFilter === 'ALL') return inventory;
        return inventory.filter(i => i.organizationId === orgFilter);
     }
     return inventory.filter(i => i.organizationId === userOrgId);
  }, [inventory, userRole, orgFilter, userOrgId]);

  // 3. Filter Sales
  const filteredSales = useMemo(() => {
     if (userRole === UserRole.SUPER_ADMIN) {
        if (orgFilter === 'ALL') return sales;
        return sales.filter(s => s.organizationId === orgFilter);
     }
     return sales.filter(s => s.organizationId === userOrgId);
  }, [sales, userRole, orgFilter, userOrgId]);

  // 4. Available Organizations List (for Super Admin Dropdown)
  const organizationList = useMemo(() => {
     const orgs = new Set<string>();
     orgs.add('MAIN'); // Default
     allUsers.forEach(u => {
        if (u.organizationId) orgs.add(u.organizationId);
     });
     // Scan inventory/sales for any other org IDs that might exist
     inventory.forEach(i => { if (i.organizationId) orgs.add(i.organizationId); });
     return Array.from(orgs).sort();
  }, [allUsers, inventory]);


  // ----- Handlers -----

  const handleAddMedicine = async (medicine: Medicine) => {
    if (!permissions.inventoryAdd) return;
    try {
      // Ensure we have a valid org context. If ALL, creating is disabled in UI, but double check here.
      if (activeOrgContext === 'ALL') {
         alert("Please select a specific organization to add medicines.");
         return;
      }

      const newMed = { ...medicine, organizationId: activeOrgContext };
      await dbService.addMedicine(newMed);
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

      // Tag sale with org
      const saleWithOrg = { ...sale, organizationId: activeOrgContext };

      // Calculate new stock states for the filtered inventory subset
      const updatedMedicines: Medicine[] = [];
      const newInventoryState = inventory.map(item => {
        // Only update items belonging to this org
        if (item.organizationId !== activeOrgContext) return item;

        const cartItem = sale.items.find(c => c.id === item.id);
        if (cartItem) {
          const updatedItem = { ...item, stock: item.stock - cartItem.quantity };
          updatedMedicines.push(updatedItem);
          return updatedItem;
        }
        return item;
      });

      // Perform DB Transaction
      await dbService.processSale(saleWithOrg, updatedMedicines);

      // Update Local State
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
        
        // No inventory updates for service billing, just save the sale
        await dbService.processSale(saleWithOrg, []);
        setSales(prev => [saleWithOrg, ...prev]);
     } catch (err) {
        console.error("Error billing service", err);
        alert("Billing failed.");
     }
  };

  const handleServiceComplete = (updatedInventory: Medicine[], newSale: Sale) => {
    // Merge updated filtered items back into main inventory
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
        <h2 className="text-slate-600 font-medium">Loading PharmaFlow...</h2>
      </div>
    );
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />; 
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-red-50 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  const renderContent = () => {
    const commonServiceProps = {
       inventory: filteredInventory,
       onServiceComplete: handleServiceComplete,
       permissions: permissions,
       activeOrgId: activeOrgContext,
    };

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard 
           inventory={filteredInventory} 
           sales={filteredSales} 
           permissions={permissions} 
           activeOrgId={activeOrgContext} 
        />;
      
      // New Shortcut for Patient Registration
      case AppView.PATIENT_REGISTRATION:
        return <Services 
           {...commonServiceProps} 
           department={AppView.GENERAL_TREATMENT} 
           title="सेवाग्राही दर्ता (Reception)" 
           autoOpenRegistration={true}
        />;
        
      // --- Dynamic Department Services ---
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
        return <Services 
            {...commonServiceProps} 
            department={AppView.COMMUNICABLE} 
            title="Rabies Vaccine Clinic" 
            autoOpenRegistration={true}
            preSelectedService="Rabies Vaccine Registration"
        />;
        
      case AppView.NON_COMMUNICABLE:
        return <Services {...commonServiceProps} department={AppView.NON_COMMUNICABLE} title="Non-Communicable Disease" />;

      // --- End Department Services ---

      case AppView.PATHOLOGY:
        // Note: We use the dedicated Pathology component for the Lab Dashboard.
        // If users want to Register patients for Lab, they can use the "Lab Request" feature inside General Treatment 
        // or we could add a specific registration view here. For now, sticking to the Dashboard view requested earlier.
        if (!permissions.labAccess) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
        return <Pathology />;

      case AppView.INVENTORY:
        if (!permissions.inventoryView) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
        return <Inventory 
          inventory={filteredInventory} 
          onAddMedicine={handleAddMedicine}
          onUpdateMedicine={handleUpdateMedicine}
          onDeleteMedicine={handleDeleteMedicine}
          permissions={permissions}
          activeOrgId={activeOrgContext} 
        />;
      case AppView.POS:
        if (!permissions.posAccess) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
        return <POS 
           inventory={filteredInventory} 
           onProcessSale={handleProcessSale}
           activeOrgId={activeOrgContext}
        />;
      case AppView.SERVICE_BILLING:
         if (!permissions.posAccess) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
         return <ServiceBilling 
            onProcessBilling={handleProcessServiceBilling}
            activeOrgId={activeOrgContext}
         />;
      case AppView.AI_ASSISTANT:
        if (!permissions.aiAccess) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
        return <AIAssistant inventory={filteredInventory} />;
      case AppView.SETTINGS:
        if (!permissions.manageSettings) return <div className="p-8 text-center text-slate-500">Access Denied</div>;
        return <Settings inventory={filteredInventory} sales={filteredSales} currentUser={currentUser} />;
      default:
        return <Dashboard inventory={filteredInventory} sales={filteredSales} permissions={permissions} activeOrgId={activeOrgContext} />;
    }
  };

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
      {renderContent()}
    </Layout>
  );
};

export default App;