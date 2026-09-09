"use client";

import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function EmployeesClient({ initialEmployees }: { initialEmployees: any[] }) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [depts, setDepts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { addToast, ToastContainer } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/departments?all=true');
      if (res.ok) {
        const data = await res.json();
        setDepts(data);
      }
    })();
  }, []);

  const defaultDeptId = depts.length > 0 ? depts[0].id : null;
  const [departmentId, setDepartmentId] = useState<number | null>(defaultDeptId);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('Shifokor');
  
  const getDeptName = (id: number | null) => {
    if (!id) return '';
    const dept = depts.find((d) => d.id === id);
    return dept ? dept.name : String(id);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/employees/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployees(employees.filter(e => e.id !== deleteId));
        addToast("Muvaffaqiyatli o'chirildi", "success");
        router.refresh();
      } else {
        addToast("O'chirishda xatolik yuz berdi", "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Tarmoq xatoligi yuz berdi", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setDepartmentId(defaultDeptId);
    setPosition('Shifokor');
    setShowModal(true);
  };

  const handleEditClick = (e: any) => {
    setEditingId(e.id);
    setFirstName(e.firstName);
    setLastName(e.lastName);
    setDepartmentId(e.departmentId);
    setPosition(e.position || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `/api/employees/${editingId}` : '/api/employees';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, departmentId, position })
      });
      if (res.ok) {
        const { employee } = await res.json();
        if (editingId) {
          setEmployees(employees.map((emp: any) => emp.id === editingId ? employee : emp));
        } else {
          setEmployees([employee, ...employees]);
        }
        setShowModal(false);
        addToast(editingId ? "Muvaffaqiyatli tahrirlandi" : "Muvaffaqiyatli qo'shildi", "success");
        router.refresh();
      } else {
        addToast("Saqlashda xatolik yuz berdi", "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Tarmoq xatoligi yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ToastContainer />
      <ConfirmModal 
        isOpen={deleteId !== null}
        title="O'chirishni tasdiqlang"
        message="Rostdan ham ushbu xodimni o'chirmoqchimisiz?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="flex justify-end mb-6">
        <button 
          onClick={handleAddNewClick}
          className="bg-[#0A9C54] hover:bg-[#088246] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={20} />
          Yangi xodim qo'shish
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100 font-bold">
              <tr>
                <th scope="col" className="px-6 py-4">Ism familiya</th>
                <th scope="col" className="px-6 py-4">Bo'lim</th>
                <th scope="col" className="px-6 py-4">Lavozimi</th>
                <th scope="col" className="px-6 py-4 text-right">Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e: any) => (
                <tr key={e.id} className="bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {e.firstName} {e.lastName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                      {getDeptName(e.departmentId)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {e.position}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEditClick(e)}
                      className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-all mr-1"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(e.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">
                    Hali xodimlar kiritilmagan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              {editingId ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ism</label>
                <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0A9C54]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Familiya</label>
                <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0A9C54]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bo'lim</label>
                <select value={departmentId || ''} onChange={e => setDepartmentId(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0A9C54]">
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Lavozimi</label>
                <input 
                  type="text" 
                  value={position} 
                  onChange={e => setPosition(e.target.value)} 
                  placeholder="Masalan: Shifokor, Hamshira, Ginekolog"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0A9C54]" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">Bekor qilish</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#0A9C54] text-white py-3 rounded-xl font-bold hover:bg-[#088246] transition-all disabled:opacity-50">
                  {editingId ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
