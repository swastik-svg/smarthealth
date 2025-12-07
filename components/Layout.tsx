
import React, { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Bot, Activity, LogOut, Settings, Stethoscope, FlaskConical, Menu, Building2, Check, ChevronDown, ChevronRight, Zap, HeartPulse, Cross, Users, Syringe, Baby, Apple, Thermometer, ShieldCheck, UserPlus, Receipt } from 'lucide-react';
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
  // Sidebar initialized to false (hidden)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
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
          { view: AppView.GENERAL_TREATMENT, label: 'General Treatment', icon: Activity, hidden: !permissions.accessGeneralTreatment },
          { view: AppView.PATHOLOGY, label: 'Pathology (Lab)', icon: FlaskConical, hidden: !permissions.accessPathology },
          { view: AppView.X_RAY, label: 'X-Ray', icon: Zap, hidden: !permissions.accessXRay },
          { view: AppView.USG, label: 'USG (Video X-Ray)', icon: Activity, hidden: !permissions.accessUSG },
          { view: AppView.ECG, label: 'ECG', icon: HeartPulse, hidden: !permissions.accessECG },
          { view: AppView.DRESSING_MINOR_OT, label: 'Dressing / Minor OT', icon: Cross, hidden: !permissions.accessDressing },
          { view: AppView.IMMUNIZATION, label: 'Immunization (खोप)', icon: Syringe, hidden: !permissions.accessImmunization },
          { view: AppView.MCH, label: 'Maternal & Child (MCH)', icon: Baby, hidden: !permissions.accessMCH },
          { view: AppView.TB_LEPROSY, label: 'TB & Leprosy', icon: Thermometer, hidden: !permissions.accessTB },
          { view: AppView.NUTRITION, label: 'Nutrition (Poshan)', icon: Apple, hidden: !permissions.accessNutrition },
          { view: AppView.CBIMNCI, label: 'CBIMNCI', icon: Users, hidden: !permissions.accessCBIMNCI },
          { 
            view: AppView.COMMUNICABLE, 
            label: 'Communicable Disease', 
            icon: ShieldCheck,
            hidden: !permissions.accessCommunicable,
            subItems: [
              { view: AppView.RABIES_VACCINE, label: 'Rabies Vaccine Reg.', icon: Syringe, hidden: !permissions.accessRabies }
            ]
          },
          { view: AppView.NON_COMMUNICABLE, label: 'Non-Communicable', icon: HeartPulse, hidden: !permissions.accessNonCommunicable },
       ]
    },
    { view: AppView.INVENTORY, label: 'मौज्दात (Inventory)', icon: Package, hidden: !permissions.inventoryView },
    { view: AppView.POS, label: 'बिक्री (POS)', icon: ShoppingCart, hidden: !permissions.posAccess },
    { view: AppView.SERVICE_BILLING, label: 'सेवा बिलिङ (Billing)', icon: Receipt, hidden: !permissions.posAccess },
    { view: AppView.AI_ASSISTANT, label: 'AI सहायक', icon: Bot, hidden: !permissions.aiAccess },
    { view: AppView.SETTINGS, label: 'सेटिङ्स', icon: Settings, hidden: !permissions.manageSettings },
  ];

  // Retrieve store name from localStorage or default
  const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
  const storeName = settings.storeName || 'Smart Health';
  const displayUser = currentUser || 'User';

  const getViewTitle = (view: AppView) => {
    switch(view) {
      case AppView.DASHBOARD: return 'ड्यासवोर्ड';
      case AppView.PATIENT_REGISTRATION: return 'सेवाग्राही मूलदर्ता';
      case AppView.PATHOLOGY: return 'प्याथोलोजी (ल्याब)';
      case AppView.INVENTORY: return 'औषधि मौज्दात';
      case AppView.POS: return 'बिक्री काउन्टर';
      case AppView.SERVICE_BILLING: return 'सेवा बिलिङ';
      case AppView.AI_ASSISTANT: return 'AI सहायक';
      case AppView.SETTINGS: return 'प्रणाली सेटिङ्स';
      case AppView.GENERAL_TREATMENT: return 'General Treatment';
      case AppView.X_RAY: return 'X-Ray Services';
      case AppView.USG: return 'Video X-Ray (USG)';
      case AppView.ECG: return 'Electrocardiogram (ECG)';
      case AppView.DRESSING_MINOR_OT: return 'Dressing & Minor OT';
      case AppView.IMMUNIZATION: return 'Immunization Program (खोप)';
      case AppView.MCH: return 'Maternal & Child Health';
      case AppView.TB_LEPROSY: return 'TB & Leprosy Clinic';
      case AppView.NUTRITION: return 'Nutrition Clinic';
      case AppView.CBIMNCI: return 'CBIMNCI Service';
      case AppView.COMMUNICABLE: return 'Communicable Disease';
      case AppView.RABIES_VACCINE: return 'Rabies Vaccine Registration';
      case AppView.NON_COMMUNICABLE: return 'Non-Communicable Disease';
      default: return 'Smart Health';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 bg-slate-900 text-white flex flex-col shadow-xl z-30 transition-transform duration-300 ease-in-out w-72 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:hidden'}`}
      >
        <div className="flex flex-col h-full w-72">
          <div className="p-6 flex items-center gap-3 border-b border-slate-700">
            <div className="bg-teal-500 p-2 rounded-lg shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold tracking-tight truncate w-full">{storeName}</h1>
              <p className="text-[10px] text-slate-400 leading-tight">स्वास्थ्य संस्था व्यवस्थापन प्रणाली</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar pb-20">
            {navItems.filter(item => !item.hidden).map((item, idx) => {
               if (item.isParent && item.children) {
                  // Only show parent if at least one child is visible
                  const visibleChildren = item.children.filter(child => !child.hidden);
                  if (visibleChildren.length === 0) return null;

                  const isActive = visibleChildren.some(child => 
                     child.view === currentView || 
                     ((child as any).subItems && (child as any).subItems.some((s:any) => s.view === currentView))
                  );
                  
                  return (
                     <div key={idx} className="space-y-1">
                        <button
                           onClick={() => setIsServicesOpen(!isServicesOpen)}
                           className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                              isActive ? 'text-teal-400 bg-slate-800/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                           }`}
                        >
                           <div className="flex items-center gap-3">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                           </div>
                           {isServicesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        
                        {isServicesOpen && (
                           <div className="ml-4 pl-4 border-l-2 border-slate-700 space-y-1 py-1">
                              {visibleChildren.map((child) => {
                                 // Check for nested sub-items (e.g. Rabies under Communicable)
                                 const subItems = (child as any).subItems;
                                 const hasSubItems = subItems && subItems.length > 0;
                                 const isChildActive = currentView === child.view || (hasSubItems && subItems.some((s:any) => s.view === currentView));
                                 const isSubMenuOpen = openSubMenus[child.view!] || false;

                                 if (hasSubItems) {
                                    // Check if sub items are hidden based on permission
                                    const visibleSubItems = subItems.filter((s: any) => !s.hidden);
                                    if (visibleSubItems.length === 0 && child.hidden) return null;

                                    return (
                                       <div key={child.view} className="space-y-1">
                                          <button
                                             onClick={() => {
                                                if(child.view) {
                                                   onChangeView(child.view);
                                                   // On mobile, close sidebar after selection
                                                   if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                                }
                                             }}
                                             className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                                                isChildActive
                                                   ? 'bg-teal-600/10 text-teal-400'
                                                   : 'text-slate-400 hover:text-teal-400 hover:bg-slate-800/50'
                                             }`}
                                          >
                                             <div className="flex items-center gap-3">
                                                <child.icon className="w-4 h-4" />
                                                <span>{child.label}</span>
                                             </div>
                                             <div 
                                                onClick={(e) => toggleSubMenu(child.view!, e)}
                                                className="p-1 hover:bg-slate-700 rounded"
                                             >
                                                {isSubMenuOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                             </div>
                                          </button>
                                          
                                          {isSubMenuOpen && (
                                             <div className="ml-3 pl-3 border-l border-slate-700 space-y-1 my-1">
                                                {visibleSubItems.map((sub: any) => (
                                                   <button
                                                      key={sub.view}
                                                      onClick={() => {
                                                         onChangeView(sub.view);
                                                         if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                                      }}
                                                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                                                         currentView === sub.view
                                                            ? 'bg-teal-600 text-white shadow-sm'
                                                            : 'text-slate-400 hover:text-teal-400 hover:bg-slate-800/50'
                                                      }`}
                                                   >
                                                      <sub.icon className="w-3 h-3" />
                                                      <span>{sub.label}</span>
                                                   </button>
                                                ))}
                                             </div>
                                          )}
                                       </div>
                                    );
                                 }

                                 return (
                                    <button
                                       key={child.view}
                                       onClick={() => {
                                          onChangeView(child.view!);
                                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                       }}
                                       className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                                          currentView === child.view
                                             ? 'bg-teal-600 text-white shadow-md'
                                             : 'text-slate-400 hover:text-teal-400 hover:bg-slate-800/50'
                                       }`}
                                    >
                                       <child.icon className="w-4 h-4" />
                                       <span>{child.label}</span>
                                    </button>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  );
               }

               return (
                  <button
                     key={item.view}
                     onClick={() => {
                        onChangeView(item.view as AppView);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                     }}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mb-1 ${
                        currentView === item.view
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                     }`}
                  >
                     <item.icon className={`w-5 h-5 ${currentView === item.view && item.view === AppView.SETTINGS ? 'animate-spin-slow' : ''}`} style={currentView === item.view && item.view === AppView.SETTINGS ? {animation: 'spin 4s linear infinite'} : {}} />
                     <span className="font-medium">{item.label}</span>
                  </button>
               );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
             <div className="mb-3 px-2">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">संस्था / शाखा</p>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                   <Building2 className="w-3 h-3" /> {currentOrgName || 'Main Branch'}
                </div>
             </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>लग आउट (Logout)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              title={isSidebarOpen ? "मेनु लुकाउनुहोस्" : "मेनु देखाउनुहोस्"}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 capitalize truncate max-w-[200px] sm:max-w-none">
              {getViewTitle(currentView)}
            </h2>

            {/* Super Admin Organization Filter */}
            {userRole === UserRole.SUPER_ADMIN && availableOrgs && onSelectOrg && (
               <div className="relative ml-2 hidden md:block">
                  <button 
                     onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                     className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                  >
                     <Building2 className="w-4 h-4 text-slate-500" />
                     {selectedOrgId === 'ALL' ? 'सबै संस्थाहरू' : selectedOrgId}
                  </button>
                  
                  {isOrgDropdownOpen && (
                     <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOrgDropdownOpen(false)}></div>
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2">
                           <button 
                              onClick={() => { onSelectOrg('ALL'); setIsOrgDropdownOpen(false); }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center justify-between"
                           >
                              <span>सबै संस्थाहरू (All Organizations)</span>
                              {selectedOrgId === 'ALL' && <Check className="w-4 h-4 text-teal-600" />}
                           </button>
                           <div className="border-t border-slate-100 my-1"></div>
                           {availableOrgs.map(org => (
                              <button 
                                 key={org}
                                 onClick={() => { onSelectOrg(org); setIsOrgDropdownOpen(false); }}
                                 className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center justify-between"
                              >
                                 <span>{org}</span>
                                 {selectedOrgId === org && <Check className="w-4 h-4 text-teal-600" />}
                              </button>
                           ))}
                        </div>
                     </>
                  )}
               </div>
            )}
          </div>

          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{displayUser}</p>
                <p className="text-xs text-slate-500">{userRole.replace('_', ' ')}</p>
             </div>
             <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border border-teal-200 uppercase text-sm sm:text-base">
                {displayUser.substring(0,2)}
             </div>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-3 md:p-6 scroll-smooth">
          {children}
        </div>
        
        <footer className="bg-slate-50 border-t border-slate-200 py-3 text-center text-[10px] sm:text-xs text-slate-500 shrink-0">
          App Developed by : <span className="font-semibold text-slate-700">Swastik Khatiwada</span>
        </footer>
      </main>
    </div>
  );
};
