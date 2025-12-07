
import React, { useState } from 'react';
import { Activity, Lock, User, ArrowRight, AlertCircle, Calendar, Copy, Terminal } from 'lucide-react';
import { dbService } from '../services/db';
import { UserPermissions, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: { username: string, permissions: UserPermissions, role: UserRole, organizationId: string, fiscalYear: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fiscalYear, setFiscalYear] = useState('2081/82');

  const [error, setError] = useState('');
  const [showSql, setShowSql] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fiscal Year Options - 15 Years Range
  const fiscalYears = [
    '2075/76', '2076/77', '2077/78', '2078/79', '2079/80',
    '2080/81', '2081/82', '2082/83', '2083/84', '2084/85',
    '2085/86', '2086/87', '2087/88', '2088/89', '2089/90'
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowSql(false);
    setIsLoading(true);

    try {
      // Small delay for UX
      await new Promise(r => setTimeout(r, 600));
      const user = await dbService.authenticateUser(username, password);
      
      if (user) {
        onLogin({ 
           username: user.username, 
           permissions: user.permissions,
           role: user.role,
           organizationId: user.organizationId || 'MAIN',
           fiscalYear: fiscalYear
        });
      } else {
        setError('युजरनेम वा पासवर्ड मिलेन (Invalid Credentials)');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("Database tables not found") || err.message.includes("Could not find the table"))) {
          setError('Database Error: Tables are missing. Run the SQL script below in Supabase.');
          setShowSql(true);
      } else {
          setError('लगइन असफल भयो। कृपया पुन: प्रयास गर्नुहोस्।');
      }
      setIsLoading(false);
    }
  };

  const copySql = () => {
     const sql = `-- 1. USERS TABLE
create table if not exists users (
  username text primary key,
  password text not null,
  role text default 'USER',
  permissions jsonb default '{}',
  created bigint,
  "organizationId" text default 'MAIN',
  "fullName" text,
  designation text,
  "phoneNumber" text
);
alter table users enable row level security;
drop policy if exists "Public Access Users" on users;
create policy "Public Access Users" on users for all using (true);

-- 2. MEDICINES TABLE
create table if not exists medicines (
  id text primary key,
  name text,
  "genericName" text,
  category text,
  "batchNumber" text,
  "expiryDate" text,
  price numeric default 0,
  stock numeric default 0,
  "minStockLevel" numeric default 10,
  description text,
  "organizationId" text default 'MAIN'
);
alter table medicines enable row level security;
drop policy if exists "Public Access Medicines" on medicines;
create policy "Public Access Medicines" on medicines for all using (true);

-- 3. SALES TABLE
create table if not exists sales (
  id text primary key,
  timestamp bigint,
  items jsonb,
  "totalAmount" numeric,
  "customerName" text,
  "serviceId" text,
  "organizationId" text
);
alter table sales enable row level security;
drop policy if exists "Public Access Sales" on sales;
create policy "Public Access Sales" on sales for all using (true);

-- 4. SERVICE RECORDS (Patients)
create table if not exists "serviceRecords" (
  id text primary key,
  "patientId" text,
  "patientName" text,
  age numeric,
  address text,
  "contactNo" text,
  gender text,
  ethnicity text,
  "serviceType" text,
  department text,
  cost numeric,
  timestamp bigint,
  status text,
  "queueNumber" numeric,
  findings text,
  diagnosis text,
  prescription jsonb,
  "prescriptionStatus" text,
  "labRequests" jsonb,
  "serviceRequests" jsonb,
  "totalBill" numeric,
  "organizationId" text,
  "medicineRequests" jsonb,
  "rabiesData" jsonb
);
alter table "serviceRecords" enable row level security;
drop policy if exists "Public Access ServiceRecords" on "serviceRecords";
create policy "Public Access ServiceRecords" on "serviceRecords" for all using (true);

-- 5. SERVICES CATALOG
create table if not exists services (
  id text primary key,
  name text,
  category text,
  price numeric,
  description text,
  duration text,
  "isSystem" boolean default false,
  unit text,
  range text,
  "subTests" jsonb
);
alter table services enable row level security;
drop policy if exists "Public Access Services" on services;
create policy "Public Access Services" on services for all using (true);

-- 6. REALTIME
alter publication supabase_realtime add table medicines, sales, users, "serviceRecords", services;`;
     navigator.clipboard.writeText(sql);
     alert("SQL Copied! Please paste it in your Supabase SQL Editor and Click RUN.");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className={`bg-white w-full ${showSql ? 'max-w-2xl' : 'max-w-md'} rounded-3xl shadow-2xl overflow-hidden z-10 relative transition-all duration-300`}>
        <div className="p-8 sm:p-10">
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col items-center mb-10">
              <div className="bg-gradient-to-tr from-teal-500 to-blue-600 p-4 rounded-2xl shadow-lg mb-4">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Smart Health</h1>
              <p className="text-slate-500 text-sm mt-2">स्वास्थ्य संस्था व्यवस्थापन प्रणाली</p>
            </div>

            {showSql ? (
               <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                     <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                     <div>
                        <strong>Database Setup Required!</strong>
                        <p className="mt-1 text-xs">The database tables are missing. Please copy the SQL code below and run it in your Supabase SQL Editor.</p>
                     </div>
                  </div>
                  <div className="relative">
                     <div className="bg-slate-800 rounded-lg p-3 overflow-x-auto max-h-64 custom-scrollbar text-xs font-mono text-slate-300 border border-slate-700">
                        <pre>{`-- 1. USERS TABLE
create table if not exists users (
  username text primary key,
  ...
);
-- (Copy full script to run)`}</pre>
                     </div>
                     <button onClick={copySql} className="absolute top-2 right-2 bg-white text-slate-900 px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-slate-100 flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy Full SQL
                     </button>
                  </div>
                  <div className="text-[10px] text-slate-500 italic">
                     Note: If you run this and still get errors, try reloading the "Schema Cache" in Supabase Settings.
                  </div>
                  <button onClick={() => setShowSql(false)} className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                     Back to Login
                  </button>
               </div>
            ) : (
               <form onSubmit={handleLoginSubmit} className="space-y-5">
               {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs flex items-start gap-2">
                     <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                     <span>{error}</span>
                  </div>
               )}

               {/* Fiscal Year Selection */}
               <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 ml-1">आर्थिक वर्ष (Fiscal Year)</label>
                  <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                     <select
                     value={fiscalYear}
                     onChange={(e) => setFiscalYear(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900 appearance-none cursor-pointer"
                     >
                     {fiscalYears.map(fy => (
                        <option key={fy} value={fy}>{fy}</option>
                     ))}
                     </select>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                     <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                     </div>
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 ml-1">युजरनेम (Username)</label>
                  <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                     <input
                     type="text"
                     required
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900"
                     placeholder="तपाईंको युजरनेम राख्नुहोस्"
                     />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 ml-1">पासवर्ड (Password)</label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                     <input
                     type="password"
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900"
                     placeholder="तपाईंको पासवर्ड राख्नुहोस्"
                     />
                  </div>
               </div>

               <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
               >
                  {isLoading ? (
                     <>
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     <span>प्रमाणिकरण गर्दै...</span>
                     </>
                  ) : (
                     <>
                     <span>साइन इन (Sign In)</span>
                     <ArrowRight className="w-5 h-5" />
                     </>
                  )}
               </button>
               </form>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">&copy; 2024 Smart Health. All rights reserved.</p>
          <p className="text-xs text-slate-500 mt-1">App Developed by : <span className="font-semibold text-slate-700">Swastik Khatiwada</span></p>
        </div>
      </div>
    </div>
  );
};
