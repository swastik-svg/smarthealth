
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
  patientAge?: number;    // Added to persist demographics
  patientGender?: string; // Added to persist demographics
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

  // Reports
  REPORT_PARENT = 'REPORT_PARENT',
  REPORT_RABIES = 'REPORT_RABIES',
  REPORT_SERVICE_USER = 'REPORT_SERVICE_USER', // New Monthly Progress Report
  REPORT_IMMUNIZATION = 'REPORT_IMMUNIZATION', // New Khop Report
  REPORT_CBIMNCI = 'REPORT_CBIMNCI', // New CBIMNCI Report
  REPORT_NUTRITION = 'REPORT_NUTRITION', // New Nutrition Report
  REPORT_MNH = 'REPORT_MNH', // New MNH Report
  REPORT_FAMILY_PLANNING = 'REPORT_FAMILY_PLANNING', // New FP Report
  REPORT_REPRODUCTIVE_HEALTH = 'REPORT_REPRODUCTIVE_HEALTH', // New RH Report
  REPORT_ORC = 'REPORT_ORC', // New ORC Report

  // Jinshi (Inventory Records)
  JINSHI_PARENT = 'JINSHI_PARENT',
  JINSHI_MAG_FARAM = 'JINSHI_MAG_FARAM',
  JINSHI_KHARID_ADESH = 'JINSHI_KHARID_ADESH',
  JINSHI_DAKHILA_PRATIBEDAN = 'JINSHI_DAKHILA_PRATIBEDAN', // New Dakhila Report

  // Other Modules
  INVENTORY = 'INVENTORY',
  POS = 'POS',
  SERVICE_BILLING = 'SERVICE_BILLING', // Hospital Service Billing
  SETTINGS = 'SETTINGS',
  RATE_UPDATE = 'RATE_UPDATE', // Virtual
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

  // Clinic / Services (Granular Access)
  clinicAccess: boolean; // Legacy/Global toggle
  patientRegister: boolean; // Access to "Sewagrahi Muldarta"
  doctorConsultation: boolean; // Access to consultation modal
  viewPatientHistory: boolean;

  // Specific Department Access (Sub-menu level)
  accessGeneralTreatment: boolean;
  accessPathology: boolean; // Lab Dashboard
  accessXRay: boolean;
  accessUSG: boolean;
  accessECG: boolean;
  accessDressing: boolean;
  accessMCH: boolean;
  accessImmunization: boolean;
  accessTB: boolean;
  accessNutrition: boolean;
  accessCBIMNCI: boolean;
  accessCommunicable: boolean;
  accessRabies: boolean;
  accessNonCommunicable: boolean;

  // Jinshi Access
  accessJinshi: boolean;

  // Admin / System
  viewFinancials: boolean; // Dashboard stats & reports
  viewReports: boolean;    // Access to general reports menu
  manageSettings: boolean; // Gatekeeper for the Settings Page
  manageUsers: boolean;

  // Granular Settings Access
  settings_General: boolean; // Store Profile
  settings_Rates: boolean;   // Rate & Service Setup
  settings_Users: boolean;   // User Tab
  settings_Data: boolean;    // Backup Tab
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
  fullName?: string;
  designation?: string;
  phoneNumber?: string;
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

export interface RabiesSchedule {
  day0: string | null; // BS Date String (YYYY-MM-DD)
  day3: string | null;
  day7: string | null;
  day14: string | null;
  day28: string | null;
  
  // Status flags to track if vaccine was actually given
  day0Given?: boolean;
  day3Given?: boolean;
  day7Given?: boolean;
  day14Given?: boolean;
  day28Given?: boolean;
}

export interface RabiesData {
  previousRecord: string; // Yes/No or details
  dateOfBite: string; // BS Date String
  animalType: string; // Dog, Cat, Monkey
  biteSite: string; // Leg, Hand
  exposureNature: string; // Scratch, Bite, Lick
  skinBroken: boolean;
  woundBleeding: boolean;
  whoCategory: 'I' | 'II' | 'III';
  humanRabiesCase: boolean;
  schedule: RabiesSchedule;
  registeredMonth?: string; // Renamed from nextVisitMonth
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
  
  // Specific Data for Rabies
  rabiesData?: RabiesData;
}

// Sub-test structure for Lab Profiles (e.g. LFT -> SGOT, SGPT)
export interface SubTest {
  id: string;
  name: string;
  unit?: string;
  range?: string;
}

// New Interface for Rate Management
export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string; // e.g., 'GENERAL', 'LAB', 'X-RAY'
  price: number;
  description?: string;
  duration?: string;
  isSystem?: boolean; // If true, maybe prevent deletion
  
  // Lab Specific Configuration
  unit?: string;       // e.g. "mg/dL"
  range?: string;      // e.g. "70-110"
  subTests?: SubTest[]; // For profiles like LFT
}
