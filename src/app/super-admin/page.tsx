'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { formatCurrency } from '@/lib/constants';
import {
  Building2,
  Users,
  CalendarCheck,
  Calendar,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  Filter,
  FileText,
  IndianRupee,
  ArrowRight,
  ShieldAlert,
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

export default function SuperAdminDashboardPage() {
  const { availableCenters } = useAuth();

  // Filters
  const [selectedCenterFilter, setSelectedCenterFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');

  const centers = dataService.getCenters();
  const allStudents = dataService.getStudents(selectedCenterFilter === 'ALL' ? undefined : selectedCenterFilter);
  const activeStudents = allStudents.filter((s) => s.status === 'Active');

  // Centre status counts
  const totalCenters = centers.length;
  const activeCenters = centers.filter((c) => c.status === 'Active').length;
  const suspendedCenters = centers.filter((c) => c.status === 'Suspended').length;
  const pendingCenters = centers.filter((c) => c.status === 'Pending Approval').length;

  // Attendance metrics calculation
  const attendanceMetrics = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalRecords = 0;

    const filteredCenters = selectedCenterFilter === 'ALL'
      ? centers
      : centers.filter((c) => c.id === selectedCenterFilter);

    const allSessionDates = new Set<string>();

    filteredCenters.forEach((c) => {
      const records = dataService.getAttendanceRecords(c.id).filter((a) => a.date.startsWith(selectedMonth));
      records.forEach((r) => {
        allSessionDates.add(`${c.id}_${r.date}`);
        if (r.status === 'Present') totalPresent++;
        else if (r.status === 'Absent') totalAbsent++;
        else if (r.status === 'Leave') totalLeave++;
        totalRecords++;
      });
    });

    const averageRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    const conductedSessions = allSessionDates.size;

    return {
      totalPresent,
      totalAbsent,
      totalLeave,
      totalRecords,
      averageRate,
      conductedSessions,
    };
  }, [selectedCenterFilter, selectedMonth, centers]);

  // Centre-wise Attendance Performance for chart
  const centerAttendanceChartData = useMemo(() => {
    return centers.map((c) => {
      const records = dataService.getAttendanceRecords(c.id).filter((a) => a.date.startsWith(selectedMonth));
      const present = records.filter((a) => a.status === 'Present').length;
      const total = records.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        centerName: c.name.replace(' CRE Centre', ''),
        'Attendance Rate %': rate,
        'Present Count': present,
        'Total Attendances': total,
      };
    });
  }, [centers, selectedMonth]);

  // Centre-wise detailed Attendance Health table
  const centerAttendanceTable = useMemo(() => {
    return centers.map((c) => {
      const studs = dataService.getStudents(c.id).filter((s) => s.status === 'Active');
      const records = dataService.getAttendanceRecords(c.id).filter((a) => a.date.startsWith(selectedMonth));
      const dates = Array.from(new Set(records.map((a) => a.date)));
      const present = records.filter((a) => a.status === 'Present').length;
      const absent = records.filter((a) => a.status === 'Absent').length;
      const total = records.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        id: c.id,
        name: c.name,
        place: c.place,
        district: c.district,
        activeStudents: studs.length,
        sessionsConducted: dates.length,
        present,
        absent,
        rate,
        status: c.status,
      };
    });
  }, [centers, selectedMonth]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Super Admin Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Statewide governance & attendance monitoring for Continuing Religious Education
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Centre Filter */}
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border shadow-xs text-xs">
              <Filter className="w-3.5 h-3.5 text-cre-navy" />
              <select
                value={selectedCenterFilter}
                onChange={(e) => setSelectedCenterFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All CRE Centres (Statewide)</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="bg-white px-3 py-2 rounded-xl border border-cre-border shadow-xs text-xs font-semibold text-slate-800 flex items-center space-x-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4 TOP ATTENDANCE & GOVERNANCE STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Total Centres */}
          <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Centres
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-cre-navy-light text-cre-navy">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline space-x-2">
              <span className="text-xl sm:text-2xl font-black text-cre-navy">{totalCenters}</span>
              <span className="text-[11px] sm:text-xs text-cre-green font-semibold">
                {activeCenters} Active
              </span>
            </div>
            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1 text-[9px] sm:text-[10px] text-slate-500">
              <span className="px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 font-bold border border-amber-200">
                {pendingCenters} Pending
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-red-50 text-red-700 font-bold border border-red-200">
                {suspendedCenters} Suspended
              </span>
            </div>
          </div>

          {/* Card 2: Registered Students */}
          <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Students
              </span>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-cre-navy-light text-cre-navy">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline space-x-2">
              <span className="text-xl sm:text-2xl font-black text-cre-navy">{allStudents.length}</span>
              <span className="text-[11px] sm:text-xs text-cre-green font-semibold">
                {activeStudents.length} Active
              </span>
            </div>
            <p className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-slate-400">
              Statewide registered students
            </p>
          </div>

          {/* Card 3: Statewide Attendance Turnout % */}
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
                {attendanceMetrics.averageRate}%
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">Average</span>
            </div>
            <div className="mt-2 sm:mt-3 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500">
              <span>Present: <strong className="text-cre-green">{attendanceMetrics.totalPresent}</strong></span>
              <span>Absent: <strong className="text-red-600">{attendanceMetrics.totalAbsent}</strong></span>
            </div>
          </div>

          {/* Card 4: Total Sessions Conducted */}
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
                {attendanceMetrics.conductedSessions}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">Sessions</span>
            </div>
            <p className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-slate-400">
              Classes held in {selectedMonth}
            </p>
          </div>
        </div>

        {/* ATTENDANCE CHART: CENTRE-WISE PERFORMANCE */}
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-cre-border shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-cre-navy">
                Centre-wise Attendance Performance ({selectedMonth})
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                Comparing weekly attendance rates across all affiliated centres
              </p>
            </div>
            <Link
              href="/super-admin/reports"
              className="text-xs font-bold text-cre-green hover:underline inline-flex items-center"
            >
              Statewide Reports <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {centerAttendanceChartData.length === 0 ? (
            <div className="h-40 sm:h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Building2 className="w-8 h-8 text-slate-300 mb-2" />
              <p>No centre attendance data available yet.</p>
            </div>
          ) : (
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={centerAttendanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="centerName" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }}
                    formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                  />
                  <Bar dataKey="Attendance Rate %" fill="#2fb44b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CENTRE ATTENDANCE LEAGUE TABLE */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-cre-border">
            <div>
              <h3 className="text-sm font-bold text-cre-navy">
                Centre Attendance Governance Table
              </h3>
              <p className="text-[11px] text-slate-500">
                Detailed attendance monitoring and turnout rate by affiliated centre
              </p>
            </div>

            <Link
              href="/super-admin/centers"
              className="text-xs font-bold text-cre-navy hover:text-cre-green transition-colors"
            >
              Manage Centres →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 rounded-l-xl">Centre Name</th>
                  <th className="py-2.5 px-4">District</th>
                  <th className="py-2.5 px-4">Active Students</th>
                  <th className="py-2.5 px-4">Sessions</th>
                  <th className="py-2.5 px-4">Present</th>
                  <th className="py-2.5 px-4">Absent</th>
                  <th className="py-2.5 px-4">Attendance Rate</th>
                  <th className="py-2.5 px-4 rounded-r-xl text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {centerAttendanceTable.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                      No CRE Centres registered yet. Register a centre to start monitoring attendance.
                    </td>
                  </tr>
                ) : (
                  centerAttendanceTable.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-cre-navy">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600">{c.district}</td>
                      <td className="py-3 px-4 text-slate-700">{c.activeStudents}</td>
                      <td className="py-3 px-4 text-slate-700">{c.sessionsConducted}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-cre-green">{c.present}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-red-600">{c.absent}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                c.rate >= 80 ? 'bg-cre-green' : c.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${c.rate}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-800">{c.rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'Active'
                              ? 'bg-cre-green-light text-cre-green'
                              : c.status === 'Suspended'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
