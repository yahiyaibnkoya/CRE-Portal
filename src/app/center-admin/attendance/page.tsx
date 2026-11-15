'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { AttendanceStatus, Student } from '@/types';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  AlertTriangle,
  Users,
  Calendar,
  CheckCheck,
  RotateCcw,
  Info,
} from 'lucide-react';

export default function CenterAdminAttendancePage() {
  const { activeCenter, adminUser, refreshData } = useAuth();
  const centerId = activeCenter?.id || '';

  const [classDate, setClassDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<'register' | 'summary'>('register');

  // Attendance records for selected class date
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});
  const [isOverwriting, setIsOverwriting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeStudents = useMemo(() => {
    return dataService.getStudents(centerId).filter((s) => s.status === 'Active');
  }, [centerId]);

  // Load existing attendance for this classDate if already recorded
  useEffect(() => {
    if (!centerId || !classDate) return;
    const existing = dataService.getAttendanceRecords(centerId, classDate);
    const map: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    if (existing.length > 0) {
      setIsOverwriting(true);
      existing.forEach((rec) => {
        map[rec.studentId] = {
          status: rec.status,
          remarks: rec.remarks || '',
        };
      });
      // Fill in any new students as Present by default
      activeStudents.forEach((st) => {
        if (!map[st.id]) {
          map[st.id] = { status: 'Present', remarks: '' };
        }
      });
    } else {
      setIsOverwriting(false);
      // Initialize with default 'Present' for all active students
      activeStudents.forEach((st) => {
        map[st.id] = { status: 'Present', remarks: '' };
      });
    }

    setAttendanceMap(map);
  }, [centerId, classDate, activeStudents]);

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

  const handleSaveClick = () => {
    if (isOverwriting) {
      setShowConfirmModal(true);
    } else {
      performSave();
    }
  };

  const performSave = () => {
    const records = activeStudents.map((st) => ({
      studentId: st.id,
      status: attendanceMap[st.id]?.status || 'Present',
      remarks: attendanceMap[st.id]?.remarks || '',
    }));

    dataService.saveAttendance(
      centerId,
      classDate,
      records,
      adminUser?.name || 'Centre Admin'
    );

    setShowConfirmModal(false);
    setIsOverwriting(true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    refreshData();
  };

  // Summary calculation for all active students
  const studentSummaries = useMemo(() => {
    return activeStudents.map((st) => {
      const stats = dataService.calculateStudentAttendance(st.id, centerId);
      return {
        student: st,
        ...stats,
      };
    });
  }, [activeStudents, centerId]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Class Attendance Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly class attendance marking, leave records, and automatic percentage computation
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-cre-navy text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-cre-border hover:bg-slate-50'
              }`}
            >
              Class Date Register
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

        {saveSuccess && (
          <div className="p-4 bg-cre-green-light border border-cre-green/30 rounded-2xl flex items-center space-x-2 text-xs text-cre-green font-bold shadow-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Attendance saved successfully for {classDate}.</span>
          </div>
        )}

        {activeTab === 'register' ? (
          <>
            {/* Control Bar: Date Selector & Batch Actions */}
            <div className="bg-white p-4 rounded-2xl border border-cre-border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cre-green-light text-cre-green">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Class Date
                  </label>
                  <input
                    type="date"
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                    className="mt-0.5 text-xs font-bold text-cre-navy border border-cre-border rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

                {isOverwriting && (
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Editing Previously Saved Attendance
                  </span>
                )}
              </div>

              {/* Batch Actions & Save Button */}
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
                  onClick={handleSaveClick}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20 inline-flex items-center"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Attendance
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Adm No</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Parent</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cre-border">
                    {activeStudents.map((st) => {
                      const cur = attendanceMap[st.id] || { status: 'Present', remarks: '' };

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">
                            {st.admissionNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {st.name}
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

                    {activeStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                          No active students found in this centre. Please add students first.
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
                  Overall Student Attendance Performance
                </h3>
                <p className="text-[10px] text-slate-500">
                  Formula: (Present Classes / Total Conducted Classes) × 100
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Adm No</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Total Conducted</th>
                    <th className="py-3.5 px-4">Present</th>
                    <th className="py-3.5 px-4">Absent</th>
                    <th className="py-3.5 px-4">Leave</th>
                    <th className="py-3.5 px-4">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cre-border">
                  {studentSummaries.map(({ student, totalConducted, present, absent, leave, percentage }) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">
                        {student.admissionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{student.name}</td>
                      <td className="py-3.5 px-4 text-slate-700">{totalConducted} classes</td>
                      <td className="py-3.5 px-4 font-bold text-cre-green">{present}</td>
                      <td className="py-3.5 px-4 font-bold text-red-600">{absent}</td>
                      <td className="py-3.5 px-4 font-bold text-amber-600">{leave}</td>
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

        {/* CONFIRMATION MODAL BEFORE OVERWRITING PREVIOUS ATTENDANCE */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-cre-border text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-cre-navy">
                Overwrite Previous Attendance?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Attendance records for date <span className="font-bold text-cre-navy">{classDate}</span> already exist. Saving will update the previous records.
              </p>

              <div className="mt-5 flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={performSave}
                  className="px-4 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                >
                  Yes, Update Records
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
