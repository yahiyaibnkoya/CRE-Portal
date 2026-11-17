'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Student, StudentStatus } from '@/types';
import { formatCurrency, normalizePhoneNumber } from '@/lib/constants';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Calendar,
  Edit2,
  Eye,
  UserX,
  UserCheck,
  CheckCircle,
  X,
  IndianRupee,
  CalendarCheck,
  Award,
  Trash2,
} from 'lucide-react';

export default function CenterAdminStudentsPage() {
  const { activeCenter, refreshData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('Active');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToToggleStatus, setStudentToToggleStatus] = useState<Student | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Boy' | 'Girl'>('Boy');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [place, setPlace] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [defaultFee, setDefaultFee] = useState<number>(100);
  const [status, setStatus] = useState<StudentStatus>('Active');

  const centerId = activeCenter?.id || '';
  const students = dataService.getStudents(centerId);

  const filteredStudents = students.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchAdm = s.admissionNumber.toLowerCase().includes(q);
      const matchParent = s.parentName.toLowerCase().includes(q);
      const matchPhone = (s.parentPhone || '').includes(q) || (s.studentPhone || '').includes(q);
      const matchPlace = s.place.toLowerCase().includes(q);
      return matchName || matchAdm || matchParent || matchPhone || matchPlace;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setName('');
    setGender('Boy');
    setParentName('');
    setParentPhone('');
    setStudentPhone('');
    setPlace('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setDefaultFee(activeCenter?.defaultFee || 100);
    setStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setGender(student.gender || 'Boy');
    setParentName(student.parentName);
    setParentPhone(student.parentPhone || '');
    setStudentPhone(student.studentPhone || '');
    setPlace(student.place);
    setAdmissionDate(student.admissionDate);
    setDefaultFee(student.defaultFee);
    setStatus(student.status);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId) return;

    dataService.saveStudent({
      id: editingStudent?.id,
      centerId,
      name,
      gender,
      parentName,
      parentPhone: parentPhone ? normalizePhoneNumber(parentPhone) : '',
      studentPhone: studentPhone ? normalizePhoneNumber(studentPhone) : '',
      place,
      admissionDate,
      defaultFee: Number(defaultFee),
      status,
    });

    setIsModalOpen(false);
    refreshData();
  };

  const handleConfirmDeleteStudent = () => {
    if (!studentToDelete) return;
    dataService.deleteStudent(studentToDelete.id, 'Centre Admin');
    setStudentToDelete(null);
    refreshData();
  };

  const handleConfirmToggleStatus = () => {
    if (!studentToToggleStatus) return;
    const nextStatus: StudentStatus = studentToToggleStatus.status === 'Active' ? 'Inactive' : 'Active';
    dataService.setStudentStatus(studentToToggleStatus.id, nextStatus);
    setStudentToToggleStatus(null);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Student Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrolment directory, admission records, and student profiles for {activeCenter?.name}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Student
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, admission no, parent phone, place..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-cre-border rounded-xl bg-white focus:ring-2 focus:ring-cre-green focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="Active">Active Students Only</option>
              <option value="Inactive">Inactive / Left Students</option>
              <option value="ALL">All Students</option>
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Adm No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Gender</th>
                  <th className="py-3.5 px-4">Parent / Guardian</th>
                  <th className="py-3.5 px-4">Parent Phone</th>
                  <th className="py-3.5 px-4">Place</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">
                      {s.admissionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{s.name}</span>
                      <span className="text-[10px] text-slate-400">Admitted: {s.admissionDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.gender === 'Girl'
                            ? 'bg-pink-50 text-pink-700 border border-pink-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {s.gender || 'Boy'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{s.parentName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {s.parentPhone || <span className="text-slate-400 italic">No Login Access</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{s.place || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-cre-green">
                      ₹{s.defaultFee}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Active'
                            ? 'bg-cre-green-light text-cre-green border border-cre-green/30'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setViewingStudent(s)}
                          className="p-1.5 text-slate-500 hover:text-cre-navy hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Student Full Profile"
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
                          title={s.status === 'Active' ? 'Mark Inactive (Leaving)' : 'Restore Active'}
                        >
                          {s.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentToDelete(s)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Student Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                      No students found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT STUDENT MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cre-green-light text-cre-green">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-cre-navy">
                    {editingStudent ? 'Edit Student Details' : 'Register New Student'}
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

              <form onSubmit={handleSaveStudent} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Muhammed Rayan"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gender *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGender('Boy')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          gender === 'Boy'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-cre-border hover:bg-slate-50'
                        }`}
                      >
                        Boy
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('Girl')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          gender === 'Girl'
                            ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                            : 'bg-white text-slate-700 border-cre-border hover:bg-slate-50'
                        }`}
                      >
                        Girl
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Rayees K."
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent Phone Number (Portal Login)
                    </label>
                    <input
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="e.g. 9847000111"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-mono focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Enables password-free parent/student portal login.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="Optional student mobile"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-mono focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Place / Locality *
                    </label>
                    <input
                      type="text"
                      required
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="e.g. Kizhakkethala"
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admission Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Monthly Fee (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={defaultFee}
                      onChange={(e) => setDefaultFee(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-bold text-cre-green"
                    />
                  </div>
                </div>

                {editingStudent && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enrolment Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StudentStatus)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    >
                      <option value="Active">Active Student</option>
                      <option value="Inactive">Inactive / Left (Historical records kept)</option>
                    </select>
                  </div>
                )}

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
                    Save Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW STUDENT PROFILE MODAL */}
        {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-cre-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-cre-green text-white font-bold flex items-center justify-center text-sm shadow-xs">
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
                      Admission No: <span className="font-mono font-bold text-cre-navy">{viewingStudent.admissionNumber}</span>
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

              {/* Student Overview */}
              <div className="my-4 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Parent / Guardian:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.parentName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Parent Phone:</span>
                  <span className="font-semibold font-mono text-slate-800">{viewingStudent.parentPhone || 'None'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Place:</span>
                  <span className="font-semibold text-slate-800">{viewingStudent.place}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Monthly Fee:</span>
                  <span className="font-bold text-cre-green">₹{viewingStudent.defaultFee} / month</span>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="mb-4 p-4 bg-cre-green-light/30 rounded-xl border border-cre-green/20">
                <div className="flex items-center space-x-2 mb-2 text-cre-navy font-bold text-xs">
                  <CalendarCheck className="w-4 h-4 text-cre-green" />
                  <span>Attendance History</span>
                </div>
                {(() => {
                  const att = dataService.calculateStudentAttendance(viewingStudent.id, viewingStudent.centerId);
                  return (
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
                      <div>Conducted: <span className="font-bold">{att.totalConducted}</span></div>
                      <div>Present: <span className="font-bold text-cre-green">{att.present}</span></div>
                      <div>Attendance: <span className="font-bold text-cre-navy">{att.percentage}%</span></div>
                    </div>
                  );
                })()}
              </div>

              {/* Fee History */}
              <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2 mb-2 text-cre-navy font-bold text-xs">
                  <IndianRupee className="w-4 h-4 text-cre-navy" />
                  <span>Recent Fee Payments</span>
                </div>
                {(() => {
                  const payments = dataService.getFeePayments(viewingStudent.centerId).filter(p => p.studentId === viewingStudent.id);
                  return (
                    <div className="space-y-1.5 text-xs">
                      {payments.slice(0, 3).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-200 last:border-0">
                          <span>Month: {p.month} ({p.paymentDate})</span>
                          <span className="font-bold text-cre-green">+{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                      {payments.length === 0 && <span className="text-slate-400 text-[11px]">No fee payments recorded.</span>}
                    </div>
                  );
                })()}
              </div>

              {/* Exam Marks */}
              <div className="p-4 bg-cre-navy-light/40 rounded-xl border border-cre-navy/15">
                <div className="flex items-center space-x-2 mb-2 text-cre-navy font-bold text-xs">
                  <Award className="w-4 h-4 text-cre-navy" />
                  <span>Exam Performance</span>
                </div>
                {(() => {
                  const marks = dataService.getExamMarks(viewingStudent.centerId, undefined, viewingStudent.id);
                  return (
                    <div className="space-y-1 text-xs">
                      {marks.map(m => {
                        const exam = dataService.getExamById(m.examId);
                        const sub = exam?.subjects.find(s => s.id === m.subjectId);
                        return (
                          <div key={m.id} className="flex justify-between text-[11px]">
                            <span>{exam?.name} – {sub?.name || 'Subject'}:</span>
                            <span className="font-bold font-mono">{m.marksObtained} / {m.maxMarks}</span>
                          </div>
                        );
                      })}
                      {marks.length === 0 && <span className="text-slate-400 text-[11px]">No exam marks recorded yet.</span>}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-cre-navy bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Student Modal */}
        <ConfirmModal
          isOpen={!!studentToDelete}
          title="Delete Student Record"
          message={
            <span>
              Are you sure you want to permanently delete student{' '}
              <strong>{studentToDelete?.name}</strong> (Admission No:{' '}
              {studentToDelete?.admissionNumber})? All their enrolment data will be
              permanently erased from the centre register.
            </span>
          }
          confirmText="Delete Student"
          isDanger={true}
          onConfirm={handleConfirmDeleteStudent}
          onClose={() => setStudentToDelete(null)}
        />

        {/* Confirm Toggle Status Modal */}
        <ConfirmModal
          isOpen={!!studentToToggleStatus}
          title={
            studentToToggleStatus?.status === 'Active'
              ? 'Mark Student as Inactive'
              : 'Reactivate Student'
          }
          message={
            <span>
              Are you sure you want to mark student{' '}
              <strong>{studentToToggleStatus?.name}</strong> as{' '}
              <strong>
                {studentToToggleStatus?.status === 'Active' ? 'Inactive' : 'Active'}
              </strong>
              ?
            </span>
          }
          confirmText={
            studentToToggleStatus?.status === 'Active' ? 'Mark Inactive' : 'Activate'
          }
          isDanger={studentToToggleStatus?.status === 'Active'}
          onConfirm={handleConfirmToggleStatus}
          onClose={() => setStudentToToggleStatus(null)}
        />
      </div>
    </AppShell>
  );
}
