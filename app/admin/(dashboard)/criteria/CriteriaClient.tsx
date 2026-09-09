"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Criterion {
  id: number;
  name: string;
  options?: string | null;
}

export default function CriteriaClient() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Criterion | null>(null);
  const [name, setName] = useState('');
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const { addToast, ToastContainer } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    try {
      const res = await fetch('/api/criteria');
      const data = await res.json();
      setCriteria(data);
    } catch (error) {
      addToast('Mezonlarni yuklashda xatolik', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;
    if (optionsList.length >= 8) {
      addToast("Maksimal 8 tagacha qisqa javob kiritish mumkin", "warning");
      return;
    }
    if (optionsList.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
      addToast("Bu javob varianti allaqachon qo'shilgan", "warning");
      return;
    }
    setOptionsList([...optionsList, trimmed]);
    setNewOptionInput('');
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === optionsList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...optionsList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setOptionsList(updated);
  };

  const removeOption = (index: number) => {
    setOptionsList(optionsList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return addToast('Nomini kiriting', 'warning');

    try {
      const url = editingItem ? `/api/criteria/${editingItem.id}` : '/api/criteria';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          options: optionsList.length > 0 ? JSON.stringify(optionsList) : null
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      addToast('Saqlandi', 'success');
      setIsModalOpen(false);
      resetForm();
      fetchCriteria();
    } catch (error) {
      addToast('Xatolik yuz berdi', 'error');
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const res = await fetch(`/api/criteria/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      addToast('O\'chirildi', 'success');
      fetchCriteria();
    } catch (error) {
      addToast('Xatolik yuz berdi', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setName('');
    setOptionsList([]);
    setNewOptionInput('');
  };

  const openEditModal = (item: Criterion) => {
    setEditingItem(item);
    setName(item.name);
    if (item.options) {
      try {
        const parsed = JSON.parse(item.options);
        setOptionsList(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setOptionsList(item.options.split(',').map(s => s.trim()).filter(Boolean));
      }
    } else {
      setOptionsList([]);
    }
    setNewOptionInput('');
    setIsModalOpen(true);
  };

  return (
    <div>
      <ToastContainer />
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Mezonni o'chirish"
        message="Haqiqatan ham bu mezonni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Baholash mezonlari</h1>
          <p className="text-sm text-slate-500 font-medium">Bemorlar baholaydigan savollar va tayyor javob variantlari</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0A9C54] hover:bg-[#088647] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <Plus size={18} />
          Yangi mezon
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400 font-medium">Yuklanmoqda...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Mezon / Savol matni</th>
                <th className="px-6 py-4">Tugma variantlari</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {criteria.map((item) => {
                let optionsList: string[] = [];
                if (item.options) {
                  try {
                    const parsed = JSON.parse(item.options);
                    if (Array.isArray(parsed)) optionsList = parsed;
                  } catch (e) {}
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{item.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4">
                      {optionsList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {optionsList.map((opt, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Variantlar yo'q (Standart)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg mr-2 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {criteria.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Hali mezonlar qo'shilmagan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800">
                {editingItem ? 'Mezonni tahrirlash' : 'Yangi mezon qo\'shish'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Savol yoki Mezon nomi *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Shifokor xonangizga necha marta kirdi?"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0A9C54] focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Qisqa javob tugmalari (Maks. 8 ta)
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    optionsList.length >= 8 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {optionsList.length} / 8 ta
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  Har bir javobni yozib <b>+</b> tugmasini yoki <b>Enter</b> ni bosing. Ketma-ketlikni <b>↑ / ↓</b> bilan boshqaring.
                </p>

                {/* Input and Add button */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    disabled={optionsList.length >= 8}
                    placeholder={optionsList.length >= 8 
                      ? "Maksimal 8 ta variant kiritildi" 
                      : "Qisqa javob matni (masalan: 1 marta)..."
                    }
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0A9C54] focus:border-transparent outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={!newOptionInput.trim() || optionsList.length >= 8}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0A9C54] hover:bg-[#088647] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-xs cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                    title="Variant qo'shish"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Qo'shish</span>
                  </button>
                </div>

                {/* Cards List with order controls */}
                {optionsList.length > 0 ? (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 mb-3">
                    {optionsList.map((opt, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 text-[11px] font-black flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-800 truncate">
                            {opt}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Move Up */}
                          <button
                            type="button"
                            onClick={() => moveOption(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                            title="Oldinga surish"
                          >
                            <ArrowUp size={15} />
                          </button>
                          {/* Move Down */}
                          <button
                            type="button"
                            onClick={() => moveOption(index, 'down')}
                            disabled={index === optionsList.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                            title="Keyinga surish"
                          >
                            <ArrowDown size={15} />
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
                            title="O'chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 mb-3 font-medium">
                    Hozircha javob variantlari qo'shilmagan. <br />
                    (Bo'sh qoldirilsa, bemorga erkin matn yoki ovozli xabar formasi chiqadi)
                  </div>
                )}

                {/* Live Preview of Patient View (2-rasmdagidek) */}
                {optionsList.length > 0 && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0A9C54] block mb-2">
                      Bemor ko'rinishi (Jonli prevyu):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {optionsList.map((opt, i) => (
                        <div 
                          key={i} 
                          className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl shadow-2xs"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0A9C54] hover:bg-[#088647] text-white rounded-xl transition-all font-bold text-sm shadow-md"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
