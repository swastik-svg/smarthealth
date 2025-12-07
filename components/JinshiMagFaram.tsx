
import React, { useState } from 'react';
import { Plus, Trash2, Printer } from 'lucide-react';

interface MagItem {
  id: string;
  name: string;
  description: string;
  unit: string;
  quantity: string;
  remarks: string;
}

export const JinshiMagFaram: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState('2081/82');
  const [items, setItems] = useState<MagItem[]>([
    { id: '1', name: '', description: '', unit: '', quantity: '', remarks: '' }
  ]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: '', description: '', unit: '', quantity: '', remarks: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof MagItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1200px] mx-auto bg-white p-8 rounded-xl shadow-sm min-h-screen">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden; }
          #mag-faram, #mag-faram * { visibility: visible; }
          #mag-faram { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          input { border: none !important; background: transparent !important; }
        }
      `}</style>

      <div id="mag-faram">
        <div className="text-center mb-8">
          <h4 className="font-bold text-sm">नेपाल सरकार</h4>
          <h4 className="font-bold text-sm">................ मन्त्रालय / विभाग / कार्यालय</h4>
          <h2 className="font-bold text-xl mt-2 border-b-2 border-black inline-block pb-1">माग फारम</h2>
          <div className="text-right text-sm mt-4 font-bold">म.ले.प.फा.नं: ४०१</div>
        </div>

        <div className="flex justify-between items-end mb-4 font-medium text-sm">
          <div>आर्थिक वर्ष: <input className="border-b border-dotted border-black w-32 focus:outline-none" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} /></div>
          <div>निकासी नं: ....................</div>
        </div>

        <div className="mb-4 text-sm font-medium">
          श्री .............................................
          <br/>
          ...................................................
          <br/>
          (मालसामान बुझाउने कार्यालय वा व्यक्तिको नाम)
        </div>

        <div className="text-sm mb-4">
          तल लेखिए बमोजिमका सामानहरू आवश्यक परेको हुँदा उपलब्ध गराइदिनु हुन अनुरोध छ ।
        </div>

        <table className="w-full border-collapse border border-black text-center text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-16">क्र.सं.</th>
              <th className="border border-black p-2">सामानको नाम</th>
              <th className="border border-black p-2">विवरण (Specification)</th>
              <th className="border border-black p-2 w-24">एकाइ</th>
              <th className="border border-black p-2 w-24">माग परिमाण</th>
              <th className="border border-black p-2">कैफियत</th>
              <th className="border border-black p-2 w-12 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black p-2">{index + 1}</td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} /></td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} /></td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none text-center" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} /></td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none text-center" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} /></td>
                <td className="border border-black p-1"><input className="w-full p-1 outline-none" value={item.remarks} onChange={(e) => updateItem(index, 'remarks', e.target.value)} /></td>
                <td className="border border-black p-1 no-print">
                  <button onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2 no-print">
          <button onClick={addItem} className="flex items-center gap-1 text-sm text-teal-600 font-bold hover:bg-teal-50 px-3 py-1 rounded border border-teal-200">
            <Plus className="w-4 h-4" /> लहर थप्नुहोस् (Add Row)
          </button>
        </div>

        <div className="mt-16 flex justify-between text-sm font-medium">
          <div className="text-center w-48">
            <div className="border-t border-dotted border-black pt-1">माग गर्नेको सही</div>
            <div className="mt-2">नाम: ..............................</div>
            <div>मिति: ..............................</div>
          </div>
          <div className="text-center w-48">
            <div className="border-t border-dotted border-black pt-1">सिफारिस गर्नेको सही</div>
            <div className="mt-2">नाम: ..............................</div>
            <div>मिति: ..............................</div>
          </div>
          <div className="text-center w-48">
            <div className="border-t border-dotted border-black pt-1">आदेश दिनेको सही</div>
            <div className="mt-2">नाम: ..............................</div>
            <div>मिति: ..............................</div>
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
