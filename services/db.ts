

import { Medicine, Sale, User, UserPermissions, UserRole, ServiceRecord, ServiceStatus, PrescriptionItem, CartItem, LabTest, ServiceItemRequest } from '../types';

const DB_NAME = 'PharmaFlowDB';
const DB_VERSION = 4; 
const STORE_INVENTORY = 'inventory';
const STORE_SALES = 'sales';
const STORE_USERS = 'users';
const STORE_SERVICE_RECORDS = 'service_records';

const INITIAL_MEDICINES: Medicine[] = [
  { id: '1', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Tablets', price: 5.00, stock: 150, minStockLevel: 20, batchNumber: 'BTC-001', expiryDate: '2025-12-31', organizationId: 'MAIN' },
  { id: '2', name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'Tablets', price: 12.50, stock: 8, minStockLevel: 15, batchNumber: 'BTC-002', expiryDate: '2024-06-30', organizationId: 'MAIN' },
  { id: '3', name: 'Cough Syrup', genericName: 'Dextromethorphan', category: 'Syrup', price: 8.99, stock: 45, minStockLevel: 10, batchNumber: 'BTC-003', expiryDate: '2025-05-15', organizationId: 'MAIN' },
  { id: '4', name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'Tablets', price: 6.50, stock: 200, minStockLevel: 30, batchNumber: 'BTC-004', expiryDate: '2026-01-20', organizationId: 'MAIN' },
  { id: '5', name: 'Bandages', genericName: 'Adhesive Bandage', category: 'Equipment', price: 3.00, stock: 5, minStockLevel: 20, batchNumber: 'EQ-101', expiryDate: '2028-12-31', organizationId: 'MAIN' },
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
  labAccess: true,
  viewFinancials: true,
  manageSettings: true,
  manageUsers: true,
  aiAccess: true
};

const normalizePermissions = (perms: any): UserPermissions => {
  if ('inventoryView' in perms) return perms as UserPermissions;
  return {
    inventoryView: true,
    inventoryAdd: perms.canManageInventory || false,
    inventoryEdit: perms.canManageInventory || false,
    inventoryDelete: perms.canManageInventory || false,
    posAccess: true,
    clinicAccess: true,
    patientRegister: true,
    doctorConsultation: true,
    viewPatientHistory: true,
    labAccess: true,
    viewFinancials: perms.canViewReports || false,
    manageSettings: perms.canManageSettings || false,
    manageUsers: perms.canManageUsers || false,
    aiAccess: true
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
            organizationId: 'MAIN'
          });
        }

        if (!db.objectStoreNames.contains(STORE_SERVICE_RECORDS)) {
          db.createObjectStore(STORE_SERVICE_RECORDS, { keyPath: 'id' });
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
      const transaction = db.transaction([STORE_SALES, STORE_INVENTORY], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      const salesStore = transaction.objectStore(STORE_SALES);
      salesStore.add(sale);

      const inventoryStore = transaction.objectStore(STORE_INVENTORY);
      updatedInventoryItems.forEach(item => {
        inventoryStore.put(item);
      });
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
          if (!user.role) {
             user.role = user.username === 'admin' ? UserRole.SUPER_ADMIN : UserRole.USER;
          }
          if (!user.organizationId) {
             user.organizationId = 'MAIN';
          }
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

  createUser: async (username: string, password: string, role: UserRole = UserRole.USER, organizationId?: string): Promise<void> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_USERS], 'readwrite');
      const store = transaction.objectStore(STORE_USERS);
      
      let basicPermissions: UserPermissions = {
         ...DEFAULT_PERMISSIONS,
         inventoryDelete: false,
         manageSettings: false,
         manageUsers: false,
         viewFinancials: false
      };

      if (role === UserRole.SUB_ADMIN) {
         basicPermissions = {
            ...DEFAULT_PERMISSIONS,
            manageUsers: true,
            manageSettings: false,
            inventoryDelete: false
         };
      }

      const request = store.add({ 
        username, 
        password, 
        created: Date.now(),
        permissions: basicPermissions,
        role,
        organizationId: organizationId || 'MAIN'
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
        if (!user) {
          reject('User not found');
          return;
        }
        
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
        if (!user || user.password !== oldPassword) {
           reject(new Error("Invalid current password"));
           return;
        }

        const updatedUser = { ...user, password: newPassword };
        const putRequest = store.put(updatedUser);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject((e.target as any).error);
      };
      
      getRequest.onerror = (e) => reject((e.target as any).error);
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
        if (!record) {
           reject('Record not found');
           return;
        }

        record.status = status;
        if (findings !== undefined) {
          record.findings = findings;
        }
        
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
           if (!record) {
              reject("Record not found");
              return;
           }
           
           record.labRequests = updatedLabTests;
           store.put(record);
           resolve();
        };
        getReq.onerror = () => reject(getReq.error);
     });
  },

  completeConsultation: async (
    recordId: string, 
    diagnosis: string, 
    findings: string,
    prescription: PrescriptionItem[],
    labRequests: LabTest[] = [],
    serviceRequests: ServiceItemRequest[] = []
  ): Promise<{ updatedInventory: Medicine[], newSale: Sale | null }> => {
    const db = await dbService.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SERVICE_RECORDS, STORE_INVENTORY, STORE_SALES], 'readwrite');
      
      const recordStore = transaction.objectStore(STORE_SERVICE_RECORDS);
      const inventoryStore = transaction.objectStore(STORE_INVENTORY);

      const getRecord = recordStore.get(recordId);

      getRecord.onsuccess = () => {
        const record: ServiceRecord = getRecord.result;
        if (!record) {
          reject("Service Record Not Found");
          return;
        }

        const medicineCost = prescription.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalBill = record.cost + medicineCost;

        record.status = 'COMPLETED';
        record.diagnosis = diagnosis;
        record.findings = findings;
        record.prescription = prescription;
        
        // Init prescription status
        if (prescription.length > 0) {
           record.prescriptionStatus = 'PENDING';
        } else {
           record.prescriptionStatus = 'BILLED'; // Nothing to bill
        }

        record.labRequests = labRequests;
        record.serviceRequests = serviceRequests;
        record.totalBill = totalBill;

        recordStore.put(record);

        // We do NOT deduct stock or create sale here anymore.
        // It happens in ServiceBilling via processSale
        
        // Return current inventory as we didn't change it
        const getAll = inventoryStore.getAll();
        getAll.onsuccess = () => {
           resolve({ updatedInventory: getAll.result, newSale: null });
        };
      };

      transaction.onerror = (e) => reject((e.target as any).error);
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

           // Mark Service Requests as BILLED
           if (record.serviceRequests) {
              record.serviceRequests = record.serviceRequests.map(req => {
                 if (requestIds.includes(req.id)) {
                    return { ...req, status: 'BILLED' };
                 }
                 return req;
              });
           }

           // Mark Lab Requests as PAID
           if (record.labRequests) {
              record.labRequests = record.labRequests.map(req => {
                 if (requestIds.includes(req.id)) {
                    return { ...req, billingStatus: 'PAID' };
                 }
                 return req;
              });
           }

           // Mark Prescription as BILLED
           if (billPrescription) {
              record.prescriptionStatus = 'BILLED';
           }
           
           store.put(record);
           resolve();
        };
        getReq.onerror = () => reject(getReq.error);
     });
  }
};
