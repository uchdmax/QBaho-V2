"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Plus, X, Save, Eye, EyeOff, LayoutList, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';

type Department = {
  id: number;
  code: string;
  name: string;
  type: string;
  floor: number | null;
  icon: string | null;
  color: string | null;
  bg: string | null;
  order: number | null;
  active: boolean;
  parentId?: number | null;
  parent?: { id: number; code: string; name: string } | null;
  children?: { id: number; code: string; name: string }[];
  criteria?: { id: number, name: string }[];
  criteriaIds?: number[];
};

export default function DepartmentsClient() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [allCriteria, setAllCriteria] = useState<{id: number, name: string}[]>([]);
  const { addToast, ToastContainer } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'general', 'floor'
  const [floorFilter, setFloorFilter] = useState('all'); // 'all', '1', '2', '3'...
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [sortField, setSortField] = useState<'name' | 'code' | 'type' | 'order' | 'active'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Statsionar display order state for patient view
  const [statsionarOrder, setStatsionarOrder] = useState<'special_first' | 'floors_first'>('special_first');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  const availableFloors = useMemo(() => {
    const set = new Set<number>();
    departments.forEach(d => {
      if (d.floor !== null && d.floor !== undefined) {
        set.add(d.floor);
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [departments]);

  const handleSort = (field: 'name' | 'code' | 'type' | 'order' | 'active') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredDepartments = useMemo(() => {
    let result = departments.filter((dept) => {
      // 1. Search Query (name, code, floor)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = dept.name.toLowerCase().includes(q);
        const matchesCode = dept.code.toLowerCase().includes(q);
        const matchesFloor = dept.floor !== null && `${dept.floor}`.includes(q);
        if (!matchesName && !matchesCode && !matchesFloor) return false;
      }

      // 2. Type Filter
      if (typeFilter !== 'all' && dept.type !== typeFilter) {
        return false;
      }

      // 3. Floor Filter
      if (floorFilter !== 'all') {
        if (dept.floor === null || dept.floor === undefined || String(dept.floor) !== floorFilter) {
          return false;
        }
      }

      // 4. Status Filter
      if (statusFilter === 'active' && !dept.active) return false;
      if (statusFilter === 'inactive' && dept.active) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sortField === 'name') {
        const diff = a.name.localeCompare(b.name, 'uz', { numeric: true, sensitivity: 'base' });
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortField === 'code') {
        const diff = a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortField === 'type') {
        const diff = a.type.localeCompare(b.type);
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortField === 'order') {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      }
      if (sortField === 'active') {
        const valA = a.active ? 1 : 0;
        const valB = b.active ? 1 : 0;
        return sortOrder === 'asc' ? valB - valA : valA - valB;
      }
      return 0;
    });

    return result;
  }, [departments, searchQuery, typeFilter, floorFilter, statusFilter, sortField, sortOrder]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredDepartments.length / pageSize);
  const currentDepartments = pageSize === -1 
    ? filteredDepartments 
    : filteredDepartments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, floorFilter, statusFilter, sortField, sortOrder, pageSize]);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Department>>({
    code: '',
    name: '',
    type: 'general',
    floor: null,
    icon: '',
    color: 'text-[#0A9C54]',
    bg: 'bg-[#0A9C54]/10',
    order: 0,
    active: true,
    parentId: null,
    criteriaIds: [] as number[],
  });

  useEffect(() => {
    fetchDepartments();
    fetchAllCriteria();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.statsionarOrder) {
          setStatsionarOrder(data.statsionarOrder);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleUpdateStatsionarOrder = async (newOrder: 'special_first' | 'floors_first') => {
    if (statsionarOrder === newOrder) return;
    setStatsionarOrder(newOrder);
    setIsUpdatingOrder(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statsionarOrder: newOrder }),
      });
      if (res.ok) {
        addToast(
          newOrder === 'special_first' 
            ? "Statsionarda: Maxsus bo'limlar yuqoriga qo'yildi" 
            : "Statsionarda: Qavatlar va palatalar yuqoriga qo'yildi", 
          "success"
        );
      } else {
        addToast("Sozlamani saqlashda xatolik yuz berdi", "error");
        fetchSettings();
      }
    } catch (error) {
      addToast("Tarmoq xatoligi yuz berdi", "error");
      fetchSettings();
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const fetchAllCriteria = async () => {
    try {
      const res = await fetch('/api/criteria');
      if (res.ok) {
        setAllCriteria(await res.json());
      }
    } catch (error) {}
  };

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/departments?all=true');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setFormData({
        ...dept,
        parentId: dept.parentId ?? null,
        criteriaIds: dept.criteria?.map(c => c.id) || []
      });
      setIsEditing(true);
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'general',
        floor: null,
        icon: '',
        color: 'text-[#0A9C54]',
        bg: 'bg-[#0A9C54]/10',
        order: 0,
        active: true,
        parentId: null,
        criteriaIds: [],
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/departments?id=${formData.id}` : '/api/departments';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = { ...formData };
      if (payload.type === 'general') {
        payload.floor = null;
      }
      payload.parentId = payload.parentId ? Number(payload.parentId) : null;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        handleCloseModal();
        addToast("Muvaffaqiyatli saqlandi", "success");
        fetchDepartments();
      } else {
        addToast("Saqlashda xatolik yuz berdi", "error");
      }
    } catch (error) {
      console.error('Error saving department:', error);
      addToast("Tarmoq xatoligi yuz berdi", "error");
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/departments?id=${deleteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast("Muvaffaqiyatli o'chirildi", "success");
        fetchDepartments();
      } else {
        addToast("O'chirishda xatolik yuz berdi", "error");
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      addToast("Tarmoq xatoligi yuz berdi", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (dept: Department) => {
    try {
      const res = await fetch(`/api/departments?id=${dept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !dept.active }),
      });
      if (res.ok) {
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error toggling active state:', error);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <ConfirmModal 
        isOpen={deleteId !== null}
        title="O'chirishni tasdiqlang"
        message="Rostdan ham ushbu bo'limni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bo'limlar</h2>
          <p className="text-sm text-slate-500 mt-1">Klinika bo'limlarini boshqarish va tartibga solish</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#0A9C54] hover:bg-[#088246] text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
        >
          <Plus size={20} />
          <span>Yangi qo'shish</span>
        </button>
      </div>

      {/* Statsionar Tartibi Sozlamasi (Bemor ekrani uchun) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#0A9C54] flex items-center justify-center flex-shrink-0">
            <ArrowUpDown size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
              Bemor ekrani: Statsionar bo'limlar tartibi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bemor statsionar bo'limini ochganda qaysi blok yuqorida ko'rinishini tanlang
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleUpdateStatsionarOrder('special_first')}
            disabled={isUpdatingOrder}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              statsionarOrder === 'special_first'
                ? 'bg-white text-[#0A9C54] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⭐</span>
            <span>Maxsus bo'limlar birinchi</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdateStatsionarOrder('floors_first')}
            disabled={isUpdatingOrder}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              statsionarOrder === 'floors_first'
                ? 'bg-white text-[#0A9C54] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🛏️</span>
            <span>Qavatlar birinchi</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Bo'lim nomi yoki kodidan qidiring..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Turi filtri */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase">Turi:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3.5 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">Barcha turlar</option>
                <option value="general">Ambulator (Umumiy)</option>
                <option value="floor">Statsionar (Qavat / Palata)</option>
                <option value="special">Statsionar (Maxsus bo'lim)</option>
              </select>
            </div>

            {/* Qavat filtri (Statsionar xonalar uchun) */}
            {availableFloors.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase">Qavat:</span>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3.5 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="all">Barcha qavatlar</option>
                  {availableFloors.map((fl) => (
                    <option key={fl} value={String(fl)}>
                      {fl}-qavat
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Holati filtri */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase">Holati:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3.5 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">Barchasi</option>
                <option value="active">🟢 Faol</option>
                <option value="inactive">⚪ Nofaol</option>
              </select>
            </div>

            {/* Ko'rsatish soni */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase">Ko'rsatish:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl py-2.5 px-3.5 focus:outline-none cursor-pointer font-medium"
              >
                <option value="10">10 tadan</option>
                <option value="20">20 tadan</option>
                <option value="40">40 tadan</option>
                <option value="50">50 tadan</option>
                <option value="-1">Barchasi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100 font-extrabold tracking-wider">
                <th scope="col" className="px-4 py-4 w-12 text-center select-none">№</th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('name')}
                  className={`px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group ${
                    sortField === 'name' ? 'bg-[#0A9C54]/5 text-[#0A9C54]' : ''
                  }`}
                  title="Bo'lim nomi bo'yicha saralash (A-Z / Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'name' ? 'font-black text-[#0A9C54]' : ''}>Bo'lim nomi</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" /> : <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('code')}
                  className={`px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group ${
                    sortField === 'code' ? 'bg-[#0A9C54]/5 text-[#0A9C54]' : ''
                  }`}
                  title="Kodi bo'yicha tabiiy tartiblash (1, 2, 3... 10, 20)"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'code' ? 'font-black text-[#0A9C54]' : ''}>Kodi</span>
                    {sortField === 'code' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" /> : <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('type')}
                  className={`px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group ${
                    sortField === 'type' ? 'bg-[#0A9C54]/5 text-[#0A9C54]' : ''
                  }`}
                  title="Turi bo'yicha saralash"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'type' ? 'font-black text-[#0A9C54]' : ''}>Turi</span>
                    {sortField === 'type' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" /> : <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('order')}
                  className={`px-6 py-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group ${
                    sortField === 'order' ? 'bg-[#0A9C54]/5 text-[#0A9C54]' : ''
                  }`}
                  title="Tartib raqami bo'yicha saralash"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={sortField === 'order' ? 'font-black text-[#0A9C54]' : ''}>Tartib</span>
                    {sortField === 'order' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" /> : <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('active')}
                  className={`px-6 py-4 text-center cursor-pointer hover:bg-slate-100/80 transition-colors select-none group ${
                    sortField === 'active' ? 'bg-[#0A9C54]/5 text-[#0A9C54]' : ''
                  }`}
                  title="Holati bo'yicha saralash"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={sortField === 'active' ? 'font-black text-[#0A9C54]' : ''}>Holati</span>
                    {sortField === 'active' ? (
                      sortOrder === 'asc' ? <ArrowUp size={14} className="text-[#0A9C54] stroke-[2.5]" /> : <ArrowDown size={14} className="text-[#0A9C54] stroke-[2.5]" />
                    ) : (
                      <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-right select-none">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2 font-medium">
                      <svg className="animate-spin h-5 w-5 text-[#0A9C54]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Yuklanmoqda...
                    </div>
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold text-lg mb-1">Bo'lim topilmadi</p>
                    <p className="text-slate-400 text-sm">Qidiruv so'zini yoki filtrlarni o'zgartirib ko'ring</p>
                  </td>
                </tr>
              ) : (
                currentDepartments.map((dept, idx) => (
                  <tr key={dept.id} className={`hover:bg-[#0A9C54]/5 transition-colors ${!dept.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                      {(currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        {dept.parentId && <span className="text-slate-400 font-normal">↳</span>}
                        <span>{dept.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {dept.floor !== null && <span className="text-xs text-slate-500">{dept.floor}-qavat</span>}
                        {dept.parent && (
                          <span className="inline-flex items-center text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                            Ota bo'lim: {dept.parent.name}
                          </span>
                        )}
                        {dept.children && dept.children.length > 0 && (
                          <span className="inline-flex items-center text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                            🌿 {dept.children.length} ta ichki xona
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-mono font-medium">
                        {dept.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        dept.type === 'general' 
                          ? 'bg-blue-50 text-blue-600' 
                          : dept.type === 'special'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                            : 'bg-purple-50 text-purple-600'
                      }`}>
                        {dept.type === 'general' ? 'Ambulator' : dept.type === 'special' ? "⭐ Maxsus bo'lim" : 'Statsionar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {dept.order || 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleActive(dept)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          dept.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title={dept.active ? 'Faolni o\'chirish' : 'Faollashtirish'}
                      >
                        {dept.active ? <Eye size={14} /> : <EyeOff size={14} />}
                        {dept.active ? 'Faol' : 'Nofaol'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(dept)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(dept.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500 font-medium">
              Jami: <span className="font-bold text-slate-900">{filteredDepartments.length}</span> ta bo'limdan <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredDepartments.length)}</span> ko'rsatilmoqda
            </div>
            
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all cursor-pointer ${
                      currentPage === i + 1 
                        ? 'bg-[#0A9C54] text-white shadow-md shadow-[#0A9C54]/20' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <LayoutList className="text-[#0A9C54]" size={24} />
                {isEditing ? "Bo'limni tahrirlash" : "Yangi bo'lim qo'shish"}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomi</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Masalan: Kassa"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kodi (inglizcha, harflar)</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                      value={formData.code || ''}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      placeholder="kassa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Turi</label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                      value={formData.type || 'general'}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="general">Ambulator (Umumiy bo'lim: Reception, Kassa, UZI...)</option>
                      <option value="floor">Statsionar — Qavat / Palata (3, 4, 5, 6-qavat va xonalar)</option>
                      <option value="special">Statsionar — Maxsus bo'lim (Tug'ruqxona, Neonatologiya, Reanimatsiya...)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ota bo'lim (Ixtiyoriy)</label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                      value={formData.parentId ?? ''}
                      onChange={e => setFormData({...formData, parentId: e.target.value ? parseInt(e.target.value) : null})}
                    >
                      <option value="">-- Asosiy bo'lim (Ota bo'lim yo'q) --</option>
                      {departments
                        .filter(d => (!formData.id || d.id !== formData.id) && !d.parentId)
                        .map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code}) {d.type === 'floor' ? '— Statsionar' : d.type === 'special' ? '— Maxsus' : '— Ambulator'}
                          </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Misol: "1-UZI" uchun "UZI"ni, yoki "301-xona" uchun "3-qavat"ni ota bo'lim qilib belgilang.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.type === 'floor' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Qavat raqami</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                        value={formData.floor === null ? '' : formData.floor}
                        onChange={e => setFormData({...formData, floor: e.target.value ? parseInt(e.target.value) : null})}
                        placeholder="Masalan: 3"
                      />
                    </div>
                  )}

                  {formData.type === 'special' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Qavat (Ixtiyoriy)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                        value={formData.floor === null ? '' : formData.floor}
                        onChange={e => setFormData({...formData, floor: e.target.value ? parseInt(e.target.value) : null})}
                        placeholder="Masalan: 2 (agar mavjud bo'lsa)"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ranglar (Tailwind klasslari)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                        value={formData.bg || ''}
                        onChange={e => setFormData({...formData, bg: e.target.value})}
                        placeholder="bg-blue-100"
                      />
                      <input 
                        type="text" 
                        className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                        value={formData.color || ''}
                        onChange={e => setFormData({...formData, color: e.target.value})}
                        placeholder="text-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ko'rinish tartibi (raqam)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0A9C54] focus:ring-1 focus:ring-[#0A9C54]"
                      value={formData.order || 0}
                      onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Baholash Mezonlari (Pichka qiling)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                  {allCriteria.map(c => {
                    const isChecked = formData.criteriaIds?.includes(c.id) || false;
                    return (
                      <label key={c.id} className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${isChecked ? 'border-[#0A9C54] bg-[#0A9C54]/5 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex h-5 items-center flex-shrink-0 mt-0.5">
                          <input 
                            type="checkbox"
                            className="w-4.5 h-4.5 text-[#0A9C54] rounded border-slate-300 focus:ring-[#0A9C54] focus:ring-2 cursor-pointer"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                criteriaIds: checked 
                                  ? [...(prev.criteriaIds || []), c.id]
                                  : (prev.criteriaIds || []).filter((id: number) => id !== c.id)
                              }));
                            }}
                          />
                        </div>
                        <span className={`text-[13.5px] font-bold leading-snug ${isChecked ? 'text-[#0A9C54]' : 'text-slate-600'}`}>{c.name}</span>
                      </label>
                    );
                  })}
                  {allCriteria.length === 0 && (
                    <div className="text-sm text-slate-500 col-span-full py-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      Hali hech qanday mezon qo'shilmagan. Avval "Mezonlar" bo'limidan qo'shing.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-medium text-white bg-[#0A9C54] hover:bg-[#088246] transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
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
