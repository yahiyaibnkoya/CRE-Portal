'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { formatCurrency } from '@/lib/constants';
import {
  Users,
  CalendarCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Receipt,
  FileText,
  IndianRupee,
  AlertCircle,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function CenterAdminDashboardPage() {
  const { activeCenter } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  const centerId = activeCenter?.id || '';
  const students = dataService.getStudents(centerId);
  const activeStudents = students.filter((s) => s.status === 'Active');

  // Attendance Records for this Centre
  const centerAttendanceRecords = useMemo(() => {
    return dataService.getAttendanceRecords(centerId);
  }, [centerId]);

  // Unique session dates
  const sessionDates = useMemo(() => {
    const dates = Array.from(new Set(centerAttendanceRecords.map((a) => a.date))).sort();
    return dates;
  }, [centerAttendanceRecords]);

  // Session-by-session attendance breakdown
  const sessionBreakdown = useMemo(() => {
    return sessionDates.map((date) => {
      const recs = centerAttendanceRecords.filter((a) => a.date === date);
      const present = recs.filter((a) => a.status === 'Present').length;
      const absent = recs.filter((a) => a.status === 'Absent').length;
      const leave = recs.filter((a) => a.status === 'Leave').length;
      const total = recs.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        date,
        present,
        absent,
        leave,
        total,
        rate,
      };
    });
  }, [sessionDates, centerAttendanceRecords]);

  // Latest session
  const latestSession = sessionBreakdown.length > 0 ? sessionBreakdown[sessionBreakdown.length - 1] : null;

  // Month-filtered attendance stats
  const monthAttendanceStats = useMemo(() => {
    const monthRecs = centerAttendanceRecords.filter((a) => a.date.startsWith(selectedMonth));
    const monthDates = Array.from(new Set(monthRecs.map((a) => a.date)));
    const totalPresent = monthRecs.filter((a) => a.status === 'Present').length;
    const totalAbsent = monthRecs.filter((a) => a.status === 'Absent').length;
    const totalLeave = monthRecs.filter((a) => a.status === 'Leave').length;
    const totalRecords = monthRecs.length;
    const rate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    return {
      conducted: monthDates.length,
      totalPresent,
      totalAbsent,
      totalLeave,
      totalRecords,
      rate,
    };
  }, [centerAttendanceRecords, selectedMonth]);

  // Student Attendance Health: list students with attendance rate
  const studentAttendanceHealth = useMemo(() => {
    return activeStudents.map((st) => {
      const att = dataService.calculateStudentAttendance(st.id, centerId, selectedMonth);
      return {
        ...st,
        attendanceRate: att.percentage,
        present: att.present,
        conducted: att.totalConducted,
      };
    });
  }, [activeStudents, centerId, selectedMonth]);

  const highAttendanceCount = studentAttendanceHealth.filter((s) => s.attendanceRate >= 80).length;
  const lowAttendanceStudents = studentAttendanceHealth.filter((s) => s.attendanceRate < 75 && s.conducted > 0);

  // Financial summary for quick secondary info
  const financialSummary = useMemo(() => {
    return dataService.getFinancialSummary(centerId, selectedMonth);
  }, [centerId, selectedMonth]);

  // Recharts Bar chart data
  const chartData = useMemo(() => {
    return sessionBreakdown.map((s) => {
      const d = new Date(s.date);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return {
        dateLabel: label,
        fullDate: s.date,
        'Present Students': s.present,
        'Absent Students': s.absent,
        'On Leave': s.leave,
        rate: s.rate,
      };
    });
  }, [sessionBreakdown]);

  if (!activeCenter) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-2xl border border-cre-border">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h2 className="text-sm font-bold text-cre-navy">No Assigned Centre Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            Your administrator account does not currently have any active centre assigned.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Centre Welcome Banner */}
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cre-green">
                Centre Dashboard
              </span>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cre-green-light text-cre-green">
                {activeCenter.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy mt-1">
              {activeCenter.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeCenter.place}, {activeCenter.district} • Schedule: {activeCenter.regularDay} ({activeCenter.startTime} - {activeCenter.endTime})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="bg-slate-50 px-3 py-2 rounded-xl border border-cre-border text-xs font-semibold text-slate-800">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent focus:outline-hidden cursor-pointer"
              />
            </div>

            <Link
              href="/center-admin/attendance"
              className="px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-md shadow-cre-green/20 transition-all inline-flex items-center"
            >
              <CalendarCheck className="w-4 h-4 mr-1.5" />
              Mark Attendance
            </Link>
          </div>
        </div>

        {/* Quick Actions (Moved to Top) */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Centre Quick Actions
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-cre-green">
              Fast management shortcuts
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            <Link
              href="/center-admin/attendance"
              className="p-2.5 sm:p-3 bg-slate-50 hover:bg-cre-green-light rounded-xl border border-slate-200 hover:border-cre-green transition-all flex items-center space-x-2 text-xs font-bold text-cre-navy group"
            >
              <div className="p-1.5 rounded-lg bg-cre-green/10 text-cre-green group-hover:bg-cre-green group-hover:text-white transition-colors shrink-0">
                <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="truncate">Mark Attendance</span>
            </Link>

            <Link
              href="/center-admin/reports?tab=class_attendance"
              className="p-2.5 sm:p-3 bg-slate-50 hover:bg-cre-green-light rounded-xl border border-slate-200 hover:border-cre-green transition-all flex items-center space-x-2 text-xs font-bold text-cre-navy group"
            >
              <div className="p-1.5 rounded-lg bg-cre-green/10 text-cre-green group-hover:bg-cre-green group-hover:text-white transition-colors shrink-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="truncate">Attendance Report</span>
            </Link>

            <Link
              href="/center-admin/students"
              className="p-2.5 sm:p-3 bg-slate-50 hover:bg-cre-navy-light rounded-xl border border-slate-200 hover:border-cre-navy transition-all flex items-center space-x-2 text-xs font-bold text-cre-navy group"
            >
              <div className="p-1.5 rounded-lg bg-cre-navy/10 text-cre-navy group-hover:bg-cre-navy group-hover:text-white transition-colors shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="truncate">Register Student</span>
            </Link>

            <Link
              href="/center-admin/fees"
              className="p-2.5 sm:p-3 bg-slate-50 hover:bg-cre-navy-light rounded-xl border border-slate-200 hover:border-cre-navy transition-all flex items-center space-x-2 text-xs font-bold text-cre-navy group"
            >
              <div className="p-1.5 rounded-lg bg-cre-navy/10 text-cre-navy group-hover:bg-cre-navy group-hover:text-white transition-colors shrink-0">
                <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="truncate">Fee Collection</span>
            </Link>

            <Link
              href="/center-admin/finance"
              className="p-2.5 sm:p-3 bg-slate-50 hover:bg-cre-navy-light rounded-xl border border-slate-200 hover:border-cre-navy transition-all flex items-center space-x-2 text-xs font-bold text-cre-navy group col-span-2 sm:col-span-1"
            >
              <div className="p-1.5 rounded-lg bg-cre-navy/10 text-cre-navy group-hover:bg-cre-navy group-hover:text-white transition-colors shrink-0">
                <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="truncate">Record Expense</span>
            </Link>
          </div>
        </div>

        {/* 4 ATTENDANCE HERO STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Active Enrolled Students */}
          <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Enrolled Students
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-cre-navy-light text-cre-navy">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline space-x-2">
              <span className="text-xl sm:text-2xl font-black text-cre-navy">{activeStudents.length}</span>
              <span className="text-[11px] sm:text-xs text-cre-green font-semibold">Active</span>
            </div>
            <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-slate-400">
              Total registered in centre: {students.length}
            </p>
            <Link
              href="/center-admin/students"
              className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] font-bold text-cre-green hover:underline flex items-center"
            >
              Student Directory <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {/* Card 2: Overall Attendance Rate % */}
          <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Attendance Rate
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-cre-green-light text-cre-green">
                <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline space-x-2">
              <span className="text-xl sm:text-2xl font-black text-cre-green">
                {monthAttendanceStats.rate}%
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">Monthly Avg</span>
            </div>
            <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-slate-500 truncate">
              {monthAttendanceStats.totalPresent} Present of {monthAttendanceStats.totalRecords} attendances
            </p>
            <Link
              href="/center-admin/reports"
              className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] font-bold text-cre-navy hover:underline flex items-center"
            >
              View Report <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          {/* Card 3: Latest Class Attendance */}
          <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Latest Class
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-cre-green-light text-cre-green">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            {latestSession ? (
              <>
                <div className="mt-1.5 sm:mt-2 flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-cre-navy">
                    {latestSession.present}
                  </span>
                  <span className="text-[11px] sm:text-xs text-cre-green font-semibold">
                    / {latestSession.total}
                  </span>
                </div>
                <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1 text-[9px] sm:text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-sm bg-red-50 text-red-700 font-bold">
                    {latestSession.absent} Absent
                  </span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-cre-green-light text-cre-green font-bold">
                    {latestSession.rate}%
                  </span>
                </div>
                <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-slate-400">Date: {latestSession.date}</p>
              </>
            ) : (
              <p className="mt-2 sm:mt-3 text-xs text-slate-400">No sessions recorded yet</p>
            )}
          </div>

          {/* Card 4: Classes Conducted */}
          <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Conducted Classes
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-cre-navy-light text-cre-navy">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline space-x-2">
              <span className="text-xl sm:text-2xl font-black text-cre-navy">
                {monthAttendanceStats.conducted}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">In Month</span>
            </div>
            <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-slate-500">
              {sessionDates.length} Total classes all-time
            </p>
            <Link
              href="/center-admin/attendance"
              className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] font-bold text-cre-green hover:underline flex items-center"
            >
              Class Register <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* ATTENDANCE VISUALIZATION & WEEKLY TRENDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Attendance Chart */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-cre-navy">
                  Weekly Class Attendance Trend
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Number of present and absent students for each weekly class
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="inline-flex items-center text-slate-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-cre-green mr-1.5"></span>
                  Present
                </span>
                <span className="inline-flex items-center text-slate-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span>
                  Absent
                </span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-40 sm:h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <CalendarCheck className="w-8 h-8 text-slate-300 mb-2" />
                <p>No class attendance sessions recorded yet.</p>
              </div>
            ) : (
              <div className="h-48 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="Present Students" fill="#2fb44b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Absent Students" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Attendance Health & Follow-up Needed */}
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-cre-navy mb-1">
                Attendance Health Overview
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mb-4">
                Student consistency for {selectedMonth}
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-cre-green-light rounded-xl border border-cre-green/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-cre-green">Regular Attendees (≥ 80%)</span>
                    <p className="text-[10px] text-slate-600">Consistently attending classes</p>
                  </div>
                  <span className="text-lg font-black text-cre-green">{highAttendanceCount}</span>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-800">Requires Attention (&lt; 75%)</span>
                    <p className="text-[10px] text-slate-600">Students with low attendance</p>
                  </div>
                  <span className="text-lg font-black text-amber-700">{lowAttendanceStudents.length}</span>
                </div>
              </div>

              {lowAttendanceStudents.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    Follow-up Needed:
                  </span>
                  <div className="space-y-1.5">
                    {lowAttendanceStudents.slice(0, 3).map((st) => (
                      <div key={st.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-800">{st.name}</span>
                        <span className="font-bold text-red-600">{st.attendanceRate}% ({st.present}/{st.conducted})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/center-admin/reports"
                className="w-full py-2 px-3 text-xs font-bold text-center text-cre-navy bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors block"
              >
                Open Class Attendance Report →
              </Link>
            </div>
          </div>
        </div>

        {/* RECENT CLASS SESSIONS TABLE */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-cre-border shadow-xs p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-cre-border">
            <div>
              <h3 className="text-sm font-bold text-cre-navy">
                Conducted Weekly Class Sessions
              </h3>
              <p className="text-[11px] text-slate-500">
                Detailed turnout for each class conducted at {activeCenter.name}
              </p>
            </div>

            <Link
              href="/center-admin/attendance"
              className="text-xs font-bold text-cre-green hover:underline flex items-center"
            >
              + Mark New Class <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 rounded-l-xl">Class Date</th>
                  <th className="py-2.5 px-4">Day</th>
                  <th className="py-2.5 px-4">Total Students</th>
                  <th className="py-2.5 px-4">Present</th>
                  <th className="py-2.5 px-4">Absent</th>
                  <th className="py-2.5 px-4">Attendance Rate</th>
                  <th className="py-2.5 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sessionBreakdown.map((s) => (
                  <tr key={s.date} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-cre-navy">{s.date}</td>
                    <td className="py-3 px-4 text-slate-600">{activeCenter.regularDay}</td>
                    <td className="py-3 px-4 text-slate-700">{s.total}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-cre-green-light text-cre-green">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {s.present}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" /> {s.absent}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.rate >= 80 ? 'bg-cre-green' : s.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${s.rate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-800">{s.rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/center-admin/reports?tab=class_attendance&date=${s.date}`}
                        className="inline-flex items-center text-xs font-bold text-cre-navy hover:text-cre-green transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Class Report
                      </Link>
                    </td>
                  </tr>
                ))}
                {sessionBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No attendance sessions recorded yet. Click "Mark Attendance" to begin.
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
