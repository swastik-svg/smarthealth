
import React, { useState } from 'react';
import { Plus, Trash2, Printer } from 'lucide-react';

interface PurchaseItem {
  id: string;
  description: string;
  specification: string;
  unit: string;
  quantity: string;
  rate: string;
  remarks: string;
}

export const JinshiKharidAdesh: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState('2081/82');
  const [orderNo, setOrderNo] = useState('');
  const [date, setDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: '1', description: '', specification: '', unit: '', quantity: '', rate: '', remarks: '' }
  ]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', specification: '', unit: '', quantity: '', rate: '', remarks: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = (item: PurchaseItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return qty * rate;
  };

  const grandTotal = items.reduce((acc, item) => acc + calculateTotal(item), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1200px] mx-auto bg-white p-8 rounded-xl shadow-sm min-h-screen">
      <style>{`
        @media print {
          @page { size: portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #kharid-adesh, #kharid-adesh * { visibility: visible; }
          #kharid-adesh { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          input { border: none !important; background: transparent !important; }
        }
      `}</style>

      <div id="kharid-adesh">
        <div className="text-center mb-8">
          <h4 className="font-bold text-sm">नेपाल सरकार</h4>
          <h4 className="font-bold text-sm">................ मन्त्रालय / विभाग / कार्यालय</h4>
          <h2 className="font-bold text-xl mt-2 border-b-2 border-black inline-block pb-1">खरिद आदेश</h2>
          <div className="text-right text-sm mt-4 font-bold">म.ले.प.फा.नं: ४०२</div>
        </div>

        <div className="flex justify-between items-start mb-6 text-sm">
          <div className="space-y-1">
             <div>आर्थिक वर्ष: <input className="border-b border-dotted border-black w-24 focus:outline-none" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} /></div>
             <div>खरिद आदेश नं: <input className="border-b border-dotted border-black w-24 focus:outline-none" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} /></div>
          </div>
          <div>मिति: <input className="border-b border-dotted border-black w-32 focus:outline-none" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>

        <div className="mb-6 text-sm space-y-1">
          <div className="font-bold">श्री .............................................</div>
          <div className="pl-6"><input className="border-b border-dotted border-black w-64 focus:outline-none" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="(फर्मको नाम)" /></div>
          <div className="pl-6"><input className="border-b border-dotted border-black w-64 focus:outline-none" value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} placeholder="(ठेगाना)" /></div>
        </div>

        <div className="text-sm mb-4">
          तपसिल बमोजिमका सामानहरू मिति ...................... भित्र उपलब्ध गराई बिल/इन्भ्वाइस पेश गर्नुहोला ।
        </div>

        <table className="w-full border-collapse border border-black text-center text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-12">क्र.सं.</th>
              <th className="border border-black p-2">विवरण</th>
              <th className="border border-black p-2">स्पेसिफिकेशन</th>
              <th className="border border-black p-2 w-16">एकाइ</th>
              <th className="border border-black p-2 w-20">परिमाण</th>
              <th className="border border-black p-2 w-24">दर</th>
              <th className="border border-black p-2 w-24">जम्मा रकम</th>
              <th className="border border-black p-2">कैफियत</th>
              <th className="border border-black p-2 w-10 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black p-2">{index + 1}</td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} /></td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none" value={item.specification} onChange={(e) => updateItem(index, 'specification', e.target.value)} /></td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none text-center" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} /></td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none text-center" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} /></td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none text-right" value={item.rate} onChange={(e) => updateItem(index, 'rate', e.target.value)} /></td>
                <td className="border border-black p-1 text-right font-medium">{calculateTotal(item).toFixed(2)}</td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none" value={item.remarks} onChange={(e) => updateItem(index, 'remarks', e.target.value)} /></td>
                <td className="border border-black p-1 no-print">
                  <button onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="font-bold bg-gray-50">
               <td colSpan={6} className="border border-black p-2 text-right">कुल जम्मा</td>
               <td className="border border-black p-2 text-right">{grandTotal.toFixed(2)}</td>
               <td className="border border-black p-2"></td>
               <td className="border border-black p-2 no-print"></td>
            </tr>
          </tbody>
        </table>

        <div className="mt-2 no-print">
          <button onClick={addItem} className="flex items-center gap-1 text-sm text-teal-600 font-bold hover:bg-teal-50 px-3 py-1 rounded border border-teal-200">
            <Plus className="w-4 h-4" /> लहर थप्नुहोस् (Add Row)
          </button>
        </div>
        
        <div className="mt-4 text-sm">
           उपर्युक्त सामानहरू ....................................... कार्यालयमा बुझाइदिनुहोला ।
        </div>

        <div className="mt-20 flex justify-between text-sm font-medium items-end">
          <div className="text-center w-48">
            <div className="border-t border-dotted border-black pt-1">फाँटवालाको सही</div>
            <div className="mt-2 text-left">नाम: ..............................</div>
            <div className="text-left">पद: ..............................</div>
            <div className="text-left">मिति: ..............................</div>
          </div>
          <div className="text-center w-48">
            <div className="border-t border-dotted border-black pt-1">शाखा प्रमुख / लेखाको सही</div>
            <div className="mt-2 text-left">नाम: ..............................</div>
            <div className="text-left">पद: ..............................</div>
            <div className="text-left">मिति: ..............................</div>
          </div>
          <div className="text-center w-48">
            <div className="border-t border-dotted border-black pt-1">कार्यालय प्रमुखको सही</div>
            <div className="mt-2 text-left">नाम: ..............................</div>
            <div className="text-left">पद: ..............................</div>
            <div className="text-left">मिति: ..............................</div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end no-print">
        <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800">
          <Printer className="w-4 h-4" /> प्रिन्ट गर्नुहोस्
        </button>
      </div>
    </div>
  );
};
