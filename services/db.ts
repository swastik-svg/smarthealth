
import { createClient } from '@supabase/supabase-js';
import { Medicine, Sale, User, ServiceRecord, RabiesData, ServiceCatalogItem, LabTest, PrescriptionItem, ServiceItemRequest } from '../types';

// Supabase Configuration
const SUPABASE_URL = 'https://pjokjjjvblkxwzhmheiq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb2tqamp2YmxreHd6aG1oZWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDQwMzMsImV4cCI6MjA4MDY4MDAzM30.tyvqOgQPfZBSUkYjcUpohD6sZXPkRyMZMQf4vv93paA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Table Names
const TABLE_MEDICINES = 'medicines';
const TABLE_SALES = 'sales';
const TABLE_USERS = 'users';
const TABLE_RECORDS = 'serviceRecords';
const TABLE_SERVICES = 'services';

const INITIAL_SERVICES: ServiceCatalogItem[] = [
  // General
  { id: 'srv-1', name: 'OPD Ticket', category: 'GENERAL_TREATMENT', price: 50, isSystem: true },
  { id: 'srv-2', name: 'Emergency Ticket', category: 'GENERAL_TREATMENT', price: 100, isSystem: true },
  
  // X-Ray
  { id: 'xr-1', name: 'X-Ray Chest PA', category: 'X_RAY', price: 350, isSystem: true },
  { id: 'xr-2', name: 'X-Ray Chest Lateral', category: 'X_RAY', price: 350, isSystem: true },
  { id: 'xr-3', name: 'X-Ray Extremities', category: 'X_RAY', price: 300, isSystem: true },
  { id: 'xr-4', name: 'X-Ray Spine', category: 'X_RAY', price: 400, isSystem: true },
  { id: 'xr-5', name: 'X-Ray KUB', category: 'X_RAY', price: 400, isSystem: true },
  
  // USG
  { id: 'usg-1', name: 'USG Abdomen & Pelvis', category: 'USG', price: 800, isSystem: true },
  { id: 'usg-2', name: 'USG Obs (Pregnancy)', category: 'USG', price: 600, isSystem: true },
  { id: 'usg-3', name: 'USG Thyroid/Neck', category: 'USG', price: 700, isSystem: true },
  
  // ECG
  { id: 'ecg-1', name: 'ECG Investigation', category: 'ECG', price: 200, isSystem: true },
  
  // Procedures (DRESSING_MINOR_OT)
  { id: 'proc-1', name: 'Dressing (Small)', category: 'DRESSING_MINOR_OT', price: 100, isSystem: true },
  { id: 'proc-2', name: 'Dressing (Medium)', category: 'DRESSING_MINOR_OT', price: 200, isSystem: true },
  { id: 'proc-3', name: 'Dressing (Large)', category: 'DRESSING_MINOR_OT', price: 300, isSystem: true },
  { id: 'proc-4', name: 'Suturing (Minor)', category: 'DRESSING_MINOR_OT', price: 300, isSystem: true },
  { id: 'proc-5', name: 'Suture Removal', category: 'DRESSING_MINOR_OT', price: 100, isSystem: true },
  { id: 'proc-6', name: 'Nebulization', category: 'DRESSING_MINOR_OT', price: 150, isSystem: true },
  { id: 'proc-7', name: 'Catheterization', category: 'DRESSING_MINOR_OT', price: 500, isSystem: true },
  { id: 'proc-8', name: 'I & D (Abscess)', category: 'DRESSING_MINOR_OT', price: 500, isSystem: true },

  // Vaccines
  { id: 'vac-1', name: 'Anti Rabies Vaccine (ARV)', category: 'IMMUNIZATION', price: 0, isSystem: true },
  { id: 'vac-2', name: 'Tetanus Toxoid (TT)', category: 'IMMUNIZATION', price: 50, isSystem: true },
  { id: 'vac-3', name: 'Rabies Immunoglobulin (RIG)', category: 'IMMUNIZATION', price: 2000, isSystem: true },
];

