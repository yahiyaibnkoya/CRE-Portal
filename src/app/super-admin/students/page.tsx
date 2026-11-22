'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Student, StudentStatus } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Users,
  Search,
  Filter,
  Phone,
  Calendar,
  Building,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Plus,
  X,
  IndianRupee,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function SuperAdminStudentsPage() {
  const { refreshData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Boy' | 'Girl'>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToToggleStatus, setStudentToToggleStatus] = useState<Student | null>(null);

  // Form State
  const [formCenterId, setFormCenterId] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Boy' | 'Girl'>('Boy');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [place, setPlace] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [defaultFee, setDefaultFee] = useState<number>(100);
  const [status, setStatus] = useState<StudentStatus>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  const centers = dataService.getCenters();
  const allStudents = dataService.getStudents();

  // Filter calculations
  const filteredStudents = allStudents.filter((s) => {
    if (centerFilter !== 'ALL' && s.centerId !== centerFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (genderFilter !== 'ALL' && s.gender !== genderFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchAdm = s.admissionNumber.toLowerCase().includes(q);
      const matchParent = s.parentName.toLowerCase().includes(q);
      const matchPhone = (s.parentPhone || '').includes(q) || (s.studentPhone || '').includes(q);
      const matchPlace = (s.place || '').toLowerCase().includes(q);
      return matchName || matchAdm || matchParent || matchPhone || matchPlace;
    }
    return true;
  });

  const totalCount = allStudents.length;
  const activeCount = allStudents.filter((s) => s.status === 'Active').length;
  const inactiveCount = allStudents.filter((s) => s.status === 'Inactive').length;
  const boysCount = allStudents.filter((s) => s.gender === 'Boy').length;
  const girlsCount = allStudents.filter((s) => s.gender === 'Girl').length;

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormCenterId(centers[0]?.id || '');
    setName('');
    setGender('Boy');
    setParentName('');
    setParentPhone('');
    setStudentPhone('');
    setPlace('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setDefaultFee(100);
    setStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormCenterId(s.centerId);
    setName(s.name);
    setGender(s.gender || 'Boy');
    setParentName(s.parentName);
    setParentPhone(s.parentPhone || '');
    setStudentPhone(s.studentPhone || '');
    setPlace(s.place);
    setAdmissionDate(s.admissionDate);
    setDefaultFee(s.defaultFee);
    setStatus(s.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCenterId) {
      setFormError('Please select a CRE Centre.');
      return;
    }
    if (!name.trim()) {
      setFormError('Student full name is required.');
      return;
    }
    if (!parentName.trim()) {
      setFormError('Parent / Guardian name is required.');
      return;
    }

    dataService.saveStudent(
      {
        id: editingStudent?.id,
        centerId: formCenterId,
        name: name.trim(),
        gender,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        studentPhone: studentPhone.trim(),
        place: place.trim(),
        admissionDate,
        defaultFee: Number(defaultFee) || 100,
        status,
      },
      'Super Admin'
    );

    setIsModalOpen(false);
    refreshData();
  };

  const handleConfirmToggleStatus = () => {
    if (!studentToToggleStatus) return;
    const nextStatus: StudentStatus = studentToToggleStatus.status === 'Active' ? 'Inactive' : 'Active';
    dataService.setStudentStatus(studentToToggleStatus.id, nextStatus, 'Super Admin');
    setStudentToToggleStatus(null);
    refreshData();
  };

  const handleConfirmDeleteStudent = () => {
    if (!studentToDelete) return;
    dataService.deleteStudent(studentToDelete.id, 'Super Admin');
    setStudentToDelete(null);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy tracking-tight">
              Statewide Student Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive student master directory with full statewide administrative control
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={centers.length === 0}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Student
          </button>
        </div>

        {/* Dynamic Exciting Filter Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setGenderFilter('ALL');
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              statusFilter === 'ALL' && genderFilter === 'ALL'
                ? 'bg-cre-navy text-white border-cre-navy shadow-md ring-2 ring-cre-navy/20'
                : 'bg-white text-slate-800 border-cre-border hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Total</span>
            <p className="text-2xl font-black mt-1">{totalCount}</p>
            <p className="text-[10px] opacity-70 mt-0.5">All Enrolled</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Active')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              statusFilter === 'Active'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white text-slate-800 border-cre-border hover:border-emerald-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Active</span>
            <p className="text-2xl font-black mt-1">{activeCount}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Currently Enrolled</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Inactive')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              statusFilter === 'Inactive'
                ? 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-600/20'
                : 'bg-white text-slate-800 border-cre-border hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Inactive</span>
            <p className="text-2xl font-black mt-1">{inactiveCount}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Discontinued</p>
          </button>

          <button
            type="button"
            onClick={() => setGenderFilter('Boy')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              genderFilter === 'Boy'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                : 'bg-white text-slate-800 border-cre-border hover:border-blue-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">👦 Boys</span>
            <p className="text-2xl font-black mt-1">{boysCount}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Male Students</p>
          </button>

          <button
            type="button"
            onClick={() => setGenderFilter('Girl')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              genderFilter === 'Girl'
                ? 'bg-pink-600 text-white border-pink-600 shadow-md ring-2 ring-pink-500/20'
                : 'bg-white text-slate-800 border-cre-border hover:border-pink-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">👧 Girls</span>
            <p className="text-2xl font-black mt-1">{girlsCount}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Female Students</p>
          </button>
        </div>

        {/* Dynamic Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students by name, admission no, phone, place..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Centre Selector */}
            <div className="sm:col-span-3">
              <select
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-cre-green outline-hidden cursor-pointer"
              >
                <option value="ALL">🏛 All CRE Centres ({centers.length})</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.place})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Reset */}
            <div className="sm:col-span-3 flex justify-end">
              {(centerFilter !== 'ALL' || statusFilter !== 'ALL' || genderFilter !== 'ALL' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setCenterFilter('ALL');
                    setStatusFilter('ALL');
                    setGenderFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Students Table with Sl. No. and proper Admission No. */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Student & Gender</th>
                  <th className="py-3 px-4">Admission No.</th>
                  <th className="py-3 px-4">Parent / Phone</th>
                  <th className="py-3 px-4">Centre / Place</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((s, idx) => {
                  const center = centers.find((c) => c.id === s.centerId);
                  const att = dataService.calculateStudentAttendance(s.id, s.centerId);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Serial Number */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Student Name & Gender */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              s.gender === 'Girl'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-cre-navy text-xs">{s.name}</p>
                            <span
                              className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                s.gender === 'Girl' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {s.gender || 'Boy'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Admission Number (Internal Reference) */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {s.admissionNumber}
                        </span>
                      </td>

                      {/* Parent & Phone */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{s.parentName}</p>
                        <p className="text-[11px] font-mono text-slate-500">{s.parentPhone || s.studentPhone || 'No Phone'}</p>
                      </td>

                      {/* Centre & Place */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-cre-navy">{center?.name || 'Unassigned'}</p>
                        <p className="text-[10px] text-slate-400">{s.place || center?.place || '—'}</p>
                      </td>

                      {/* Attendance % */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            att.percentage >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : att.percentage >= 60
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {att.percentage}% ({att.present}/{att.totalConducted})
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => setViewingStudent(s)}
                            className="p-1.5 text-slate-500 hover:text-cre-navy hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-cre-green hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Student Information"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentToToggleStatus(s)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              s.status === 'Active'
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-cre-green hover:bg-cre-green-light'
                            }`}
                            title={s.status === 'Active' ? 'Mark Inactive' : 'Reactivate Student'}
                          >
                            {s.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentToDelete(s)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No students found matching your criteria.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Add New Student&quot; to enroll students.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT STUDENT MODAL FOR SUPER ADMIN */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cre-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cre-green-light text-cre-green">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-cre-navy">
                      {editingStudent ? 'Edit Student Details' : 'Register New Student'}
                    </h3>
                    <p className="text-[11px] text-slate-500">Statewide Super Admin Student Management</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveStudent} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned CRE Centre *
                  </label>
                  <select
                    required
                    value={formCenterId}
                    onChange={(e) => setFormCenterId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-bold text-cre-navy focus:ring-2 focus:ring-cre-green outline-hidden"
                  >
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.place})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Muhammed Rayan"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'Boy' | 'Girl')}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-bold focus:ring-2 focus:ring-cre-green outline-hidden"
                    >
                      <option value="Boy">Boy</option>
                      <option value="Girl">Girl</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Abdul Kareem"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="e.g. 9876500000"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Place / Locality
                    </label>
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="e.g. Manjeri"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admission Date
                    </label>
                    <input
                      type="date"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Monthly Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={defaultFee}
                      onChange={(e) => setDefaultFee(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StudentStatus)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-bold focus:ring-2 focus:ring-cre-green outline-hidden"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-cre-border flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                  >
                    {editingStudent ? 'Update Student' : 'Enroll Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STUDENT DETAILS PROFILE MODAL */}
        {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-cre-green-light text-cre-green flex items-center justify-center font-bold text-sm">
                    {viewingStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-cre-navy">{viewingStudent.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${viewingStudent.gender === 'Girl' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                        {viewingStudent.gender || 'Boy'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Internal Adm No: <span className="font-mono font-bold text-cre-navy">{viewingStudent.admissionNumber}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingStudent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Parent / Guardian:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.parentName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Parent Phone:</span>
                  <span className="font-semibold font-mono text-slate-800">{viewingStudent.parentPhone || 'Not Registered'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Student Phone:</span>
                  <span className="font-semibold font-mono text-slate-800">{viewingStudent.studentPhone || 'Not Registered'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Place / Locality:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.place || '—'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Admission Date:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.admissionDate}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Monthly Fee:</span>
                  <span className="font-bold text-cre-green">₹{viewingStudent.defaultFee} / month</span>
                </div>
              </div>

              {/* Attendance & Exams summary */}
              <div className="p-3 bg-cre-navy-light rounded-xl border border-cre-navy/10 text-xs">
                <span className="font-bold text-cre-navy block mb-1">Academic & Attendance Summary</span>
                {(() => {
                  const att = dataService.calculateStudentAttendance(viewingStudent.id, viewingStudent.centerId);
                  const marks = dataService.getExamMarks(viewingStudent.centerId, undefined, viewingStudent.id);
                  return (
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div>Conducted Classes: <span className="font-bold">{att.totalConducted}</span></div>
                      <div>Attendance Rate: <span className="font-bold text-cre-green">{att.percentage}%</span></div>
                      <div>Present: <span className="font-bold">{att.present}</span> | Absent: <span className="font-bold">{att.absent}</span></div>
                      <div>Exam Records: <span className="font-bold">{marks.length} Subjects</span></div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-cre-navy bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM TOGGLE STATUS MODAL */}
        <ConfirmModal
          isOpen={!!studentToToggleStatus}
          title={studentToToggleStatus?.status === 'Active' ? 'Mark Student as Inactive' : 'Reactivate Student'}
          message={
            <span>
              Are you sure you want to mark student <strong>{studentToToggleStatus?.name}</strong> as{' '}
              <strong>{studentToToggleStatus?.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
            </span>
          }
          confirmText={studentToToggleStatus?.status === 'Active' ? 'Mark Inactive' : 'Activate'}
          isDanger={studentToToggleStatus?.status === 'Active'}
          onConfirm={handleConfirmToggleStatus}
          onClose={() => setStudentToToggleStatus(null)}
        />

        {/* CONFIRM DELETE MODAL */}
        <ConfirmModal
          isOpen={!!studentToDelete}
          title="Delete Student Record"
          message={
            <span>
              Are you sure you want to permanently delete student <strong>{studentToDelete?.name}</strong> ({studentToDelete?.admissionNumber})? This action cannot be undone.
            </span>
          }
          confirmText="Delete Student"
          isDanger={true}
          onConfirm={handleConfirmDeleteStudent}
          onClose={() => setStudentToDelete(null)}
        />
      </div>
    </AppShell>
  );
}
