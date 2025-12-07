
import { Medicine, Sale, User, UserPermissions, UserRole, ServiceRecord, ServiceStatus, PrescriptionItem, CartItem, LabTest, ServiceItemRequest, ServiceCatalogItem, AppView, RabiesData } from '../types';

const DB_NAME = 'PharmaFlowDB';
const DB_VERSION = 5; 
const STORE_INVENTORY = 'inventory';
const STORE_SALES = 'sales';
const STORE_USERS = 'users';
const STORE_SERVICE_RECORDS = 'service_records';
const STORE_SERVICES_CATALOG = 'services_catalog';

const INITIAL_MEDICINES: Medicine[] = [
  { id: '1', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Tablets', price: 5.00, stock: 150, minStockLevel: 20, batchNumber: 'BTC-001', expiryDate: '2025-12-31', organizationId: 'MAIN' },
  { id: '2', name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'Tablets', price: 12.50, stock: 8, minStockLevel: 15, batchNumber: 'BTC-002', expiryDate: '2024-06-30', organizationId: 'MAIN' },
  { id: '3', name: 'Cough Syrup', genericName: 'Dextromethorphan', category: 'Syrup', price: 8.99, stock: 45, minStockLevel: 10, batchNumber: 'BTC-003', expiryDate: '2025-05-15', organizationId: 'MAIN' },
  { id: '4', name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'Tablets', price: 6.50, stock: 200, minStockLevel: 30, batchNumber: 'BTC-004', expiryDate: '2026-01-20', organizationId: 'MAIN' },
  { id: '5', name: 'Bandages', genericName: 'Adhesive Bandage', category: 'Equipment', price: 3.00, stock: 5, minStockLevel: 20, batchNumber: 'EQ-101', expiryDate: '2028-12-31', organizationId: 'MAIN' },
];

const INITIAL_SERVICES: ServiceCatalogItem[] = [
    // GENERAL / OPD
    { id: 'gen-1', name: 'General Consultation', category: AppView.GENERAL_TREATMENT, price: 50, duration: '15 mins', description: 'Basic health checkup.' },
    { id: 'gen-2', name: 'Follow-up', category: AppView.GENERAL_TREATMENT, price: 30, duration: '10 mins', description: 'Review visit.' },
    { id: 'gen-3', name: 'Emergency Check', category: AppView.GENERAL_TREATMENT, price: 100, duration: '20 mins', description: 'Urgent care.' },
    { id: 'gen-4', name: 'OPD Ticket (New)', category: 'HOSPITAL', price: 50 },
    { id: 'gen-5', name: 'OPD Ticket (Follow-up)', category: 'HOSPITAL', price: 30 },

    // HOSPITAL CHARGES
    { id: 'hosp-1', name: 'Bed Charge (General)', category: 'HOSPITAL', price: 200 },
    { id: 'hosp-2', name: 'Bed Charge (Cabin)', category: 'HOSPITAL', price: 1000 },
    { id: 'hosp-3', name: 'Ambulance Service', category: 'HOSPITAL', price: 1000 },
    { id: 'hosp-4', name: 'Oxygen Charge (Per Hour)', category: 'HOSPITAL', price: 100 },

    // X-RAY
    { id: 'rad-1', name: 'Chest X-Ray', category: AppView.X_RAY, price: 350, duration: '10 mins' },
    { id: 'rad-2', name: 'X-Ray Limbs', category: AppView.X_RAY, price: 300, duration: '15 mins' },
    { id: 'rad-3', name: 'X-Ray Spine', category: AppView.X_RAY, price: 450, duration: '20 mins' },
    
    // USG
    { id: 'usg-1', name: 'Abdomen USG', category: AppView.USG, price: 600, duration: '20 mins' },
    { id: 'usg-2', name: 'Pelvic USG', category: AppView.USG, price: 550, duration: '15 mins' },
    { id: 'usg-3', name: 'Obstetric USG', category: AppView.USG, price: 600, duration: '20 mins' },
    
    // ECG
    { id: 'ecg-1', name: 'Standard ECG', category: AppView.ECG, price: 250, duration: '10 mins' },

    // LAB
    { id: 'lab-1', name: 'CBC (Complete Blood Count)', category: 'LAB', price: 400 },
    { id: 'lab-2', name: 'Blood Grouping', category: 'LAB', price: 100 },
    { id: 'lab-3', name: 'Blood Sugar (F/PP/R)', category: 'LAB', price: 100 },
    { id: 'lab-4', name: 'Urine R/E', category: 'LAB', price: 150 },
    { id: 'lab-5', name: 'Stool R/E', category: 'LAB', price: 150 },
    { id: 'lab-6', name: 'Lipid Profile', category: 'LAB', price: 800 },
    { id: 'lab-7', name: 'Liver Function Test (LFT)', category: 'LAB', price: 900 },
    { id: 'lab-8', name: 'Renal Function Test (RFT)', category: 'LAB', price: 800 },
    { id: 'lab-9', name: 'Thyroid Profile', category: 'LAB', price: 1200 },
    { id: 'lab-10', name: 'Uric Acid', category: 'LAB', price: 250 },
    { id: 'lab-11', name: 'Widal Test', category: 'LAB', price: 300 },
    { id: 'lab-12', name: 'HIV I/II', category: 'LAB', price: 450 },

    // PROCEDURES
    { id: 'proc-1', name: 'Simple Dressing', category: AppView.DRESSING_MINOR_OT, price: 100, duration: '15 mins' },
    { id: 'proc-2', name: 'Stitch Removal', category: AppView.DRESSING_MINOR_OT, price: 150, duration: '10 mins' },
    
    // FREE SERVICES
    { id: 'imm-1', name: 'BCG Vaccine', category: AppView.IMMUNIZATION, price: 0, duration: '5 mins' },
    { id: 'imm-2', name: 'DPT-HepB-Hib', category: AppView.IMMUNIZATION, price: 0, duration: '5 mins' },
    { id: 'imm-3', name: 'Anti Rabies Vaccination', category: AppView.IMMUNIZATION, price: 0, duration: '5 mins' },
    { id: 'comm-1', name: 'Rabies Vaccine Registration', category: AppView.COMMUNICABLE, price: 0, duration: '5 mins' }
];

const DEFAULT_PERMISSIONS: UserPermissions = {
  inventoryView: true,
  inventoryAdd: true,
  inventoryEdit: true,
  inventoryDelete: true,
  posAccess: true,
  clinicAccess: true,
  patientRegister: true,
  doctorConsultation: true,
  viewPatientHistory: true,
  
  // New Granular Permissions
  accessPathology: true,
  accessGeneralTreatment: true,
  accessXRay: true,
  accessUSG: true,
  accessECG: true,
  accessDressing: true,
  accessMCH: true,
  accessImmunization: true,
  accessTB: true,
  accessNutrition: true,
  accessCBIMNCI: true,
  accessCommunicable: true,
  accessRabies: true,
  accessNonCommunicable: true,

  viewFinancials: true,
  viewReports: true,
  manageSettings: true,
  manageUsers: true,
  aiAccess: true,

  // Settings Granular
  settings_General: true,
  settings_Rates: true,
  settings_Users: true,
  settings_Data: true
};

const normalizePermissions = (perms: any): UserPermissions => {
  if ('viewReports' in perms) return perms as UserPermissions;
  // Migration logic: give access if admin or has financials view
  return {
     ...DEFAULT_PERMISSIONS,
     ...perms,
     viewReports: perms.viewFinancials || false
  }; 
};

export const dbService = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("Database error:", (event.target as any).error);
        reject((event.target as any).error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_INVENTORY)) {
          const inventoryStore = db.createObjectStore(STORE_INVENTORY, { keyPath: 'id' });
          INITIAL_MEDICINES.forEach(med => inventoryStore.add(med));
        }
        if (!db.objectStoreNames.contains(STORE_SALES)) {
          db.createObjectStore(STORE_SALES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_USERS)) {
          const usersStore = db.createObjectStore(STORE_USERS, { keyPath: 'username' });
          usersStore.add({ 
            username: 'admin', 
            password: 'admin', 
            created: Date.now(),
            permissions: DEFAULT_PERMISSIONS,
            role: UserRole.SUPER_ADMIN,
            organizationId: 'MAIN',
            fullName: 'Super Administrator',
            designation: 'System Admin',
            phoneNumber: ''
          });
        }
        if (!db.objectStoreNames.contains(STORE_SERVICE_RECORDS)) {
          db.createObjectStore(STORE_SERVICE_RECORDS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SERVICES_CATALOG)) {
          const servicesStore = db.createObjectStore(STORE_SERVICES_CATALOG, { keyPath: 'id' });
          INITIAL_SERVICES.forEach(svc => servicesStore.add(svc));
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
    });
  },

  getAllMedicines: async (): Promise<Medicine[]> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_INVENTORY], 'readonly');
      const store = transaction.objectStore(STORE_INVENTORY);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  getAllSales: async (): Promise<Sale[]> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SALES], 'readonly');
      const store = transaction.objectStore(STORE_SALES);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  addMedicine: async (medicine: Medicine): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_INVENTORY], 'readwrite');
      const store = transaction.objectStore(STORE_INVENTORY);
      const request = store.add(medicine);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  updateMedicine: async (medicine: Medicine): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_INVENTORY], 'readwrite');
      const store = transaction.objectStore(STORE_INVENTORY);
      const request = store.put(medicine);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  deleteMedicine: async (id: string): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_INVENTORY], 'readwrite');
      const store = transaction.objectStore(STORE_INVENTORY);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  processSale: async (sale: Sale, updatedInventoryItems: Medicine[]): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SALES, STORE_INVENTORY, STORE_SERVICE_RECORDS], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      const salesStore = transaction.objectStore(STORE_SALES);
      salesStore.add(sale);

      const inventoryStore = transaction.objectStore(STORE_INVENTORY);
      updatedInventoryItems.forEach(item => {
        inventoryStore.put(item);
      });

      // AUTO-REGISTER FOR RABIES IF APPLICABLE
      const hasRabiesVaccine = sale.items.some(
         item => item.name.toLowerCase().includes('rabies') || item.name.toLowerCase().includes('arv')
      );

      if (hasRabiesVaccine && sale.customerName) {
         const recordStore = transaction.objectStore(STORE_SERVICE_RECORDS);
         
         // Extract Patient ID if present in format "Name (ID)"
         let patientId = `WALKIN-${Date.now()}`;
         let patientName = sale.customerName;
         const match = sale.customerName.match(/(.*)\s\((.*)\)/);
         if (match) {
            patientName = match[1];
            patientId = match[2];
         }
         
         // Only add if we can find a matching service record OR create a dummy one for the queue
         // For now, let's create a new queue entry specifically for Rabies Clinic
         const rabiesRecord: ServiceRecord = {
            id: crypto.randomUUID(),
            patientId: patientId,
            patientName: patientName,
            age: 0, // Placeholder - User must update in clinic
            address: 'See Billing',
            contactNo: '',
            gender: 'Unknown', // Placeholder
            ethnicity: '',
            serviceType: 'Rabies Vaccine Registration',
            department: AppView.COMMUNICABLE, // This ensures it shows in Rabies/Communicable view
            cost: 0,
            timestamp: Date.now(),
            status: 'PENDING',
            queueNumber: Math.floor(Math.random() * 100),
            organizationId: sale.organizationId
         };
         
         // Check if this patient already has a pending record today to avoid dupes
         // (Simple logic: just add it, user can merge/process)
         recordStore.add(rabiesRecord);
      }
    });
  },

  authenticateUser: async (username: string, password: string): Promise<User | null> => {
    const db = await dbService.open();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_USERS], 'readonly');
      const store = transaction.objectStore(STORE_USERS);
      const request = store.get(username);
      request.onsuccess = () => {
        const user = request.result;
        if (user && user.password === password) {
          user.permissions = normalizePermissions(user.permissions || {});
          if (!user.role) user.role = user.username === 'admin' ? UserRole.SUPER_ADMIN : UserRole.USER;
          if (!user.organizationId) user.organizationId = 'MAIN';
          resolve(user);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  },

  getUser: async (username: string): Promise<User | null> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_USERS], 'readonly');
      const store = transaction.objectStore(STORE_USERS);
      const request = store.get(username);
      request.onsuccess = () => {
         const user = request.result;
         if (user) {
            user.permissions = normalizePermissions(user.permissions || {});
            if (!user.role) user.role = user.username === 'admin' ? UserRole.SUPER_ADMIN : UserRole.USER;
            if (!user.organizationId) user.organizationId = 'MAIN';
         }
         resolve(user);
      };
      request.onerror = () => reject(request.error);
    });
  },

  createUser: async (username: string, password: string, role: UserRole = UserRole.USER, organizationId?: string, fullName?: string, designation?: string, phoneNumber?: string): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_USERS], 'readwrite');
      const store = transaction.objectStore(STORE_USERS);
      let basicPermissions: UserPermissions = {
         ...DEFAULT_PERMISSIONS,
         inventoryDelete: false,
         manageSettings: false,
         manageUsers: false,
         viewFinancials: false,
         viewReports: false,
         settings_General: false,
         settings_Rates: false,
         settings_Users: false,
         settings_Data: false
      };
      if (role === UserRole.SUB_ADMIN) {
         basicPermissions = {
            ...DEFAULT_PERMISSIONS,
            manageUsers: true,
            manageSettings: true, 
            viewReports: true,
            settings_General: false, 
            settings_Rates: true,
            settings_Users: true,
            settings_Data: true,
            inventoryDelete: false
         };
      }
      const request = store.add({ 
        username, password, created: Date.now(), permissions: basicPermissions, role, organizationId: organizationId || 'MAIN', fullName: fullName || '', designation: designation || '', phoneNumber: phoneNumber || ''
      });
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as any).error);
    });
  },

  deleteUser: async (username: string): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_USERS], 'readwrite');
      const store = transaction.objectStore(STORE_USERS);
      const request = store.delete(username);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as any).error);
    });
  },

  getAllUsers: async (): Promise<User[]> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_USERS], 'readonly');
      const store = transaction.objectStore(STORE_USERS);
      const request = store.getAll();
      request.onsuccess = () => {
        const users = request.result as User[];
        const safeUsers = users.map(u => ({
            ...u,
            permissions: normalizePermissions(u.permissions || {}),
            role: u.role || (u.username === 'admin' ? UserRole.SUPER_ADMIN : UserRole.USER),
            organizationId: u.organizationId || 'MAIN',
            password: ''
        }));
        resolve(safeUsers);
      };
      request.onerror = () => reject(request.error);
    });
  },

  updateUserPermissions: async (username: string, permissions: UserPermissions): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_USERS], 'readwrite');
      const store = transaction.objectStore(STORE_USERS);
      const getReq = store.get(username);
      getReq.onsuccess = () => {
        const user = getReq.result;
        if (!user) { reject('User not found'); return; }
        user.permissions = permissions;
        const putReq = store.put(user);
        putReq.onsuccess = () => resolve();
        putReq.onerror = (e) => reject((e.target as any).error);
      };
    });
  },

  updateUserPassword: async (username: string, oldPassword: string, newPassword: string): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_USERS], 'readwrite');
      const store = transaction.objectStore(STORE_USERS);
      const getRequest = store.get(username);
      getRequest.onsuccess = () => {
        const user = getRequest.result;
        if (!user || user.password !== oldPassword) { reject(new Error("Invalid current password")); return; }
        const updatedUser = { ...user, password: newPassword };
        const putRequest = store.put(updatedUser);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject((e.target as any).error);
      };
      getRequest.onerror = (e) => reject((e.target as any).error);
    });
  },

  getAllServices: async (): Promise<ServiceCatalogItem[]> => {
     const db = await dbService.open();
     return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SERVICES_CATALOG], 'readonly');
        const store = transaction.objectStore(STORE_SERVICES_CATALOG);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
     });
  },

  addServiceCatalogItem: async (item: ServiceCatalogItem): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SERVICES_CATALOG], 'readwrite');
      const store = transaction.objectStore(STORE_SERVICES_CATALOG);
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  updateServicePrice: async (id: string, price: number): Promise<void> => {
     const db = await dbService.open();
     return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SERVICES_CATALOG], 'readwrite');
        const store = transaction.objectStore(STORE_SERVICES_CATALOG);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
           const item = getReq.result;
           if (!item) { reject("Item not found"); return; }
           item.price = price;
           const putReq = store.put(item);
           putReq.onsuccess = () => resolve();
           putReq.onerror = (e) => reject((e.target as any).error);
        };
        getReq.onerror = (e) => reject((e.target as any).error);
     });
  },

  updateServiceCatalogItem: async (item: ServiceCatalogItem): Promise<void> => {
     const db = await dbService.open();
     return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SERVICES_CATALOG], 'readwrite');
        const store = transaction.objectStore(STORE_SERVICES_CATALOG);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as any).error);
     });
  },

  addServiceRecord: async (record: ServiceRecord): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SERVICE_RECORDS], 'readwrite');
      const store = transaction.objectStore(STORE_SERVICE_RECORDS);
      const request = store.add(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  getAllServiceRecords: async (): Promise<ServiceRecord[]> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SERVICE_RECORDS], 'readonly');
      const store = transaction.objectStore(STORE_SERVICE_RECORDS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  updateServiceStatus: async (id: string, status: ServiceStatus, findings?: string): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SERVICE_RECORDS], 'readwrite');
      const store = transaction.objectStore(STORE_SERVICE_RECORDS);
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (!record) { reject('Record not found'); return; }
        record.status = status;
        if (findings !== undefined) record.findings = findings;
        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject((e.target as any).error);
      };
    });
  },

  updateLabResults: async (recordId: string, updatedLabTests: LabTest[]): Promise<void> => {
     const db = await dbService.open();
     return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SERVICE_RECORDS], 'readwrite');
        const store = transaction.objectStore(STORE_SERVICE_RECORDS);
        const getReq = store.get(recordId);
        getReq.onsuccess = () => {
           const record = getReq.result;
           if (!record) { reject("Record not found"); return; }
           record.labRequests = updatedLabTests;
           store.put(record);
           resolve();
        };
        getReq.onerror = () => reject(getReq.error);
     });
  },

  completeConsultation: async (recordId: string, diagnosis: string, findings: string, prescription: PrescriptionItem[], labRequests: LabTest[] = [], serviceRequests: ServiceItemRequest[] = []): Promise<{ updatedInventory: Medicine[], newSale: Sale | null }> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SERVICE_RECORDS, STORE_INVENTORY, STORE_SALES], 'readwrite');
      const recordStore = transaction.objectStore(STORE_SERVICE_RECORDS);
      const inventoryStore = transaction.objectStore(STORE_INVENTORY);
      const getRecord = recordStore.get(recordId);
      getRecord.onsuccess = () => {
        const record: ServiceRecord = getRecord.result;
        if (!record) { reject("Service Record Not Found"); return; }
        const medicineCost = prescription.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalBill = record.cost + medicineCost;
        record.status = 'COMPLETED';
        record.diagnosis = diagnosis;
        record.findings = findings;
        record.prescription = prescription;
        if (prescription.length > 0) { record.prescriptionStatus = 'PENDING'; } else { record.prescriptionStatus = 'BILLED'; }
        record.labRequests = labRequests;
        record.serviceRequests = serviceRequests;
        record.totalBill = totalBill;
        recordStore.put(record);
        const getAll = inventoryStore.getAll();
        getAll.onsuccess = () => { resolve({ updatedInventory: getAll.result, newSale: null }); };
      };
      transaction.onerror = (e) => reject((e.target as any).error);
    });
  },
  
  // Specific Method to update Rabies Record - simplified to update only data and status
  updateRabiesRecord: async (recordId: string, rabiesData: RabiesData): Promise<void> => {
     const db = await dbService.open();
     return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SERVICE_RECORDS], 'readwrite');
        const store = transaction.objectStore(STORE_SERVICE_RECORDS);
        const getReq = store.get(recordId);
        getReq.onsuccess = () => {
           const record = getReq.result;
           if (!record) { reject("Record not found"); return; }
           record.rabiesData = rabiesData;
           record.status = 'COMPLETED';
           store.put(record);
           resolve();
        };
        getReq.onerror = (e) => reject((e.target as any).error);
     });
  },

  markRequestsAsBilled: async (recordId: string, requestIds: string[], billPrescription: boolean = false): Promise<void> => {
     const db = await dbService.open();
     return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SERVICE_RECORDS], 'readwrite');
        const store = transaction.objectStore(STORE_SERVICE_RECORDS);
        const getReq = store.get(recordId);
        getReq.onsuccess = () => {
           const record: ServiceRecord = getReq.result;
           if (!record) { resolve(); return; }
           if (record.serviceRequests) {
              record.serviceRequests = record.serviceRequests.map(req => {
                 if (requestIds.includes(req.id)) { return { ...req, status: 'BILLED' }; }
                 return req;
              });
           }
           if (record.labRequests) {
              record.labRequests = record.labRequests.map(req => {
                 if (requestIds.includes(req.id)) { return { ...req, billingStatus: 'PAID' }; }
                 return req;
              });
           }
           if (billPrescription) { record.prescriptionStatus = 'BILLED'; }
           store.put(record);
           resolve();
        };
        getReq.onerror = () => reject(getReq.error);
     });
  }
};
