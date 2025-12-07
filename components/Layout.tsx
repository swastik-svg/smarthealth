
import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Bot, Activity, LogOut, Settings, Stethoscope, FlaskConical, Menu, Building2, Check, ChevronDown, ChevronRight, Zap, HeartPulse, Cross, Users, Syringe, Baby, Apple, Thermometer, ShieldCheck, UserPlus, Receipt, FileBarChart, FileText } from 'lucide-react';
import { AppView, UserPermissions, UserRole } from '../types';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  currentUser: string;
  userRole: UserRole;
  currentOrgName: string;
  permissions: UserPermissions;
  
  // Organization Filtering Props (Super Admin Only)
  availableOrgs?: string[];
  selectedOrgId?: string;
  onSelectOrg?: (orgId: string) => void;
  
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  currentView, onChangeView, onLogout, 
  currentUser, userRole, currentOrgName, permissions,
  availableOrgs, selectedOrgId, onSelectOrg,
  children 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  
  // Using a record to track open state of parent menus
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const toggleSubMenu = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSubMenus(prev => ({...prev, [key]: !prev[key]}));
  };

  const navItems = [
    { view: AppView.DASHBOARD, label: 'ड्यासवोर्ड', icon: LayoutDashboard },
    { view: AppView.PATIENT_REGISTRATION, label: 'सेवाग्राही मूलदर्ता', icon: UserPlus, hidden: !permissions.patientRegister },
    { 
       view: AppView.SERVICES_PARENT, // Dummy view for parent item
       label: 'सेवाहरू (Services)', 
       icon: Stethoscope, 
       // Only show parent if at least one child is accessible
       hidden: !(
          permissions.accessGeneralTreatment ||
          permissions.accessPathology ||
          permissions.accessXRay ||
          permissions.accessUSG ||
          permissions.accessECG ||
          permissions.accessDressing ||
          permissions.accessImmunization ||
          permissions.accessMCH ||
          permissions.accessTB ||
          permissions.accessNutrition ||
          permissions.accessCBIMNCI ||
          permissions.accessCommunicable ||
          permissions.accessNonCommunicable
       ),
       isParent: true,
       children: [
          { view: AppView.GENERAL_TREATMENT, label: 'जनरल उपचार (OPD)', icon: Activity, hidden: !permissions.accessGeneralTreatment },
          { view: AppView.PATHOLOGY, label: 'प्याथोलोजी (Lab)', icon: FlaskConical, hidden: !permissions.accessPathology },
          { view: AppView.X_RAY, label: 'एक्स-रे (X-Ray)', icon: Zap, hidden: !permissions.accessXRay },
          { view: AppView.USG, label: 'भिडियो एक्स-रे (USG)', icon: Activity, hidden: !permissions.accessUSG },
          { view: AppView.ECG, label: 'ई.सी.जी. (ECG)', icon: HeartPulse, hidden: !permissions.accessECG },
          { view: AppView.DRESSING_MINOR_OT, label: 'ड्रेसिङ / माइनर ओ.टी.', icon: Cross, hidden: !permissions.accessDressing },
          { view: AppView.MCH, label: 'मातृ तथा नवजात शिशु (MCH)', icon: Baby, hidden: !permissions.accessMCH },
          { view: AppView.IMMUNIZATION, label: 'खोप सेवा (Immunization)', icon: Syringe, hidden: !permissions.accessImmunization },
          { view: AppView.TB_LEPROSY, label: 'क्षयरोग तथा कुष्ठरोग', icon: Activity, hidden: !permissions.accessTB },
          { view: AppView.NUTRITION, label: 'पोषण (Nutrition)', icon: Apple, hidden: !permissions.accessNutrition },
          { view: AppView.CBIMNCI, label: 'बाल रोग (CBIMNCI)', icon: Baby, hidden: !permissions.accessCBIMNCI },
          { view: AppView.COMMUNICABLE, label: 'सरुवा रोग (Communicable)', icon: Activity, hidden: !permissions.accessCommunicable },
          { view: AppView.RABIES_VACCINE, label: 'रेबिज खोप (Rabies)', icon: Syringe, hidden: !permissions.accessRabies },
          { view: AppView.NON_COMMUNICABLE, label: 'नसर्ने रोग (Non-Communicable)', icon: HeartPulse, hidden: !permissions.accessNonCommunicable },
       ]
    },
    { view: AppView.INVENTORY, label: 'मौज्दात (Inventory)', icon: Package, hidden: !permissions.inventoryView },
    { view: AppView.POS, label: 'फार्मेसी बिक्री (POS)', icon: ShoppingCart, hidden: !permissions.posAccess },
    { view: AppView.SERVICE_BILLING, label: 'सेवा बिलिङ (Billing)', icon: Receipt, hidden: !permissions.posAccess },
    { 
       view: AppView.REPORT_PARENT, 
       label: 'रिपोर्टहरू (Reports)', 
       icon: FileBarChart,
       hidden: !permissions.viewReports,
       isParent: true,
       children: [
          { view: AppView.REPORT_ORC, label: 'ORC प्रतिवेदन', icon: FileText },
          { view: AppView.REPORT_MNH, label: 'MNH प्रतिवेदन', icon: FileText },
          { view: AppView.REPORT_IMMUNIZATION, label: 'खोप सेवा प्रतिवेदन', icon: FileText },
          { view: AppView.REPORT_CBIMNCI, label: 'CBIMNCI प्रतिवेदन', icon: FileText },
          { view: AppView.REPORT_NUTRITION, label: 'पोषण कार्यक्रम प्रतिवेदन', icon: FileText },
          { view: AppView.REPORT_FAMILY_PLANNING, label: 'परिवार नियोजन प्रतिवेदन', icon: FileText },
          { view: AppView.REPORT_REPRODUCTIVE_HEALTH, label: 'प्रजनन् स्वास्थ्य प्रतिवेदन', icon: FileText },
          { view: AppView.REPORT_RABIES, label: 'रेबिज रिपोर्ट (Rabies)', icon: FileText },
          { view: AppView.REPORT_SERVICE_USER, label: 'सेवाग्राही प्रगति प्रतिवेदन', icon: FileText },
       ]
    },
    { view: AppView.AI_ASSISTANT, label: 'AI सहायक', icon: Bot, hidden: !permissions.aiAccess },
    { view: AppView.SETTINGS, label: 'सेटिङ्स', icon: Settings, hidden: !permissions.manageSettings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
        `}
      >
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
           <div className="bg-gradient-to-br from-teal-400 to-blue-500 p-2 rounded-lg">
             <Activity className="w-6 h-6 text-white" />
           </div>
           <div>
             <h1 className="text-xl font-bold tracking-tight">Smart Health</h1>
             <p className="text-xs text-slate-400">Hospital Management</p>
           </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar">
          {navItems.filter(item => !item.hidden).map((item) => {
            // Parent Menu Item
            if (item.isParent && item.children) {
                const isOpen = openSubMenus[item.view] || false;
                // Check if any child is active to highlight parent
                const isChildActive = item.children.some(c => c.view === currentView);
                
                return (
                    <div key={item.view} className="space-y-1">
                        <div 
                           onClick={(e) => toggleSubMenu(item.view, e)}
                           className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group select-none
                             ${isChildActive ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-5 h-5 ${isChildActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-white'}`} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </div>
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                        
                        {isOpen && (
                            <div className="pl-4 space-y-1 border-l border-slate-700 ml-4 animate-in slide-in-from-top-2 duration-200">
                                {item.children.filter(child => !child.hidden).map(child => (
                                    <button
                                        key={child.view}
                                        onClick={() => {
                                            onChangeView(child.view as AppView);
                                            setIsSidebarOpen(false); // Close on mobile
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm
                                          ${currentView === child.view 
                                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50 font-medium' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                    >
                                        <child.icon className="w-4 h-4" />
                                        <span>{child.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }

            // Regular Menu Item
            return (
              <button
                key={item.view}
                onClick={() => {
                   onChangeView(item.view);
                   setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mb-1
                  ${currentView === item.view 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon className={`w-5 h-5 ${currentView === item.view ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex justify-center md:justify-start md:pl-4">
             {/* Organization Selector for Super Admin */}
             {userRole === UserRole.SUPER_ADMIN && availableOrgs && onSelectOrg && (
                <div className="relative">
                   <button 
                      onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors border border-slate-200"
                   >
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>{selectedOrgId === 'ALL' ? 'All Organizations' : selectedOrgId}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                   </button>
                   
                   {isOrgDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                         <button 
                            onClick={() => { onSelectOrg('ALL'); setIsOrgDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${selectedOrgId === 'ALL' ? 'text-teal-600 font-bold bg-teal-50' : 'text-slate-600'}`}
                         >
                            <span>All Organizations</span>
                            {selectedOrgId === 'ALL' && <Check className="w-4 h-4" />}
                         </button>
                         <div className="h-px bg-slate-100 my-1"></div>
                         {availableOrgs.filter(o => o !== 'MAIN').map(org => (
                            <button 
                               key={org}
                               onClick={() => { onSelectOrg(org); setIsOrgDropdownOpen(false); }}
                               className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${selectedOrgId === org ? 'text-teal-600 font-bold bg-teal-50' : 'text-slate-600'}`}
                            >
                               <span>{org}</span>
                               {selectedOrgId === org && <Check className="w-4 h-4" />}
                            </button>
                         ))}
                         {/* Always show MAIN if available or as default */}
                         {availableOrgs.includes('MAIN') && (
                            <button 
                               onClick={() => { onSelectOrg('MAIN'); setIsOrgDropdownOpen(false); }}
                               className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${selectedOrgId === 'MAIN' ? 'text-teal-600 font-bold bg-teal-50' : 'text-slate-600'}`}
                            >
                               <span>Main Branch</span>
                               {selectedOrgId === 'MAIN' && <Check className="w-4 h-4" />}
                            </button>
                         )}
                      </div>
                   )}
                </div>
             )}
             
             {/* Show current org name for non-super admins or just as label */}
             {userRole !== UserRole.SUPER_ADMIN && (
                <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                   <Building2 className="w-4 h-4" />
                   <span className="font-medium">{currentOrgName}</span>
                </div>
             )}
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800">{currentUser}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 rounded-full">{userRole}</span>
             </div>
             <button 
               onClick={onLogout}
               className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
               title="Logout"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
