'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Student } from '@/types';
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
  IndianRupee,
  X,
} from 'lucide-react';

export default function SuperAdminStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const centers = dataService.getCenters();
  const allStudents = dataService.getStudents();

  const filteredStudents = allStudents.filter((s) => {
    if (centerFilter !== 'ALL' && s.centerId !== centerFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchAdm = s.admissionNumber.toLowerCase().includes(q);
      const matchParent = s.parentName.toLowerCase().includes(q);
      const matchPhone = (s.parentPhone || '').includes(q) || (s.studentPhone || '').includes(q);
      return matchName || matchAdm || matchParent || matchPhone;
    }
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Statewide Student Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of all students enrolled across affiliated CRE centres
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, admission no, parent phone..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-cre-border rounded-xl bg-white focus:ring-2 focus:ring-cre-green focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Centre:</span>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All CRE Centres</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Enrolment</option>
              <option value="Inactive">Inactive / Left</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Adm No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Parent / Guardian</th>
                  <th className="py-3.5 px-4">Centre</th>
                  <th className="py-3.5 px-4">Parent Phone</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {filteredStudents.map((s) => {
                  const center = dataService.getCenterById(s.centerId);
                  const att = dataService.calculateStudentAttendance(s.id, s.centerId);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">
                        {s.admissionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {s.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{s.place}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{s.parentName}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700">
                          {center?.name || s.centerId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {s.parentPhone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.percentage >= 75
                              ? 'bg-cre-green-light text-cre-green'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {att.percentage}% ({att.present}/{att.totalConducted})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingStudent(s)}
                          className="p-1.5 text-slate-500 hover:text-cre-navy hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Student Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* STUDENT DETAILS MODAL */}
        {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-cre-green-light text-cre-green flex items-center justify-center font-bold text-sm">
                    {viewingStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-cre-navy">{viewingStudent.name}</h3>
                    <p className="text-[11px] text-slate-500">
                      Adm No: {viewingStudent.admissionNumber}
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
      </div>
    </AppShell>
  );
}
