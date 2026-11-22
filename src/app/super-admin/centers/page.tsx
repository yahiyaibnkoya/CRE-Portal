'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Center, CenterStatus, ExamMode } from '@/types';
import { KERALA_DISTRICTS, DAYS_OF_WEEK } from '@/lib/constants';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  X,
  GraduationCap,
} from 'lucide-react';

export default function SuperAdminCentersPage() {
  const { refreshData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');

  // Inline Add Faculty Modal
  const [isAddFacultyModalOpen, setIsAddFacultyModalOpen] = useState(false);
  const [newFacName, setNewFacName] = useState('');
  const [newFacPhone, setNewFacPhone] = useState('');
  const [newFacPlace, setNewFacPlace] = useState('');
  const [newFacQual, setNewFacQual] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);

  // Delete Confirmation Modal
  const [deletingCenter, setDeletingCenter] = useState<Center | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [landmark, setLandmark] = useState('');
  const [state, setState] = useState<'Kerala' | 'Other State'>('Kerala');
  const [district, setDistrict] = useState(KERALA_DISTRICTS[10] || 'Malappuram West');
  const [otherStateName, setOtherStateName] = useState('');
  const [otherDistrictName, setOtherDistrictName] = useState('');
  const [zoneOrUnit, setZoneOrUnit] = useState<'Zone' | 'Unit'>('Zone');
  const [zoneName, setZoneName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [regularDay, setRegularDay] = useState('Sunday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:30');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [facultyName, setFacultyName] = useState('');
  const [contactNumbers, setContactNumbers] = useState<string[]>(['']);
  const [defaultFee, setDefaultFee] = useState<number>(100);
  const [examMode, setExamMode] = useState<ExamMode>('semester');
  const [status, setStatus] = useState<CenterStatus>('Active');

  const centers = dataService.getCenters();
  const approvedFaculties = dataService.getFaculties('Approved');

  const handleCreateInlineFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName.trim()) return;
    const saved = dataService.saveFaculty(
      {
        name: newFacName.trim(),
        phone: newFacPhone.trim(),
        place: newFacPlace.trim(),
        qualification: newFacQual.trim(),
        status: 'Approved',
      },
      'Super Admin'
    );
    setFacultyName(saved.name);
    setNewFacName('');
    setNewFacPhone('');
    setNewFacPlace('');
    setNewFacQual('');
    setIsAddFacultyModalOpen(false);
    refreshData();
  };

  const filteredCenters = centers.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (districtFilter !== 'ALL' && c.district !== districtFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPlace = c.place.toLowerCase().includes(q);
      const matchLandmark = (c.landmark || '').toLowerCase().includes(q);
      const matchDist = (c.district || '').toLowerCase().includes(q);
      const matchZone = (c.zoneName || '').toLowerCase().includes(q);
      return matchName || matchPlace || matchLandmark || matchDist || matchZone;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingCenter(null);
    setName('');
    setPlace('');
    setLandmark('');
    setState('Kerala');
    setDistrict(KERALA_DISTRICTS[10] || 'Malappuram West');
    setOtherStateName('');
    setOtherDistrictName('');
    setZoneOrUnit('Zone');
    setZoneName('');
    setUnitName('');
    setRegularDay('Sunday');
    setStartTime('09:00');
    setEndTime('11:30');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setFacultyName('');
    setContactNumbers(['']);
    setDefaultFee(100);
    setExamMode('semester');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (center: Center) => {
    setEditingCenter(center);
    setName(center.name);
    setPlace(center.place);
    setLandmark(center.landmark || '');
    setState(center.state as 'Kerala' | 'Other State');
    setDistrict(center.district);
    setOtherStateName(center.otherStateName || '');
    setOtherDistrictName(center.otherDistrictName || '');
    setZoneOrUnit(center.zoneOrUnit);
    setZoneName(center.zoneName);
    setUnitName(center.unitName || '');
    setRegularDay(center.regularDay);
    setStartTime(center.startTime);
    setEndTime(center.endTime);
    setEffectiveDate(center.effectiveDate);
    setFacultyName(center.facultyName || '');
    setContactNumbers(center.contactNumbers.length > 0 ? center.contactNumbers : ['']);
    setDefaultFee(center.defaultFee);
    setExamMode(center.examMode);
    setStatus(center.status);
    setIsModalOpen(true);
  };

  const handleSaveCenter = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContacts = contactNumbers.filter((n) => n.trim().length > 0).slice(0, 3);

    dataService.saveCenter({
      id: editingCenter?.id,
      name,
      place,
      landmark: landmark.trim() || undefined,
      state,
      district: state === 'Kerala' ? district : otherDistrictName,
      otherStateName: state === 'Other State' ? otherStateName : undefined,
      otherDistrictName: state === 'Other State' ? otherDistrictName : undefined,
      zoneOrUnit,
      zoneName,
      unitName: zoneOrUnit === 'Unit' ? unitName : undefined,
      regularDay,
      startTime,
      endTime,
      effectiveDate,
      facultyName,
      contactNumbers: cleanContacts,
      defaultFee: Number(defaultFee),
      examMode,
      status,
    });

    setIsModalOpen(false);
    refreshData();
  };

  const handleToggleStatus = (center: Center) => {
    if (center.status === 'Active') {
      dataService.updateCenterStatus(center.id, 'Suspended');
    } else if (center.status === 'Suspended' || center.status === 'Pending Approval') {
      dataService.updateCenterStatus(center.id, 'Active');
    }
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (!deletingCenter) return;
    dataService.deleteCenter(deletingCenter.id, isPermanentDelete);
    setDeletingCenter(null);
    setIsPermanentDelete(false);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              CRE Centres Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Super Admin directory and configuration of all affiliated CRE centres
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New CRE Centre
          </button>
        </div>

        {/* Dynamic Exciting Filter Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'ALL'
                ? 'bg-cre-navy text-white border-cre-navy shadow-md scale-[1.02]'
                : 'bg-white text-slate-800 border-cre-border hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'ALL' ? 'text-white/80' : 'text-slate-400'}`}>
                Total Centres
              </span>
              <Building2 className={`w-4 h-4 ${statusFilter === 'ALL' ? 'text-white' : 'text-cre-navy'}`} />
            </div>
            <div className="text-2xl font-black mt-2">{centers.length}</div>
            <span className={`text-[10px] mt-0.5 block ${statusFilter === 'ALL' ? 'text-white/70' : 'text-slate-400'}`}>
              Click to view all affiliated centres
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Active' ? 'ALL' : 'Active')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Active'
                ? 'bg-cre-green text-white border-cre-green shadow-md scale-[1.02]'
                : 'bg-white text-slate-800 border-cre-border hover:border-cre-green/40 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'Active' ? 'text-white/80' : 'text-cre-green'}`}>
                Active Centres
              </span>
              <PlayCircle className={`w-4 h-4 ${statusFilter === 'Active' ? 'text-white' : 'text-cre-green'}`} />
            </div>
            <div className={`text-2xl font-black mt-2 ${statusFilter === 'Active' ? 'text-white' : 'text-cre-green'}`}>
              {centers.filter((c) => c.status === 'Active').length}
            </div>
            <span className={`text-[10px] mt-0.5 block ${statusFilter === 'Active' ? 'text-white/70' : 'text-slate-400'}`}>
              Conducting regular classes
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Pending Approval' ? 'ALL' : 'Pending Approval')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Pending Approval'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-[1.02]'
                : 'bg-white text-slate-800 border-cre-border hover:border-amber-400 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'Pending Approval' ? 'text-white/80' : 'text-amber-600'}`}>
                Pending Approval
              </span>
              <PauseCircle className={`w-4 h-4 ${statusFilter === 'Pending Approval' ? 'text-white' : 'text-amber-500'}`} />
            </div>
            <div className={`text-2xl font-black mt-2 ${statusFilter === 'Pending Approval' ? 'text-white' : 'text-amber-600'}`}>
              {centers.filter((c) => c.status === 'Pending Approval').length}
            </div>
            <span className={`text-[10px] mt-0.5 block ${statusFilter === 'Pending Approval' ? 'text-white/70' : 'text-slate-400'}`}>
              Awaiting Super Admin activation
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Suspended' ? 'ALL' : 'Suspended')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Suspended'
                ? 'bg-red-600 text-white border-red-600 shadow-md scale-[1.02]'
                : 'bg-white text-slate-800 border-cre-border hover:border-red-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'Suspended' ? 'text-white/80' : 'text-red-500'}`}>
                Suspended / Inactive
              </span>
              <AlertTriangle className={`w-4 h-4 ${statusFilter === 'Suspended' ? 'text-white' : 'text-red-500'}`} />
            </div>
            <div className={`text-2xl font-black mt-2 ${statusFilter === 'Suspended' ? 'text-white' : 'text-red-600'}`}>
              {centers.filter((c) => c.status === 'Suspended' || c.status === 'Archived').length}
            </div>
            <span className={`text-[10px] mt-0.5 block ${statusFilter === 'Suspended' ? 'text-white/70' : 'text-slate-400'}`}>
              Temporarily inactive
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search centres by name, place, district..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-cre-border rounded-xl bg-white focus:ring-2 focus:ring-cre-green focus:outline-hidden"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Statuses ({centers.length})</option>
              <option value="Active">Active ({centers.filter((c) => c.status === 'Active').length})</option>
              <option value="Pending Approval">Pending Approval ({centers.filter((c) => c.status === 'Pending Approval').length})</option>
              <option value="Suspended">Suspended ({centers.filter((c) => c.status === 'Suspended').length})</option>
              <option value="Archived">Archived ({centers.filter((c) => c.status === 'Archived').length})</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">District:</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Districts</option>
              {KERALA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Centres Card / Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCenters.map((c, idx) => {
            const studentCount = dataService.getStudents(c.id).filter((s) => s.status === 'Active').length;
            const adminCount = c.adminPhones ? c.adminPhones.length : 0;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-cre-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start space-x-2.5">
                      <span className="shrink-0 px-2 py-0.5 rounded-lg bg-cre-navy-light text-cre-navy font-mono font-black text-[11px] mt-0.5">
                        #{idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-cre-navy line-clamp-1">{c.name}</h3>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                          <span>{c.place}{c.landmark ? ` (${c.landmark})` : ''}, {c.state === 'Kerala' ? c.district : c.otherStateName}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Active'
                          ? 'bg-cre-green-light text-cre-green border border-cre-green/30'
                          : c.status === 'Pending Approval'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-xl text-[11px] border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Conducted by:</span>
                      <span className="font-semibold text-cre-navy">
                        {c.zoneOrUnit}: {c.zoneName} {c.unitName ? `(${c.unitName})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Class Schedule:</span>
                      <span className="font-semibold text-cre-navy">
                        {c.regularDay} ({c.startTime} - {c.endTime})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Faculty:</span>
                      <span className="font-semibold text-slate-700 truncate block">
                        {c.facultyName || 'Not Assigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Default Fee:</span>
                      <span className="font-bold text-cre-green">₹{c.defaultFee} / month</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 mr-1 text-cre-green" />
                      {studentCount} Students
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {adminCount}/3 Admins
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-cre-border flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {c.status === 'Pending Approval' && (
                      <button
                        type="button"
                        onClick={() => {
                          dataService.updateCenterStatus(c.id, 'Active');
                          refreshData();
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-cre-green rounded-lg hover:bg-cre-green-hover transition-colors"
                      >
                        Approve
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c)}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        c.status === 'Active'
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-cre-green hover:bg-cre-green-light'
                      }`}
                      title={c.status === 'Active' ? 'Suspend Centre' : 'Activate Centre'}
                    >
                      {c.status === 'Active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-cre-navy hover:bg-slate-200 transition-colors"
                      title="Edit Centre Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDeletingCenter(c);
                      setIsPermanentDelete(false);
                    }}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Delete / Archive Centre"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ADD / EDIT CENTRE MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-cre-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-cre-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-cre-navy-light text-cre-navy">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-cre-navy">
                    {editingCenter ? 'Edit CRE Centre' : 'Register New CRE Centre'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCenter} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Centre Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Manjeri Town CRE Centre"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Place / City *
                    </label>
                    <input
                      type="text"
                      required
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="e.g. Manjeri"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Salafi Masjid"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* State & Location Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Location State
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value as 'Kerala' | 'Other State')}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden font-semibold text-slate-800"
                    >
                      <option value="Kerala">Kerala</option>
                      <option value="Other State">Other State</option>
                    </select>
                  </div>

                  {state === 'Kerala' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        District (Kerala)
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden font-semibold text-slate-800"
                      >
                        {KERALA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          State Name
                        </label>
                        <input
                          type="text"
                          required
                          value={otherStateName}
                          onChange={(e) => setOtherStateName(e.target.value)}
                          placeholder="e.g. Karnataka"
                          className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          District / City
                        </label>
                        <input
                          type="text"
                          required
                          value={otherDistrictName}
                          onChange={(e) => setOtherDistrictName(e.target.value)}
                          placeholder="e.g. Mangalore"
                          className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Conducted by: Zone or Unit */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-6">
                    <span className="text-xs font-bold text-slate-700">CRE is conducted by?</span>
                    <label className="inline-flex items-center text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="zoneOrUnit"
                        value="Zone"
                        checked={zoneOrUnit === 'Zone'}
                        onChange={() => setZoneOrUnit('Zone')}
                        className="mr-2 text-cre-green focus:ring-cre-green"
                      />
                      Zone
                    </label>
                    <label className="inline-flex items-center text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="zoneOrUnit"
                        value="Unit"
                        checked={zoneOrUnit === 'Unit'}
                        onChange={() => setZoneOrUnit('Unit')}
                        className="mr-2 text-cre-green focus:ring-cre-green"
                      />
                      Unit
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Zone Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        placeholder="e.g. Manjeri Zone"
                        className="w-full px-3 py-1.5 text-xs border border-cre-border rounded-lg bg-white"
                      />
                    </div>

                    {zoneOrUnit === 'Unit' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Unit Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={unitName}
                          onChange={(e) => setUnitName(e.target.value)}
                          placeholder="e.g. Kizhakkethala Unit"
                          className="w-full px-3 py-1.5 text-xs border border-cre-border rounded-lg bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Class Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Regular Class Day
                    </label>
                    <select
                      value={regularDay}
                      onChange={(e) => setRegularDay(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Starting Time (IST)
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ending Time (IST)
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    />
                  </div>
                </div>

                {/* Faculty & Default Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Assigned Faculty (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddFacultyModalOpen(true)}
                        className="text-[11px] font-bold text-cre-green hover:underline inline-flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-0.5" />
                        + Add New Faculty
                      </button>
                    </div>
                    <select
                      value={facultyName}
                      onChange={(e) => setFacultyName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden font-semibold text-slate-800"
                    >
                      <option value="">— No Faculty Assigned (Optional) —</option>
                      {approvedFaculties.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name} {f.place ? `(${f.place})` : ''} {f.qualification ? `• ${f.qualification}` : ''}
                        </option>
                      ))}
                      {facultyName && !approvedFaculties.some((f) => f.name === facultyName) && (
                        <option value={facultyName}>{facultyName} (Custom)</option>
                      )}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Select from approved faculties or click &quot;+ Add New Faculty&quot;.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Default Monthly Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={defaultFee}
                      onChange={(e) => setDefaultFee(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-bold text-cre-green"
                    />
                  </div>
                </div>

                {/* Examination Mode & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Examination Mode
                    </label>
                    <select
                      value={examMode}
                      onChange={(e) => setExamMode(e.target.value as ExamMode)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    >
                      <option value="semester">Semester-Wise Examinations</option>
                      <option value="non-semester">Non-Semester Examinations</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Centre Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CenterStatus)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Contact Numbers (Max 3) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Public Contact Numbers (Max 3)
                    </label>
                    {contactNumbers.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setContactNumbers([...contactNumbers, ''])}
                        className="text-[11px] font-bold text-cre-green hover:underline"
                      >
                        + Add Number
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {contactNumbers.map((num, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="tel"
                          value={num}
                          onChange={(e) => {
                            const updated = [...contactNumbers];
                            updated[idx] = e.target.value;
                            setContactNumbers(updated);
                          }}
                          placeholder={`Contact Number ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 text-xs border border-cre-border rounded-lg"
                        />
                        {contactNumbers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setContactNumbers(contactNumbers.filter((_, i) => i !== idx))}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-4 border-t border-cre-border flex items-center justify-end space-x-3">
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
                    {editingCenter ? 'Save Changes' : 'Create Centre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deletingCenter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center space-x-3 mb-4 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">
                  Delete / Archive Centre
                </h3>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-cre-navy">{deletingCenter.name}</span>?
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-[11px] text-amber-800">
                By default, deleting an active centre archives all records safely to preserve student, attendance, and financial history.
              </div>

              <label className="flex items-center space-x-2 text-xs font-semibold text-red-700 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPermanentDelete}
                  onChange={(e) => setIsPermanentDelete(e.target.checked)}
                  className="rounded-sm border-red-300 text-red-600 focus:ring-red-500"
                />
                <span>I understand. Permanently delete all records forever.</span>
              </label>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDeletingCenter(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                >
                  {isPermanentDelete ? 'Permanently Delete' : 'Archive Centre'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INLINE ADD FACULTY MODAL */}
        {isAddFacultyModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cre-green-light text-cre-green">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-cre-navy">Add New Faculty Member</h3>
                    <p className="text-[11px] text-slate-400">Creates and approves an instructor for CRE centres</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddFacultyModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInlineFaculty} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Faculty Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFacName}
                    onChange={(e) => setNewFacName(e.target.value)}
                    placeholder="e.g. Usthad Abdul Rasheed Salafi"
                    className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={newFacPhone}
                    onChange={(e) => setNewFacPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Place / City (Optional)
                    </label>
                    <input
                      type="text"
                      value={newFacPlace}
                      onChange={(e) => setNewFacPlace(e.target.value)}
                      placeholder="e.g. Malappuram"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Qualification (Optional)
                    </label>
                    <input
                      type="text"
                      value={newFacQual}
                      onChange={(e) => setNewFacQual(e.target.value)}
                      placeholder="e.g. MA Islamic Studies"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddFacultyModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                  >
                    Save & Assign Faculty
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
