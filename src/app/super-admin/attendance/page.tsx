'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { AttendanceStatus, Student, Center } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Save,
  Building,
  Calendar,
  CalendarX,
  Search,
  Filter,
  Users,
  Trash2,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

export default function SuperAdminAttendancePage() {
  const { adminUser, refreshData, dataVersion } = useAuth();
  const centers = dataService.getCenters();

  const [selectedCenterId, setSelectedCenterId] = useState<string>(
    centers.length > 0 ? centers[0].id : ''
  );
  const [filterMode, setFilterMode] = useState<'date' | 'month'>('date');
  const [classDate, setClassDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  const [activeTab, setActiveTab] = useState<'register' | 'summary'>('register');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');

  // Attendance state for current center and classDate
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});
  const [isOverwriting, setIsOverwriting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Class Not Held state
  const [isNotHeldModalOpen, setIsNotHeldModalOpen] = useState(false);
  const [notHeldReason, setNotHeldReason] = useState('Public Holiday');
  const [notHeldRemarks, setNotHeldRemarks] = useState('');
  const [deleteNotHeldId, setDeleteNotHeldId] = useState<string | null>(null);

  // Set default center if empty
  useEffect(() => {
    if (!selectedCenterId && centers.length > 0) {
      setSelectedCenterId(centers[0].id);
    }
  }, [centers, selectedCenterId]);

  const activeStudents = useMemo(() => {
    if (!selectedCenterId) return [];
    return dataService.getStudents(selectedCenterId).filter((s) => s.status === 'Active');
  }, [selectedCenterId, dataVersion]);

  // Check if current date is marked as Class Not Held
  const notHeldRecord = useMemo(() => {
    if (!selectedCenterId) return undefined;
    return dataService.getClassNotHeld(selectedCenterId).find((c) => c.date === classDate);
  }, [selectedCenterId, classDate, dataVersion]);

  // Load existing attendance
  useEffect(() => {
    if (!selectedCenterId || !classDate) return;
    const existing = dataService.getAttendanceRecords(selectedCenterId, classDate);
    const map: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    if (existing.length > 0) {
      setIsOverwriting(true);
      existing.forEach((rec) => {
        map[rec.studentId] = {
          status: rec.status,
          remarks: rec.remarks || '',
        };
      });
      activeStudents.forEach((st) => {
        if (!map[st.id]) {
          map[st.id] = { status: 'Present', remarks: '' };
        }
      });
    } else {
      setIsOverwriting(false);
      activeStudents.forEach((st) => {
        map[st.id] = { status: 'Present', remarks: '' };
      });
    }

    setAttendanceMap(map);
  }, [selectedCenterId, classDate, activeStudents, dataVersion]);

  // Filtered students for display
  const filteredStudents = useMemo(() => {
    return activeStudents.filter((st) => {
      const cur = attendanceMap[st.id] || { status: 'Present', remarks: '' };
      if (statusFilter !== 'ALL' && cur.status !== statusFilter) return false;
      if (genderFilter !== 'ALL' && st.gender !== genderFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchAdm = st.admissionNumber.toLowerCase().includes(q);
        const matchParent = (st.parentName || '').toLowerCase().includes(q);
        return matchName || matchAdm || matchParent;
      }
      return true;
    });
  }, [activeStudents, attendanceMap, statusFilter, genderFilter, searchTerm]);

  // Daily Counts
  const presentCount = useMemo(() => {
    return Object.values(attendanceMap).filter((a) => a.status === 'Present').length;
  }, [attendanceMap]);

  const absentCount = useMemo(() => {
    return Object.values(attendanceMap).filter((a) => a.status === 'Absent').length;
  }, [attendanceMap]);

  const leaveCount = useMemo(() => {
    return Object.values(attendanceMap).filter((a) => a.status === 'Leave').length;
  }, [attendanceMap]);

  const setSingleStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const setSingleRemarks = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = { ...attendanceMap };
    activeStudents.forEach((st) => {
      updated[st.id] = {
        ...updated[st.id],
        status,
      };
    });
    setAttendanceMap(updated);
  };

  const performSave = () => {
    if (!selectedCenterId) return;
    const records = activeStudents.map((st) => ({
      studentId: st.id,
      status: attendanceMap[st.id]?.status || 'Present',
      remarks: attendanceMap[st.id]?.remarks || '',
    }));

    dataService.saveAttendance(
      selectedCenterId,
      classDate,
      records,
      adminUser?.name || 'Super Admin Override'
    );

    setShowConfirmModal(false);
    setIsOverwriting(true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    refreshData();
  };

  // Class Not Held Handlers
  const handleSaveClassNotHeld = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenterId) return;
    dataService.saveClassNotHeld({
      centerId: selectedCenterId,
      date: classDate,
      reason: notHeldReason,
      remarks: notHeldRemarks,
      recordedBy: adminUser?.name || 'Super Admin',
    });
    setIsNotHeldModalOpen(false);
    refreshData();
  };

  const handleConfirmDeleteNotHeld = () => {
    if (deleteNotHeldId) {
      dataService.deleteClassNotHeld(deleteNotHeldId);
      setDeleteNotHeldId(null);
      refreshData();
    }
  };

  // Student summary metrics
  const studentSummaries = useMemo(() => {
    if (!selectedCenterId) return [];
    return activeStudents.map((st) => {
      const stats = dataService.calculateStudentAttendance(st.id, selectedCenterId);
      return {
        student: st,
        ...stats,
      };
    });
  }, [activeStudents, selectedCenterId, dataVersion]);

  const overallConducted = studentSummaries.length > 0 ? studentSummaries[0].totalConducted : 0;
  const overallAvgPresent = useMemo(() => {
    if (studentSummaries.length === 0) return 0;
    const sum = studentSummaries.reduce((acc, s) => acc + s.present, 0);
    return Math.round((sum / studentSummaries.length) * 10) / 10;
  }, [studentSummaries]);

  const overallAvgAbsent = useMemo(() => {
    if (studentSummaries.length === 0) return 0;
    const sum = studentSummaries.reduce((acc, s) => acc + s.absent, 0);
    return Math.round((sum / studentSummaries.length) * 10) / 10;
  }, [studentSummaries]);

  const overallAvgLeave = useMemo(() => {
    if (studentSummaries.length === 0) return 0;
    const sum = studentSummaries.reduce((acc, s) => acc + s.leave, 0);
    return Math.round((sum / studentSummaries.length) * 10) / 10;
  }, [studentSummaries]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
                Attendance Management
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-cre-navy text-white text-[10px] font-black tracking-wider uppercase">
                Super Admin Override
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Full statewide attendance oversight, live register editing, and counts tracking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNotHeldModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all inline-flex items-center"
            >
              <CalendarX className="w-4 h-4 mr-1.5" />
              Mark Class Not Held
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-cre-navy text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-cre-border hover:bg-slate-50'
              }`}
            >
              Live Register
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'summary'
                  ? 'bg-cre-navy text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-cre-border hover:bg-slate-50'
              }`}
            >
              Overall Summary
            </button>
          </div>
        </div>

        {/* NOT HELD CLASS BANNER */}
        {notHeldRecord && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <CalendarX className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-amber-900 block text-sm">
                  Class Not Held on {classDate}: {notHeldRecord.reason}
                </span>
                <span className="text-amber-700 text-[11px]">
                  {notHeldRecord.remarks ? `Remarks: ${notHeldRecord.remarks} • ` : ''}
                  Exempted from student attendance counts and percentages.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDeleteNotHeldId(notHeldRecord.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-white hover:bg-red-50 border border-red-200 self-start sm:self-auto shrink-0 inline-flex items-center"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Cancel & Conduct Class
            </button>
          </div>
        )}

        {/* 4 STATS CARDS (FOCUSED ON COUNTS) */}
        {activeTab === 'register' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Present Students Count
              </span>
              <div className="mt-2 text-2xl font-black text-cre-green">
                {presentCount} <span className="text-xs font-bold text-slate-400">/ {activeStudents.length}</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {activeStudents.length > 0
                  ? `${Math.round((presentCount / activeStudents.length) * 100)}% attendance today`
                  : '0%'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Absent Students Count
              </span>
              <div className="mt-2 text-2xl font-black text-red-600">
                {absentCount}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Unexcused absences on {classDate}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                On-Leave Students Count
              </span>
              <div className="mt-2 text-2xl font-black text-amber-500">
                {leaveCount}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Authorized leaves on record
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Centre Strength
              </span>
              <div className="mt-2 text-2xl font-black text-cre-navy">
                {activeStudents.length}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Enrolled students in this centre
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Conducted Classes
              </span>
              <div className="mt-2 text-2xl font-black text-cre-navy">
                {overallConducted} <span className="text-xs font-bold text-slate-400">Sessions</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Active attendance sessions held
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avg Present Count
              </span>
              <div className="mt-2 text-2xl font-black text-cre-green">
                {overallAvgPresent} <span className="text-xs font-bold text-slate-400">Students</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Average turnout per session
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avg Absent Count
              </span>
              <div className="mt-2 text-2xl font-black text-red-600">
                {overallAvgAbsent} <span className="text-xs font-bold text-slate-400">Students</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Average absenteeism per session
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Avg Leave Count
              </span>
              <div className="mt-2 text-2xl font-black text-amber-500">
                {overallAvgLeave} <span className="text-xs font-bold text-slate-400">Students</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Average leave applications
              </p>
            </div>
          </div>
        )}

        {/* FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Select Centre */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <Building className="w-4 h-4 text-cre-navy shrink-0" />
            <select
              value={selectedCenterId}
              onChange={(e) => setSelectedCenterId(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector with Toggle */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <div className="flex items-center bg-slate-100 rounded-md p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode('date')}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm ${
                  filterMode === 'date' ? 'bg-cre-navy text-white' : 'text-slate-600'
                }`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm ${
                  filterMode === 'month' ? 'bg-cre-navy text-white' : 'text-slate-600'
                }`}
              >
                Month
              </button>
            </div>
            {filterMode === 'date' ? (
              <input
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                className="bg-transparent font-bold text-cre-navy focus:outline-hidden cursor-pointer w-full"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setClassDate(`${e.target.value}-01`);
                }}
                className="bg-transparent font-bold text-cre-navy focus:outline-hidden cursor-pointer w-full"
              />
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Leave">Leave Only</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Genders</option>
              <option value="Boy">Boy</option>
              <option value="Girl">Girl</option>
            </select>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 bg-cre-green-light border border-cre-green/30 rounded-2xl flex items-center space-x-2 text-xs text-cre-green font-bold shadow-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Super Admin overrides saved successfully for {classDate}.</span>
          </div>
        )}

        {activeTab === 'register' ? (
          <>
            {/* Search and Batch Actions Bar */}
            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student by name, admission no, parent..."
                  className="w-full pl-10 pr-4 py-2 text-xs border border-cre-border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-cre-green bg-cre-green-light hover:bg-cre-green/20 transition-colors"
                >
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Mark All Absent
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isOverwriting) setShowConfirmModal(true);
                    else performSave();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover transition-all shadow-md shadow-cre-navy/20 inline-flex items-center"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Overrides
                </button>
              </div>
            </div>

            {/* Attendance Overrides Table */}
            <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Adm No</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Gender</th>
                      <th className="py-3.5 px-4">Parent</th>
                      <th className="py-3.5 px-4 text-center">Super Admin Override Status</th>
                      <th className="py-3.5 px-4">Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cre-border">
                    {filteredStudents.map((st, idx) => {
                      const cur = attendanceMap[st.id] || { status: 'Present', remarks: '' };

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">
                            {st.admissionNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {st.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                st.gender === 'Boy'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-pink-50 text-pink-700'
                              }`}
                            >
                              {st.gender || 'Boy'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{st.parentName}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => setSingleStatus(st.id, 'Present')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                  cur.status === 'Present'
                                    ? 'bg-cre-green text-white shadow-xs'
                                    : 'text-slate-600 hover:text-cre-green'
                                }`}
                              >
                                Present
                              </button>

                              <button
                                type="button"
                                onClick={() => setSingleStatus(st.id, 'Absent')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                  cur.status === 'Absent'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-red-600'
                                }`}
                              >
                                Absent
                              </button>

                              <button
                                type="button"
                                onClick={() => setSingleStatus(st.id, 'Leave')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                  cur.status === 'Leave'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-amber-600'
                                }`}
                              >
                                Leave
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              value={cur.remarks}
                              onChange={(e) => setSingleRemarks(st.id, e.target.value)}
                              placeholder="e.g. Sickness, travel"
                              className="w-full px-2.5 py-1 text-xs border border-cre-border rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden"
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                          No students found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* OVERALL ATTENDANCE SUMMARY TAB */
          <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                  Statewide Centre Attendance Performance & Counts
                </h3>
                <p className="text-[10px] text-slate-500">
                  Focusing on session counts: Present Count, Absent Count, and Leave Count.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Adm No</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Gender</th>
                    <th className="py-3.5 px-4">Conducted Classes</th>
                    <th className="py-3.5 px-4">Present Count</th>
                    <th className="py-3.5 px-4">Absent Count</th>
                    <th className="py-3.5 px-4">Leave Count</th>
                    <th className="py-3.5 px-4">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cre-border">
                  {studentSummaries.map(({ student, totalConducted, present, absent, leave, percentage }, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">
                        {student.admissionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{student.name}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            student.gender === 'Boy'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {student.gender || 'Boy'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{totalConducted}</td>
                      <td className="py-3.5 px-4 font-black text-cre-green">{present}</td>
                      <td className="py-3.5 px-4 font-black text-red-600">{absent}</td>
                      <td className="py-3.5 px-4 font-black text-amber-600">{leave}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-black text-xs ${
                              percentage >= 75 ? 'text-cre-green' : 'text-amber-600'
                            }`}
                          >
                            {percentage}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cre-green"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MARK CLASS NOT HELD MODAL */}
        {isNotHeldModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <CalendarX className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-cre-navy">Mark Class as Not Held</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotHeldModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveClassNotHeld} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target CRE Centre *
                  </label>
                  <select
                    required
                    value={selectedCenterId}
                    onChange={(e) => setSelectedCenterId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                  >
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Class Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Non-Conduct *
                  </label>
                  <select
                    value={notHeldReason}
                    onChange={(e) => setNotHeldReason(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                  >
                    <option value="Public Holiday">Public Holiday / National Day</option>
                    <option value="Heavy Rain / Natural Calamity">Heavy Rain / Natural Calamity</option>
                    <option value="Hartal / Strike / Bandh">Hartal / Strike / Bandh</option>
                    <option value="Madrasa / School Exams">Madrasa / School Exams</option>
                    <option value="Faculty Unavailable">Faculty Unavailable</option>
                    <option value="Festival / Eid Break">Festival / Eid Break</option>
                    <option value="Other">Other Specific Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remarks / Details (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notHeldRemarks}
                    onChange={(e) => setNotHeldRemarks(e.target.value)}
                    placeholder="e.g. Red alert declared across district by Collector"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-cre-border flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsNotHeldModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                  >
                    Save Non-Conduct Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE CLASS NOT HELD */}
        <ConfirmModal
          isOpen={!!deleteNotHeldId}
          title="Cancel 'Class Not Held' Record"
          message="Are you sure you want to cancel the non-conduct status for this date? This will allow regular attendance to be conducted."
          confirmText="Resume Regular Class"
          isDanger={true}
          onConfirm={handleConfirmDeleteNotHeld}
          onCancel={() => setDeleteNotHeldId(null)}
        />

        {/* CONFIRMATION MODAL BEFORE OVERWRITING PREVIOUS ATTENDANCE */}
        <ConfirmModal
          isOpen={showConfirmModal}
          title="Overwrite Previous Attendance?"
          message={`Attendance records for date ${classDate} already exist. Saving will override the previous records for this centre.`}
          confirmText="Yes, Save Overrides"
          isDanger={false}
          onConfirm={performSave}
          onCancel={() => setShowConfirmModal(false)}
        />
      </div>
    </AppShell>
  );
}
