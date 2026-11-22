'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Faculty, FacultyStatus } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Award,
  X,
  Building,
  Check,
} from 'lucide-react';

export default function SuperAdminFacultiesPage() {
  const { refreshData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FacultyStatus>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [qualification, setQualification] = useState('');
  const [status, setStatus] = useState<FacultyStatus>('Approved');
  const [notes, setNotes] = useState('');
  const [selectedCenterIds, setSelectedCenterIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const faculties = dataService.getFaculties();
  const centers = dataService.getCenters();

  const filteredFaculties = faculties.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchPhone = (f.phone || '').includes(q);
      const matchPlace = (f.place || '').toLowerCase().includes(q);
      const matchQual = (f.qualification || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchPlace || matchQual;
    }
    return true;
  });

  const totalCount = faculties.length;
  const approvedCount = faculties.filter((f) => f.status === 'Approved').length;
  const pendingCount = faculties.filter((f) => f.status === 'Pending').length;

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setName('');
    setPhone('');
    setPlace('');
    setQualification('');
    setStatus('Approved');
    setNotes('');
    setSelectedCenterIds([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setName(faculty.name);
    setPhone(faculty.phone);
    setPlace(faculty.place || '');
    setQualification(faculty.qualification || '');
    setStatus(faculty.status);
    setNotes(faculty.notes || '');
    setSelectedCenterIds(faculty.assignedCenterIds || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Please enter faculty name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter mobile phone number.');
      return;
    }

    dataService.saveFaculty(
      {
        id: editingFaculty?.id,
        name: name.trim(),
        phone: phone.trim(),
        place: place.trim(),
        qualification: qualification.trim(),
        status,
        assignedCenterIds: selectedCenterIds,
        notes: notes.trim(),
      },
      'Super Admin'
    );

    setIsModalOpen(false);
    refreshData();
  };

  const handleApprove = (id: string) => {
    dataService.approveFaculty(id, 'Super Admin');
    refreshData();
  };

  const handleConfirmDelete = () => {
    if (!deletingFaculty) return;
    dataService.deleteFaculty(deletingFaculty.id, 'Super Admin');
    setDeletingFaculty(null);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy tracking-tight">
              Statewide Faculty Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage qualified Islamic educators, teaching assignments, and centre approvals
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Faculty
          </button>
        </div>

        {/* Interactive Filter Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'ALL'
                ? 'bg-cre-navy text-white border-cre-navy shadow-md'
                : 'bg-white text-slate-800 border-cre-border hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">All Educators</span>
              <GraduationCap className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-2xl font-black mt-2">{totalCount}</p>
            <p className="text-[11px] opacity-70 mt-0.5">Registered across all centres</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Approved')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Approved'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-slate-800 border-cre-border hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Approved</span>
              <CheckCircle className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-2xl font-black mt-2">{approvedCount}</p>
            <p className="text-[11px] opacity-70 mt-0.5">Active teaching eligibility</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Pending')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Pending'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                : 'bg-white text-slate-800 border-cre-border hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Pending Approval</span>
              <XCircle className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-2xl font-black mt-2">{pendingCount}</p>
            <p className="text-[11px] opacity-70 mt-0.5">Awaiting Super Admin review</p>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-cre-border shadow-xs flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty by name, phone, place, or qualification..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Faculties Table */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Place / Locality</th>
                  <th className="py-3 px-4">Qualification</th>
                  <th className="py-3 px-4">Assigned Centres</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFaculties.map((f, idx) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Serial Number */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                      {idx + 1}
                    </td>

                    {/* Faculty Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-cre-green-light text-cre-green flex items-center justify-center font-bold text-xs shrink-0">
                          {f.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-cre-navy text-xs">{f.name}</p>
                          {f.notes && <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{f.notes}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Contact Phone */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {f.phone || '—'}
                    </td>

                    {/* Place */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-600">{f.place || '—'}</span>
                    </td>

                    {/* Qualification */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-600">{f.qualification || '—'}</span>
                    </td>

                    {/* Assigned Centres */}
                    <td className="py-3.5 px-4">
                      {f.assignedCenterIds && f.assignedCenterIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {f.assignedCenterIds.map((cId) => {
                            const c = centers.find((x) => x.id === cId);
                            return (
                              <span
                                key={cId}
                                className="inline-block px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-semibold"
                              >
                                {c?.name || cId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None assigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {f.status === 'Approved' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {f.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {f.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(f.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve Faculty"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(f)}
                          className="p-1.5 text-slate-500 hover:text-cre-navy hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Faculty Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingFaculty(f)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredFaculties.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No faculties registered in the directory.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Add New Faculty&quot; to register educators.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT FACULTY MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cre-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cre-navy-light text-cre-navy">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-cre-navy">
                      {editingFaculty ? 'Edit Faculty Details' : 'Register New Faculty'}
                    </h3>
                    <p className="text-[11px] text-slate-500">Provide faculty information and teaching qualifications</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveFaculty} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Faculty Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Usthad Abdurahman"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Qualification / Specialization
                    </label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. Afzal-ul-Ulama / Tajweed"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as FacultyStatus)}
                    className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-bold focus:ring-2 focus:ring-cre-green outline-hidden"
                  >
                    <option value="Approved">Approved (Eligible for all centres)</option>
                    <option value="Pending">Pending (Under review)</option>
                  </select>
                </div>

                {/* Assigned Centres */}
                {centers.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned CRE Centres (Optional)
                    </label>
                    <div className="border border-cre-border rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5">
                      {centers.map((c) => (
                        <label key={c.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCenterIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCenterIds([...selectedCenterIds, c.id]);
                              } else {
                                setSelectedCenterIds(selectedCenterIds.filter((id) => id !== c.id));
                              }
                            }}
                            className="rounded-sm text-cre-green focus:ring-cre-green"
                          />
                          <span>{c.name} ({c.place})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notes / Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Available on Sunday mornings"
                    className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                  />
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
                    {editingFaculty ? 'Update Faculty' : 'Save Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE MODAL */}
        <ConfirmModal
          isOpen={!!deletingFaculty}
          title="Delete Faculty Record"
          message={
            <span>
              Are you sure you want to delete faculty member <strong>{deletingFaculty?.name}</strong>? This will remove them from the statewide faculty directory.
            </span>
          }
          confirmText="Yes, Delete"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingFaculty(null)}
        />
      </div>
    </AppShell>
  );
}
