

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  batchNumber: string;
  expiryDate: string;
  price: number;
  stock: number;
  minStockLevel: number;
  description?: string;
  organizationId?: string; // Links item to specific branch
}

export interface CartItem extends Medicine {
  quantity: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: CartItem[];
  totalAmount: number;
  customerName?: string;
  serviceId?: string; // Link sale to a service if applicable
  organizationId?: string;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  lowStockCount: number;
  expiredCount: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PATIENT_REGISTRATION = 'PATIENT_REGISTRATION', // New shortcut view
  
  // Service Parent (Virtual)
  SERVICES_PARENT = 'SERVICES_PARENT',
  
  // Specific Departments
  PATHOLOGY = 'PATHOLOGY', // Lab Dashboard
  X_RAY = 'X_RAY',
  USG = 'USG',
  ECG = 'ECG',
  DRESSING_MINOR_OT = 'DRESSING_MINOR_OT',
  MCH = 'MCH', // Matri tatha Nabajat Sisu
  IMMUNIZATION = 'IMMUNIZATION', // New Immunization View
  TB_LEPROSY = 'TB_LEPROSY',
  NUTRITION = 'NUTRITION',
  CBIMNCI = 'CBIMNCI',
  COMMUNICABLE = 'COMMUNICABLE',
  RABIES_VACCINE = 'RABIES_VACCINE', // New Rabies View
  NON_COMMUNICABLE = 'NON_COMMUNICABLE',
  GENERAL_TREATMENT = 'GENERAL_TREATMENT',

  // Other Modules
  INVENTORY = 'INVENTORY',
  POS = 'POS',
  SERVICE_BILLING = 'SERVICE_BILLING', // Hospital Service Billing
  AI_ASSISTANT = 'AI_ASSISTANT',
  SETTINGS = 'SETTINGS',
}

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export interface UserPermissions {
  // Inventory
  inventoryView: boolean;
  inventoryAdd: boolean;
  inventoryEdit: boolean;
  inventoryDelete: boolean;

  // POS
  posAccess: boolean;

  // Clinic / Services
  clinicAccess: boolean; // View the module
  patientRegister: boolean;
  doctorConsultation: boolean; // Access to consultation modal
  viewPatientHistory: boolean;

  // Lab
  labAccess: boolean;

  // Admin / System
  viewFinancials: boolean; // Dashboard stats & reports
  manageSettings: boolean;
  manageUsers: boolean;
  aiAccess: boolean;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // The main system admin
  SUB_ADMIN = 'SUB_ADMIN',     // Organization/Institute admin
  USER = 'USER'                // General staff
}

export interface User {
  username: string;
  password?: string;
  created: number;
  permissions: UserPermissions;
  role: UserRole;
  organizationId?: string; // Links sub-admins and users to a specific group
}

export type ServiceStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;    // e.g. "500mg" or "1 Tab"
  frequency: string; // e.g. "1-0-1" or "Twice Daily"
  duration: string;  // e.g. "5 Days"
  quantity: number;  // Total items to deduct from stock
  price: number;     // Unit price
}

export interface LabTest {
  id: string;
  testName: string;
  result?: string;
  status: 'PENDING' | 'COMPLETED'; // Clinical Status
  requestDate: number;
  billingStatus?: 'PENDING' | 'PAID'; // Financial Status
  price?: number;
}

export interface ServiceItemRequest {
  id: string;
  name: string;
  category: string; // 'X-RAY', 'USG', 'VACCINE', 'PROCEDURE', 'OTHER'
  price: number;
  status: 'PENDING' | 'BILLED';
}

export interface ServiceRecord {
  id: string;        // Unique internal ID
  patientId: string; // Readable Unique Patient ID (e.g. PAT-2024-001)
  patientName: string;
  age: number;
  address: string;
  contactNo: string;
  gender: string;
  ethnicity: string;
  serviceType: string;
  department?: string; // NEW: To track which department (X-Ray, OPD, etc.)
  cost: number;      // Service Fee
  timestamp: number;
  status: ServiceStatus;
  queueNumber: number; // Daily Token Number (1, 2, 3...)
  findings?: string;   // Clinical notes
  diagnosis?: string;  // Medical Diagnosis
  prescription?: PrescriptionItem[]; // Prescribed medicines
  prescriptionStatus?: 'PENDING' | 'BILLED'; // Track if meds are billed
  labRequests?: LabTest[]; // Requested investigations
  serviceRequests?: ServiceItemRequest[]; // NEW: X-Ray, USG, Procedure requests
  totalBill?: number;  // Service Fee + Medicine Cost
  organizationId?: string;
  medicineRequests?: PrescriptionItem[]; // Can be same as prescription
}