export const dbService = {
  // Setup real-time subscriptions
  subscribeToChanges(callback: () => void) {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        console.log('Real-time update detected!');
        callback();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },

  async getAllMedicines() {
    const { data, error } = await supabase.from(TABLE_MEDICINES).select('*');
    if (error) {
       // Gracefully handle missing table
       if (error.code === 'PGRST205' || error.code === '42P01' || error.message.includes('Could not find the table')) {
          console.warn(`Table ${TABLE_MEDICINES} missing, returning empty list.`);
          return [];
       }
       throw new Error(error.message);
    }
    return data as Medicine[];
  },

  async addMedicine(medicine: Medicine) {
    const { error } = await supabase.from(TABLE_MEDICINES).insert(medicine);
    if (error) throw new Error(error.message);
    return medicine;
  },

  async updateMedicine(medicine: Medicine) {
    const { error } = await supabase.from(TABLE_MEDICINES).update(medicine).eq('id', medicine.id);
    if (error) throw new Error(error.message);
    return medicine;
  },

  async deleteMedicine(id: string) {
    const { error } = await supabase.from(TABLE_MEDICINES).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getAllSales() {
    const { data, error } = await supabase.from(TABLE_SALES).select('*');
    if (error) {
       if (error.code === 'PGRST205' || error.code === '42P01' || error.message.includes('Could not find the table')) {
          console.warn(`Table ${TABLE_SALES} missing, returning empty list.`);
          return [];
       }
       throw new Error(error.message);
    }
    return data as Sale[];
  },

  async processSale(sale: Sale, updatedMedicines: Medicine[]) {
    // 1. Insert Sale
    const { error: saleError } = await supabase.from(TABLE_SALES).insert(sale);
    if (saleError) throw new Error(saleError.message);

    // 2. Update Inventory (Sequentially for simplicity, ideally RPC)
    for (const med of updatedMedicines) {
      const { error: medError } = await supabase
        .from(TABLE_MEDICINES)
        .update({ stock: med.stock }) // Only update stock to minimize payload
        .eq('id', med.id);
      
      if (medError) console.error("Failed to update stock for", med.name, medError);
    }
  },

  async getAllUsers(retry = false): Promise<User[]> {
    const { data, error } = await supabase.from(TABLE_USERS).select('*');
    if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01' || error.message.includes('Could not find the table')) {
           console.warn(`Table ${TABLE_USERS} missing, returning empty list.`);
           return [];
        }
        throw new Error(`Users Table Error: ${error.message}`);
    }
    
    // Check if empty, seed Admin
    if ((!data || data.length === 0) && !retry) {
       console.log("No users found, attempting to seed admin...");
       const seeded = await this.seedAdmin();
       if (seeded) {
          // If seeding successful, retry fetching once
          return await this.getAllUsers(true);
       } else {
          // If seeding failed, return empty to prevent infinite loop
          return [];
       }
    }
    return data as User[];
  },

  async seedAdmin() {
     const adminUser = {
        username: 'admin',
        password: 'admin',
        role: 'SUPER_ADMIN', 
        created: Date.now(),
        permissions: {
           inventoryView: true, inventoryAdd: true, inventoryEdit: true, inventoryDelete: true,
           posAccess: true, clinicAccess: true, patientRegister: true, doctorConsultation: true, viewPatientHistory: true,
           accessGeneralTreatment: true, accessPathology: true, accessXRay: true, accessUSG: true, accessECG: true,
           accessDressing: true, accessMCH: true, accessImmunization: true, accessTB: true, accessNutrition: true,
           accessCBIMNCI: true, accessCommunicable: true, accessRabies: true, accessNonCommunicable: true,
           viewFinancials: true, viewReports: true, manageSettings: true, manageUsers: true, aiAccess: true,
           settings_General: true, settings_Rates: true, settings_Users: true, settings_Data: true
        },
        organizationId: 'MAIN'
     };
     const { error } = await supabase.from(TABLE_USERS).insert(adminUser);
     
     if (error) {
         console.error("Error seeding admin user:", error.message);
         return false;
     }
     return true;
  },

  async getUser(username: string) {
    const { data, error } = await supabase.from(TABLE_USERS).select('*').eq('username', username).single();
    if (error) return null;
    return data as User;
  },

  async authenticateUser(username: string, password: string) {
    try {
        const { data, error } = await supabase
          .from(TABLE_USERS)
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .maybeSingle();
          
        if (error) {
            console.error("Auth Check Error:", JSON.stringify(error));
            // Detect missing table error specifically (PGRST205 is "relation not found" in PostgREST)
            if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('Could not find the table')) {
                throw new Error("Database tables not found. Please run the SQL setup script in Supabase.");
            }
            throw new Error("Connection failed: " + error.message);
        }

        // AUTO-HEALING: If no user found, but trying to login as admin, check if DB is empty
        if (!data && username === 'admin' && password === 'admin') {
            console.log("Admin login failed. Checking if database is empty...");
            const { count, error: countError } = await supabase.from(TABLE_USERS).select('*', { count: 'exact', head: true });
            
            if (countError) {
               if (countError.code === 'PGRST205' || countError.code === '42P01' || countError.message?.includes('Could not find the table')) {
                   throw new Error("Database tables not found. Please run the SQL setup script.");
               }
            }

            if (count === 0) {
                console.log("Database empty. Auto-seeding admin user...");
                const seeded = await this.seedAdmin();
                if (seeded) {
                    // Retry auth immediately
                    const { data: retryData } = await supabase
                      .from(TABLE_USERS)
                      .select('*')
                      .eq('username', 'admin')
                      .single();
                    return retryData as User;
                }
            }
        }
        
        return data as User;
    } catch (e: any) {
        console.error("Auth Exception:", e.message);
        throw e;
    }
  },
  
  async createUser(username: string, password: string, role: string, organizationId: string, fullName?: string, designation?: string, phoneNumber?: string) {
     const permissions = {
         inventoryView: true, inventoryAdd: role !== 'USER', inventoryEdit: role !== 'USER', inventoryDelete: role !== 'USER',
         posAccess: true, clinicAccess: true, patientRegister: true, doctorConsultation: true, viewPatientHistory: true,
         accessGeneralTreatment: true, accessPathology: true, accessXRay: true, accessUSG: true, accessECG: true,
         accessDressing: true, accessMCH: true, accessImmunization: true, accessTB: true, accessNutrition: true,
         accessCBIMNCI: true, accessCommunicable: true, accessRabies: true, accessNonCommunicable: true,
         viewFinancials: role !== 'USER', viewReports: role !== 'USER', manageSettings: role === 'SUPER_ADMIN', manageUsers: role !== 'USER', aiAccess: true,
         settings_General: role === 'SUB_ADMIN', settings_Rates: role === 'SUB_ADMIN', settings_Users: role === 'SUB_ADMIN', settings_Data: false
     };

     const { error } = await supabase.from(TABLE_USERS).insert({
        username, password, role, organizationId, created: Date.now(), permissions,
        fullName, designation, phoneNumber
     });
     if (error) throw new Error(error.message);
  },
  
  async updateUserPassword(username: string, current: string, newPass: string) {
     const user = await this.getUser(username);
     if (!user || user.password !== current) throw new Error("Invalid password");
     
     const { error } = await supabase.from(TABLE_USERS).update({ password: newPass }).eq('username', username);
     if (error) throw new Error(error.message);
  },

  async deleteUser(username: string) {
     const { error } = await supabase.from(TABLE_USERS).delete().eq('username', username);
     if (error) throw new Error(error.message);
  },
  
  async updateUserPermissions(username: string, permissions: any) {
     const { error } = await supabase.from(TABLE_USERS).update({ permissions }).eq('username', username);
     if (error) throw new Error(error.message);
  },

  async getAllServiceRecords() {
    const { data, error } = await supabase.from(TABLE_RECORDS).select('*');
    if (error) {
       if (error.code === 'PGRST205' || error.code === '42P01' || error.message.includes('Could not find the table')) {
          console.warn(`Table ${TABLE_RECORDS} missing, returning empty list.`);
          return [];
       }
       throw new Error(error.message);
    }
    return data as ServiceRecord[];
  },

  async addServiceRecord(record: ServiceRecord) {
    const { error } = await supabase.from(TABLE_RECORDS).insert(record);
    if (error) throw new Error(error.message);
  },
  
  async completeConsultation(id: string, diagnosis: string, findings: string, prescription: PrescriptionItem[], labRequests: LabTest[], serviceRequests: ServiceItemRequest[]) {
     const updates = {
       diagnosis,
       findings,
       prescription,
       labRequests,
       serviceRequests,
       status: 'COMPLETED',
       prescriptionStatus: prescription.length > 0 ? 'PENDING' : 'BILLED'
     };
     
     const { error } = await supabase.from(TABLE_RECORDS).update(updates).eq('id', id);
     if (error) throw new Error(error.message);
     
     return { updatedInventory: [], newSale: null }; 
  },

  async getAllServices() {
     const { data, error } = await supabase.from(TABLE_SERVICES).select('*');
     if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01' || error.message.includes('Could not find the table')) {
           console.warn(`Table ${TABLE_SERVICES} missing, attempting to seed.`);
           // We can't insert if table is missing, so just return default list to UI
           return INITIAL_SERVICES;
        }
        throw new Error(error.message);
     }
     
     // Seed Services if empty
     if (!data || data.length === 0) {
        const { error: seedError } = await supabase.from(TABLE_SERVICES).insert(INITIAL_SERVICES);
        if (!seedError) return INITIAL_SERVICES;
     }
     
     return data as ServiceCatalogItem[];
  },
  
  async addServiceCatalogItem(item: ServiceCatalogItem) {
     const { error } = await supabase.from(TABLE_SERVICES).insert(item);
     if (error) throw new Error(error.message);
  },
  
  async updateServiceCatalogItem(item: ServiceCatalogItem) {
     const { error } = await supabase.from(TABLE_SERVICES).update(item).eq('id', item.id);
     if (error) throw new Error(error.message);
  },
  
  async updateLabResults(recordId: string, updatedTests: LabTest[]) {
     const { error } = await supabase.from(TABLE_RECORDS).update({ labRequests: updatedTests }).eq('id', recordId);
     if (error) throw new Error(error.message);
  },

  async updateRabiesRecord(recordId: string, rabiesData: RabiesData, age?: number, gender?: string) {
     const updates: any = {
        rabiesData,
        status: 'COMPLETED'
     };
     if (age !== undefined && age > 0) updates.age = age;
     if (gender !== undefined && gender !== '') updates.gender = gender;

     const { error } = await supabase.from(TABLE_RECORDS).update(updates).eq('id', recordId);
     if (error) throw new Error(error.message);
  },

  async markRequestsAsBilled(recordId: string, requestIds: string[], billPrescription: boolean = false) {
     // First fetch the record to update nested arrays
     const { data, error: fetchError } = await supabase.from(TABLE_RECORDS).select('*').eq('id', recordId).single();
     if (fetchError) throw new Error(fetchError.message);
     
     const record = data as ServiceRecord;
     const updates: any = {};

     if (record.serviceRequests) {
        updates.serviceRequests = record.serviceRequests.map(req => {
           if (requestIds.includes(req.id)) { return { ...req, status: 'BILLED' }; }
           return req;
        });
     }
     if (record.labRequests) {
        updates.labRequests = record.labRequests.map(req => {
           if (requestIds.includes(req.id)) { return { ...req, billingStatus: 'PAID' }; }
           return req;
        });
     }
     if (billPrescription) { updates.prescriptionStatus = 'BILLED'; }
     
     const { error } = await supabase.from(TABLE_RECORDS).update(updates).eq('id', recordId);
     if (error) throw new Error(error.message);
  }
};
