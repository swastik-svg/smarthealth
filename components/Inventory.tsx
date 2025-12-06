import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, AlertCircle, AlertTriangle, Lock } from 'lucide-react';
import { Medicine, UserPermissions } from '../types';

interface InventoryProps {
  inventory: Medicine[];
  onAddMedicine: (medicine: Medicine) => void;
  onUpdateMedicine: (medicine: Medicine) => void;
  onDeleteMedicine: (id: string) => void;
  permissions: UserPermissions;
  activeOrgId?: string;
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, onAddMedicine, onUpdateMedicine, onDeleteMedicine, permissions, activeOrgId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<Medicine | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: '', genericName: '', category: 'Tablets', price: 0, stock: 0, minStockLevel: 10, batchNumber: '', expiryDate: ''
  });

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (medicine?: Medicine) => {
    if (medicine) {
      if (!permissions.inventoryEdit) return; // Guard
      setEditingId(medicine.id);
      setFormData(medicine);
    } else {
      if (!permissions.inventoryAdd) return; // Guard
      if (activeOrgId === 'ALL') {
         alert("कृपया औषधि थप्नको लागि एक विशिष्ट संस्था चयन गर्नुहोस्।");
         return;
      }
      setEditingId(null);
      setFormData({
         name: '', genericName: '', category: 'Tablets', price: 0, stock: 0, minStockLevel: 10, batchNumber: '', expiryDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const medicineData = {
      ...formData,
      id: editingId || crypto.randomUUID(),
    } as Medicine;

    if (editingId) {
      onUpdateMedicine(medicineData);
    } else {
      onAddMedicine(medicineData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteMedicine(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const isCreationDisabled = activeOrgId === 'ALL';
  const showOrgColumn = activeOrgId === 'ALL';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="औषधि खोज्नुहोस्..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
          />
        </div>
        
        {permissions.inventoryAdd ? (
          <button 
            disabled={isCreationDisabled}
            onClick={() => handleOpenModal()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium shadow-sm 
               ${isCreationDisabled ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-900/20'}`}
            title={isCreationDisabled ? "औषधि थप्न संस्था छान्नुहोस्" : "नयाँ औषधि थप्नुहोस्"}
          >
            <Plus className="w-5 h-5" />
            औषधि थप्नुहोस्
          </button>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 cursor-not-allowed">
             <Lock className="w-4 h-4" />
             <span className="text-sm">थप्न निषेधित</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {showOrgColumn && (
                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">संस्था</th>
                )}
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">औषधिको नाम</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">वर्ग (Category)</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">ब्याच/म्याद</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">मौज्दात (Stock)</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">मूल्य</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">कार्य (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={showOrgColumn ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                    कुनै औषधि फेला परेन।
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {showOrgColumn && (
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                            {item.organizationId || 'MAIN'}
                        </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.genericName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{item.batchNumber}</div>
                      <div className={`text-xs ${new Date(item.expiryDate) < new Date() ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                        Exp: {item.expiryDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 font-medium ${item.stock <= item.minStockLevel ? 'text-amber-600' : 'text-slate-700'}`}>
                         {item.stock}
                         {item.stock <= item.minStockLevel && <AlertCircle className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">रु. {item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          {permissions.inventoryEdit && !showOrgColumn && (
                            <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {permissions.inventoryDelete && !showOrgColumn && (
                            <button onClick={() => setItemToDelete(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {showOrgColumn && (
                             <span className="text-xs text-slate-400 italic">सम्पादन गर्न संस्था छान्नुहोस्</span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? 'औषधि विवरण सम्पादन' : 'नयाँ औषधि थप्नुहोस्'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="medicineForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">औषधिको नाम (Name)</label>
                  <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">जेनेरिक नाम (Generic Name)</label>
                  <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={formData.genericName} onChange={e => setFormData({...formData, genericName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">वर्ग (Category)</label>
                  <select className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Tablets</option>
                    <option>Syrup</option>
                    <option>Injections</option>
                    <option>Ointment</option>
                    <option>Equipment</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">ब्याच नम्बर (Batch No)</label>
                  <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">मूल्य (Price)</label>
                  <input required type="number" step="0.01" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">मौज्दात मात्रा (Stock)</label>
                  <input required type="number" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">न्यून मौज्दात संकेत (Min Stock Alert)</label>
                  <input required type="number" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">म्याद सकिने मिति (Expiry Date)</label>
                  <input required type="date" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" 
                    value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium">रद्द गर्नुहोस्</button>
              <button type="submit" form="medicineForm" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">सुरक्षित गर्नुहोस्</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">औषधि हटाउने हो?</h3>
              <p className="text-slate-500 mb-6">
                के तपाईं साँच्चै <span className="font-semibold text-slate-900">{itemToDelete.name}</span> हटाउन चाहनुहुन्छ? 
                यो कार्य रद्द गर्न सकिँदैन।
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  रद्द गर्नुहोस्
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  हटाउनुहोस् (Delete)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};