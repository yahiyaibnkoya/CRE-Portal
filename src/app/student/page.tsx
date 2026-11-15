'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { formatCurrency } from '@/lib/constants';
import {
  GraduationCap,
  CalendarCheck,
  IndianRupee,
  Award,
  Building,
  UserPlus,
  ArrowRight,
  Phone,
  CheckCircle,
} from 'lucide-react';

export default function StudentOverviewPage() {
  const { selectedStudent, activeCenter } = useAuth();

  const studentId = selectedStudent?.id || '';
  const centerId = selectedStudent?.centerId || '';

  // Attendance Stats
  const attStats = useMemo(() => {
    if (!studentId || !centerId) return { totalConducted: 0, present: 0, percentage: 0 };
    return dataService.calculateStudentAttendance(studentId, centerId);
  }, [studentId, centerId]);

  // Current Month Fee
  const currentMonth = '2026-11';
  const feeRec = useMemo(() => {
    if (!studentId || !centerId) return null;
    const fees = dataService.getMonthlyFees(centerId, currentMonth);
    return fees.find((f) => f.studentId === studentId) || null;
  }, [studentId, centerId]);

  // Latest Exam
  const examMarks = useMemo(() => {
    if (!studentId || !centerId) return [];
    return dataService.getExamMarks(centerId, undefined, studentId);
  }, [studentId, centerId]);

  const exams = useMemo(() => {
    if (!centerId) return [];
    return dataService.getExams(centerId);
  }, [centerId]);

  const latestExam = exams.length > 0 ? exams[0] : null;

  if (!selectedStudent) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-2xl border border-cre-border">
          <p className="text-xs text-slate-500">Please log in with your registered phone number.</p>
          <Link href="/login?tab=student" className="mt-3 inline-block text-xs font-bold text-cre-green underline">
            Go to Login
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        {/* Welcome Banner */}
        <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-cre-green text-white font-black text-xl flex items-center justify-center shadow-md shadow-cre-green/30">
              {selectedStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cre-green">
                  Student / Parent Portal
                </span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cre-green-light text-cre-green">
                  {selectedStudent.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-cre-navy mt-0.5">
                {selectedStudent.name}
              </h1>
              <p className="text-xs text-slate-500">
                Admission No: <span className="font-mono font-bold text-cre-navy">{selectedStudent.admissionNumber}</span> • {activeCenter?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/student/donate-contact"
              className="px-4 py-2 text-xs font-bold text-cre-navy bg-cre-navy-light hover:bg-cre-navy hover:text-white rounded-xl transition-all shadow-xs inline-flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Donate a Contact
            </Link>
          </div>
        </div>

        {/* 3 Metric Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Attendance Card */}
          <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Attendance Record
                </span>
                <div className="p-2 rounded-xl bg-cre-green-light text-cre-green">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-cre-green mt-1">
                {attStats.percentage}%
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Attended <span className="font-bold">{attStats.present}</span> out of{' '}
                <span className="font-bold">{attStats.totalConducted}</span> conducted classes.
              </p>
            </div>
            <Link
              href="/student/attendance"
              className="mt-4 pt-3 border-t border-cre-border text-xs font-bold text-cre-green hover:underline flex items-center justify-between"
            >
              <span>View Attendance Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Fee Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Fee Status ({currentMonth})
                </span>
                <div className="p-2 rounded-xl bg-cre-navy-light text-cre-navy">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-cre-navy mt-1">
                {feeRec ? formatCurrency(feeRec.paidAmount) : formatCurrency(0)}
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Status:{' '}
                <span
                  className={`font-bold ${
                    feeRec?.status === 'Paid'
                      ? 'text-cre-green'
                      : feeRec?.status === 'Advance / Excess'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {feeRec?.status || 'Unpaid'}
                </span>
                {feeRec && feeRec.outstandingAmount > 0 && (
                  <span className="block text-[11px] text-red-600">
                    Outstanding: {formatCurrency(feeRec.outstandingAmount)}
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/student/fees"
              className="mt-4 pt-3 border-t border-cre-border text-xs font-bold text-cre-navy hover:underline flex items-center justify-between"
            >
              <span>Fee Details & History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Latest Exam Card */}
          <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Latest Examination
                </span>
                <div className="p-2 rounded-xl bg-cre-navy-light text-cre-navy">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-cre-navy line-clamp-1">
                {latestExam ? latestExam.name : 'No Exams Yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {latestExam
                  ? `Date: ${latestExam.date} • ${latestExam.mode === 'semester' ? latestExam.semesterName : 'Portions'}`
                  : 'Exam marks will appear here.'}
              </p>
            </div>
            <Link
              href="/student/exams"
              className="mt-4 pt-3 border-t border-cre-border text-xs font-bold text-cre-navy hover:underline flex items-center justify-between"
            >
              <span>View Examination Results</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Centre Information Box */}
        {activeCenter && (
          <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-cre-border mb-4">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-cre-navy" />
                <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                  Your CRE Centre Information
                </h3>
              </div>
              <Link
                href="/student/center"
                className="text-xs font-bold text-cre-green hover:underline flex items-center"
              >
                <span>Full Details</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Class Schedule</span>
                <span className="font-semibold text-cre-navy">
                  {activeCenter.regularDay} ({activeCenter.startTime} - {activeCenter.endTime})
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Faculty Usthad</span>
                <span className="font-semibold text-slate-800">
                  {activeCenter.facultyName || 'Appointed Faculty'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Centre Contact</span>
                {activeCenter.contactNumbers.length > 0 ? (
                  <a
                    href={`tel:${activeCenter.contactNumbers[0]}`}
                    className="font-bold text-cre-green hover:underline flex items-center"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    {activeCenter.contactNumbers[0]}
                  </a>
                ) : (
                  <span className="text-slate-500">Contact Centre Admin</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
