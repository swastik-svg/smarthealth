import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend
} from 'recharts';
import { DollarSign, AlertTriangle, PackageCheck, TrendingUp, X, AlertCircle, CheckCircle, ShoppingBag, Calendar, Lock, Building2 } from 'lucide-react';
import { Medicine, Sale, UserPermissions } from '../types';

interface DashboardProps {
  inventory: Medicine[];
  sales: Sale[];
  permissions: UserPermissions;
  activeOrgId?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, sales, permissions, activeOrgId }) => {
  const [activeModal, setActiveModal] = useState<'lowStock' | 'expired' | 'sales' | null>(null);

  // Derived Data
  const lowStockItems = useMemo(() => 
    inventory.filter(m => m.stock <= m.minStockLevel), 
  [inventory]);

  const expiredItems = useMemo(() => {
    const now = new Date();
    return inventory.filter(m => new Date(m.expiryDate) < now);
  }, [inventory]);
  
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    
    return {
      revenue: totalRevenue,
      salesCount: sales.length,
      lowStock: lowStockItems.length,
      expired: expiredItems.length
    };
  }, [sales, lowStockItems, expiredItems]);

  const chartData = useMemo(() => {
    // Group sales by day (last 7 days)
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      
      const daySales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === dateStr);
      const dayRevenue = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
      
      data.push({ name: dateStr.split('/')[0] + '/' + dateStr.split('/')[1], revenue: dayRevenue, count: daySales.length });
    }
    return data;
  }, [sales]);

  // If user doesn't have permission to view reports, show a limited dashboard
  if (!permissions.viewFinancials) {
     return (
        <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
           <div className="p-4 bg-slate-100 rounded-full">
              <Lock className="w-8 h-8 text-slate-500" />
           </div>
           <h3 className="text-xl font-semibold text-slate-700">पहुँच निषेधित (Access Restricted)</h3>
           <p>तपाईंलाई बिक्री रिपोर्ट र तथ्याङ्क हेर्ने अनुमति छैन।</p>
           
           <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
              <div 
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center"
              >
                <div className="text-sm font-medium text-slate-500">न्यून मौज्दात (Low Stock)</div>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStock}</h3>
              </div>
              <div 
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center"
              >
                <div className="text-sm font-medium text-slate-500">म्याद सकिएको (Expired)</div>
                <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</h3>
              </div>
           </div>
        </div>
     );
  }

  const showOrgColumn = activeOrgId === 'ALL';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setActiveModal('sales')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-green-200 transition-all cursor-pointer hover:shadow-md min-w-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">कुल आम्दानी (Revenue)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 truncate">रु. {stats.revenue.toLocaleString()}</h3>
            <p className="text-xs text-green-600 mt-1 font-medium">रिपोर्ट हेर्न क्लिक गर्नुहोस्</p>
          </div>
          <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setActiveModal('sales')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all cursor-pointer hover:shadow-md min-w-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">बिक्री संख्या (Sales Count)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 truncate">{stats.salesCount}</h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">इतिहास हेर्न क्लिक गर्नुहोस्</p>
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Clickable Low Stock Card */}
        <div 
          onClick={() => setActiveModal('lowStock')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-amber-200 transition-all cursor-pointer hover:shadow-md min-w-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">न्यून मौज्दात (Low Stock)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 truncate">{stats.lowStock}</h3>
            <p className="text-xs text-amber-600 mt-1 font-medium">विवरण हेर्न क्लिक गर्नुहोस्</p>
          </div>
          <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Clickable Expired Card */}
        <div 
          onClick={() => setActiveModal('expired')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-red-200 transition-all cursor-pointer hover:shadow-md min-w-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">म्याद सकिएको / जोखिमपूर्ण</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 truncate">{stats.expired}</h3>
            <p className="text-xs text-red-600 mt-1 font-medium">विवरण हेर्न क्लिक गर्नुहोस्</p>
          </div>
          <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">आम्दानी प्रवृत्ति (पछिल्लो ७ दिन)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} tickFormatter={(val) => `रु.${val}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`रु.${value}`, 'आम्दानी']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} dot={{r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">बिक्री मात्रा</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className={`px-6 py-4 border-b flex justify-between items-center 
              ${activeModal === 'lowStock' ? 'bg-amber-50 border-amber-100' : 
                activeModal === 'expired' ? 'bg-red-50 border-red-100' : 
                'bg-blue-50 border-blue-100'}`}
            >
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg 
                   ${activeModal === 'lowStock' ? 'bg-amber-100 text-amber-700' : 
                     activeModal === 'expired' ? 'bg-red-100 text-red-700' : 
                     'bg-blue-100 text-blue-700'}`}
                 >
                    {activeModal === 'lowStock' && <PackageCheck className="w-5 h-5" />}
                    {activeModal === 'expired' && <AlertTriangle className="w-5 h-5" />}
                    {activeModal === 'sales' && <ShoppingBag className="w-5 h-5" />}
                 </div>
                 <h3 className={`text-lg font-bold 
                   ${activeModal === 'lowStock' ? 'text-amber-900' : 
                     activeModal === 'expired' ? 'text-red-900' : 
                     'text-blue-900'}`}
                 >
                   {activeModal === 'lowStock' ? 'न्यून मौज्दात विवरण (Low Stock Alert)' : 
                    activeModal === 'expired' ? 'म्याद सकिएका सामग्री (Expired & Critical)' : 
                    'बिक्री इतिहास रिपोर्ट (Sales Report)'}
                 </h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-full hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-0 flex-1">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    {showOrgColumn && (
                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">संस्था</th>
                    )}
                    {activeModal === 'sales' ? (
                      <>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">मिति र समय</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">ग्राहक</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">सामान</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-right">जम्मा रकम</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">औषधिको नाम</th>
                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">वर्ग (Category)</th>
                        {activeModal === 'lowStock' && (
                          <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-right">हालको मौज्दात</th>
                        )}
                        {activeModal === 'lowStock' && (
                          <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-right">न्यूनतम सीमा</th>
                        )}
                        {activeModal === 'expired' && (
                          <th className="px-6 py-3 font-semibold text-slate-700 text-sm">ब्याच नं</th>
                        )}
                        {activeModal === 'expired' && (
                          <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-right">म्याद सकिने मिति</th>
                        )}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeModal === 'sales' ? (
                    sales.length === 0 ? (
                      <tr>
                        <td colSpan={showOrgColumn ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                           <div className="flex flex-col items-center gap-2">
                              <Calendar className="w-8 h-8 text-blue-500 opacity-50" />
                              <p>कुनै बिक्री रेकर्ड फेला परेन।</p>
                           </div>
                        </td>
                      </tr>
                    ) : (
                      sales.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50">
                          {showOrgColumn && (
                              <td className="px-6 py-3 text-slate-500 text-xs font-mono">
                                  {sale.organizationId || 'MAIN'}
                              </td>
                          )}
                          <td className="px-6 py-3 text-slate-600 text-sm">
                            {new Date(sale.timestamp).toLocaleDateString()}
                            <span className="text-xs text-slate-400 ml-1">
                              {new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="font-medium text-slate-900">{sale.customerName}</div>
                          </td>
                          <td className="px-6 py-3 text-slate-600 text-sm">
                            <span className="truncate max-w-[200px] block" title={sale.items.map(i => i.name).join(', ')}>
                              {sale.items.length} वटा सामान 
                              <span className="text-xs text-slate-400"> ({sale.items.slice(0, 2).map(i => i.name).join(', ')}{sale.items.length > 2 ? '...' : ''})</span>
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-teal-600">
                            रु. {sale.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    (activeModal === 'lowStock' ? lowStockItems : expiredItems).length === 0 ? (
                      <tr>
                        <td colSpan={showOrgColumn ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                           <div className="flex flex-col items-center gap-2">
                              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                              <p>सबै ठीक छ! कुनै सामग्री फेला परेन।</p>
                           </div>
                        </td>
                      </tr>
                    ) : (
                      (activeModal === 'lowStock' ? lowStockItems : expiredItems).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          {showOrgColumn && (
                              <td className="px-6 py-3 text-slate-500 text-xs font-mono">
                                  {item.organizationId || 'MAIN'}
                              </td>
                          )}
                          <td className="px-6 py-3">
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.genericName}</div>
                          </td>
                          <td className="px-6 py-3 text-slate-600 text-sm">{item.category}</td>
                          
                          {activeModal === 'lowStock' && (
                            <td className="px-6 py-3 text-right font-bold text-amber-600">{item.stock}</td>
                          )}
                          {activeModal === 'lowStock' && (
                            <td className="px-6 py-3 text-right text-slate-600">{item.minStockLevel}</td>
                          )}

                          {activeModal === 'expired' && (
                            <td className="px-6 py-3 text-slate-600 text-sm">{item.batchNumber}</td>
                          )}
                          {activeModal === 'expired' && (
                            <td className="px-6 py-3 text-right font-bold text-red-600">{item.expiryDate}</td>
                          )}
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium shadow-sm"
              >
                बन्द गर्नुहोस् (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};