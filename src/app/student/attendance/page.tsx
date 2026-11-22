'use client';

import React, { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { CalendarCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ChildSwitcherBar } from '@/components/student/ChildSwitcherBar';

export default function StudentAttendancePage() {
  const { selectedStudent, activeCenter } = useAuth();
  const studentId = selectedStudent?.id || '';
  const centerId = selectedStudent?.centerId || '';

  const attData = useMemo(() => {
    if (!studentId || !centerId) return { totalConducted: 0, present: 0, absent: 0, leave: 0, percentage: 0, records: [] };
    return dataService.calculateStudentAttendance(studentId, centerId);
  }, [studentId, centerId]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Multi-Child Switcher Bar */}
        <ChildSwitcherBar />

        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Attendance Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Class attendance records for {selectedStudent?.name} ({selectedStudent?.admissionNumber})
          </p>
        </div>

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Conducted
            </span>
            <div className="mt-2 text-2xl font-black text-slate-800">
              {attData.totalConducted}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Weekly CRE Classes</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Present Classes
            </span>
            <div className="mt-2 text-2xl font-black text-cre-green">
              {attData.present}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Full Attendance</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Absent Classes
            </span>
            <div className="mt-2 text-2xl font-black text-red-600">
              {attData.absent}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Missed Sessions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Attendance %
            </span>
            <div
              className={`mt-2 text-2xl font-black ${
                attData.percentage >= 75 ? 'text-cre-green' : 'text-amber-600'
              }`}
            >
              {attData.percentage}%
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Formula: (Present / Conducted) × 100
            </p>
          </div>
        </div>

        {/* Individual Class Session History Table */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
              Class Session History
            </h3>
            <span className="text-[10px] text-slate-500">
              {attData.records.length} Recorded Sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="py-3 px-4">Class Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {attData.records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {rec.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-cre-green-light text-cre-green border border-cre-green/30'
                            : rec.status === 'Leave'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 italic">
                      {rec.remarks || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[10px] text-slate-400">
                      {rec.recordedBy}
                    </td>
                  </tr>
                ))}

                {attData.records.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                      No attendance records found yet for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
