
import React, { useState } from 'react';
import { Search, Plus, Minus, Trash, ShoppingCart, CheckCircle, Lock } from 'lucide-react';
import { Medicine, CartItem, Sale } from '../types';

interface POSProps {
  inventory: Medicine[];
  onProcessSale: (sale: Sale) => void;
  activeOrgId?: string;
}

export const POS: React.FC<POSProps> = ({ inventory, onProcessSale, activeOrgId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [success, setSuccess] = useState(false);

  const filteredInventory = inventory.filter(item => 
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.genericName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    item.stock > 0
  );

  const addToCart = (medicine: Medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === medicine.id);
      if (existing) {
        if (existing.quantity >= medicine.stock) return prev; // Cannot exceed stock
        return prev.map(item => item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const stock = inventory.find(m => m.id === id)?.stock || 0;
        if (newQty > 0 && newQty <= stock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (activeOrgId === 'ALL') {
       alert("कृपया बिक्री प्रक्रियाको लागि एक विशिष्ट संस्था चयन गर्नुहोस्।");
       return;
    }

    const sale: Sale = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      items: cart,
      totalAmount,
      customerName: customerName || 'फुटकर ग्राहक (Walk-in)'
    };

    onProcessSale(sale);
    setSuccess(true);
    setCart([]);
    setCustomerName('');
    setTimeout(() => setSuccess(false), 3000);
  };

  const isSaleDisabled = activeOrgId === 'ALL';

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-8rem)] h-auto gap-6 pb-20 lg:pb-0">
      {/* Product List */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative sticky top-0 z-10 lg:static">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="सामान खोज्नुहोस्..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4 min-h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map(item => (
              <button 
                key={item.id} 
                onClick={() => !isSaleDisabled && addToCart(item)}
                className={`flex flex-col text-left p-4 border border-slate-100 rounded-xl transition-all bg-slate-50 group
                  ${isSaleDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-teal-400 hover:shadow-md hover:bg-white'}`}
              >
                <div className="flex justify-between w-full mb-2">
                  <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                  <span className="font-bold text-teal-600">रु. {item.price}</span>
                </div>
                <div className="text-xs text-slate-500 mb-4 truncate">{item.genericName}</div>
                <div className="mt-auto flex justify-between items-center w-full text-xs">
                  <span className={`${item.stock < 10 ? 'text-amber-600' : 'text-slate-500'}`}>Stock: {item.stock}</span>
                  {!isSaleDisabled && (
                    <span className="text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Add +</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col z-20 h-auto lg:h-full">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-800">हालको बिक्री (Current Sale)</h3>
          </div>
          {isSaleDisabled && (
             <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                <Lock className="w-3 h-3" /> Sale Disabled
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] lg:min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>कार्ट खाली छ</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate">{item.name}</div>
                  <div className="text-xs text-slate-500">रु. {item.price} x {item.quantity}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-200 rounded text-slate-600"><Plus className="w-3 h-3" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-1"><Trash className="w-4 h-4" /></button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl space-y-4 shrink-0">
          <input 
            type="text" 
            placeholder="ग्राहकको नाम (ऐच्छिक)" 
            className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={isSaleDisabled}
          />
          
          <div className="flex justify-between items-center text-slate-600">
             <span>उप-योग (Subtotal)</span>
             <span>रु. {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-slate-800">
             <span>जम्मा (Total)</span>
             <span>रु. {totalAmount.toFixed(2)}</span>
          </div>

          <button 
            disabled={cart.length === 0 || isSaleDisabled}
            onClick={handleCheckout}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2
              ${cart.length > 0 && !isSaleDisabled ? 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-900/20' : 'bg-slate-300 cursor-not-allowed'}`}
          >
             {success ? <CheckCircle className="w-5 h-5 animate-bounce" /> : 'बिक्री सम्पन्न गर्नुहोस्'}
          </button>
        </div>
      </div>
    </div>
  );
};
