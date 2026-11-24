'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { MonthlyFeeRecord, FeePayment, Student, FeeStatus } from '@/types';
import { formatCurrency } from '@/lib/constants';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  IndianRupee,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  History,
  X,
  ArrowUpRight,
  Edit2,
  Trash2,
  RotateCcw,
} from 'lucide-react';

export default function CenterAdminFeesPage() {
  const { activeCenter, adminUser, refreshData, dataVersion } = useAuth();
  const centerId = activeCenter?.id || '';

  const [filterMode, setFilterMode] = useState<'month' | 'date'>('month');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Payment Recording Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRemarks, setPayRemarks] = useState('');

  // Edit Existing Payment Modal
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<FeePayment | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState<number | ''>('');
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editPaymentRemarks, setEditPaymentRemarks] = useState('');

  // Reset Fee to Unpaid confirmation modal
  const [resetUnpaidStudent, setResetUnpaidStudent] = useState<{ student: Student; month: string } | null>(null);

  // Delete Individual Payment confirmation modal
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  // Fee Adjustment Modal (editing expected fee for a month)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustStudent, setAdjustStudent] = useState<Student | null>(null);
  const [newExpectedFee, setNewExpectedFee] = useState<number>(100);
  const [adjustRemarks, setAdjustRemarks] = useState('');

  // Student Payment History Modal
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  const activeStudents = useMemo(() => {
    return dataService.getStudents(centerId).filter((s) => s.status === 'Active');
  }, [centerId, dataVersion]);

  // Target month derived from selectedDate when filterMode is 'date'
  const activeMonth = useMemo(() => {
    if (filterMode === 'date') {
      return selectedDate.substring(0, 7);
    }
    return selectedMonth;
  }, [filterMode, selectedDate, selectedMonth]);

  const monthlyFees = useMemo(() => {
    return dataService.getMonthlyFees(centerId, activeMonth);
  }, [centerId, activeMonth, dataVersion]);

  const feePayments = useMemo(() => {
    let list = dataService.getFeePayments(centerId);
    if (filterMode === 'month') {
      list = list.filter((p) => p.month === selectedMonth);
    } else {
      list = list.filter((p) => p.paymentDate === selectedDate);
    }
    return list;
  }, [centerId, filterMode, selectedMonth, selectedDate, dataVersion]);

  // Merge active students with their monthly fee records
  const studentFeeRows = useMemo(() => {
    return activeStudents.map((st) => {
      const rec = monthlyFees.find((m) => m.studentId === st.id);
      const expected = rec ? rec.expectedFee : st.defaultFee;
      const paid = rec ? rec.paidAmount : 0;
      const outstanding = rec ? rec.outstandingAmount : expected;
      const advance = rec ? rec.advanceCredit : 0;
      const status: FeeStatus = rec ? rec.status : 'Unpaid';

      return {
        student: st,
        record: rec,
        expectedFee: expected,
        paidAmount: paid,
        outstandingAmount: outstanding,
        advanceCredit: advance,
        status,
        lastPaymentDate: rec?.lastPaymentDate,
      };
    });
  }, [activeStudents, monthlyFees]);

  const filteredRows = studentFeeRows.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = r.student.name.toLowerCase().includes(q);
      const matchAdm = r.student.admissionNumber.toLowerCase().includes(q);
      const matchParent = r.student.parentName.toLowerCase().includes(q);
      return matchName || matchAdm || matchParent;
    }
    return true;
  });

  // Totals
  const totalExpected = studentFeeRows.reduce((acc, r) => acc + r.expectedFee, 0);
  const totalCollected = studentFeeRows.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalOutstanding = studentFeeRows.reduce((acc, r) => acc + r.outstandingAmount, 0);
  const totalAdvance = studentFeeRows.reduce((acc, r) => acc + r.advanceCredit, 0);

  const handleOpenPayment = (st: Student) => {
    const row = studentFeeRows.find((r) => r.student.id === st.id);
    setSelectedStudentForPay(st);
    setPayAmount(row ? row.outstandingAmount || row.expectedFee : st.defaultFee);
    setPayDate(filterMode === 'date' ? selectedDate : new Date().toISOString().split('T')[0]);
    setPayRemarks('');
    setIsPayModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay || !payAmount || Number(payAmount) <= 0) return;

    dataService.recordFeePayment({
      centerId,
      studentId: selectedStudentForPay.id,
      month: activeMonth,
      amount: Number(payAmount),
      paymentDate: payDate,
      remarks: payRemarks,
      recordedBy: adminUser?.name || 'Centre Admin',
    });

    setIsPayModalOpen(false);
    refreshData();
  };

  const handleOpenEditLatestPayment = (st: Student) => {
    const payments = dataService.getFeePayments(centerId, activeMonth).filter((p) => p.studentId === st.id);
    if (payments.length > 0) {
      const latest = payments[payments.length - 1];
      setEditingPayment(latest);
      setEditPaymentAmount(latest.amount);
      setEditPaymentDate(latest.paymentDate);
      setEditPaymentRemarks(latest.remarks || '');
      setIsEditPaymentModalOpen(true);
    }
  };

  const handleOpenEditSpecificPayment = (p: FeePayment) => {
    setEditingPayment(p);
    setEditPaymentAmount(p.amount);
    setEditPaymentDate(p.paymentDate);
    setEditPaymentRemarks(p.remarks || '');
    setIsEditPaymentModalOpen(true);
  };

  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !editPaymentAmount || Number(editPaymentAmount) <= 0) return;

    dataService.updateFeePayment(
      editingPayment.id,
      {
        amount: Number(editPaymentAmount),
        paymentDate: editPaymentDate,
        remarks: editPaymentRemarks,
      },
      adminUser?.name || 'Centre Admin'
    );

    setIsEditPaymentModalOpen(false);
    refreshData();
  };

  const handleConfirmResetUnpaid = () => {
    if (resetUnpaidStudent) {
      dataService.resetStudentFeeToUnpaid(
        centerId,
        resetUnpaidStudent.student.id,
        resetUnpaidStudent.month,
        adminUser?.name || 'Centre Admin'
      );
      setResetUnpaidStudent(null);
      refreshData();
    }
  };

  const handleConfirmDeletePayment = () => {
    if (deletePaymentId) {
      dataService.deleteFeePayment(deletePaymentId, adminUser?.name || 'Centre Admin');
      setDeletePaymentId(null);
      refreshData();
    }
  };

  const handleOpenAdjust = (st: Student) => {
    const row = studentFeeRows.find((r) => r.student.id === st.id);
    setAdjustStudent(st);
    setNewExpectedFee(row ? row.expectedFee : st.defaultFee);
    setAdjustRemarks(row?.record?.remarks || '');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustStudent) return;

    dataService.updateStudentMonthlyFee({
      centerId,
      studentId: adjustStudent.id,
      month: activeMonth,
      expectedFee: Number(newExpectedFee),
      remarks: adjustRemarks,
    });

    setIsAdjustModalOpen(false);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Monthly Fee Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive student fee ledger, automated income accounting, and payment receipts
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border shadow-xs text-xs font-semibold text-slate-800">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 mr-1 shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                  filterMode === 'month' ? 'bg-cre-navy text-white' : 'text-slate-600'
                }`}
              >
                By Month
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('date')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                  filterMode === 'date' ? 'bg-cre-navy text-white' : 'text-slate-600'
                }`}
              >
                By Date
              </button>
            </div>
            {filterMode === 'month' ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent focus:outline-hidden cursor-pointer"
              />
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent focus:outline-hidden cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* 4 Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Expected ({activeMonth})
            </span>
            <div className="mt-2 text-2xl font-black text-cre-navy">
              {formatCurrency(totalExpected)}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {studentFeeRows.length} active students
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Collected Amount
            </span>
            <div className="mt-2 text-2xl font-black text-cre-green">
              {formatCurrency(totalCollected)}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {feePayments.length} payments recorded
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Outstanding Amount
            </span>
            <div className="mt-2 text-2xl font-black text-red-600">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {studentFeeRows.filter((r) => r.status === 'Unpaid' || r.status === 'Partially Paid').length} pending students
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Advance / Excess Credit
            </span>
            <div className="mt-2 text-2xl font-black text-amber-600">
              {formatCurrency(totalAdvance)}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Paid in excess of expected fee
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, admission number, parent..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-cre-border rounded-xl bg-white focus:ring-2 focus:ring-cre-green focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Advance / Excess">Advance / Excess</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Adm No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Expected Fee</th>
                  <th className="py-3.5 px-4">Total Paid</th>
                  <th className="py-3.5 px-4">Outstanding</th>
                  <th className="py-3.5 px-4">Credit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {filteredRows.map((r, idx) => (
                  <tr key={r.student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">
                      {r.student.admissionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{r.student.name}</span>
                      <span className="text-[10px] text-slate-400">Parent: {r.student.parentName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 font-semibold text-slate-700">
                        <span>{formatCurrency(r.expectedFee)}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(r.student)}
                          className="p-1 text-slate-400 hover:text-cre-navy rounded-sm"
                          title="Adjust expected fee for this month"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-cre-green">
                      {formatCurrency(r.paidAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-red-600">
                      {formatCurrency(r.outstandingAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">
                      {r.advanceCredit > 0 ? `+${formatCurrency(r.advanceCredit)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Paid'
                            ? 'bg-cre-green-light text-cre-green border border-cre-green/30'
                            : r.status === 'Advance / Excess'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'Partially Paid'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setHistoryStudent(r.student)}
                          className="p-1.5 text-slate-500 hover:text-cre-navy hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Payment History"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Edit Payment Button (if paid) */}
                        {r.paidAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditLatestPayment(r.student)}
                            className="p-1.5 text-slate-500 hover:text-cre-navy hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Payment Amount / Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reset to Unpaid Button (if marked as Paid or partially paid) */}
                        {r.paidAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => setResetUnpaidStudent({ student: r.student, month: activeMonth })}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reset Fee Status to Unpaid"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenPayment(r.student)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover shadow-xs transition-colors inline-flex items-center"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          {r.status === 'Paid' ? 'Pay More' : 'Pay'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                      No fee records found for current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAYMENT RECORDING MODAL */}
        {isPayModalOpen && selectedStudentForPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cre-green-light text-cre-green">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-cre-navy">Record Fee Payment</h3>
                    <p className="text-[11px] text-slate-500">{selectedStudentForPay.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="mt-4 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
                  <span className="text-slate-500">Target Month:</span>
                  <span className="font-bold text-cre-navy">{activeMonth}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-cre-border rounded-xl font-black text-cre-green focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supports full, partial, excess, or advance credit payments.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    placeholder="e.g. Cash, GPay, partial installment"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-cre-border flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT PAYMENT MODAL */}
        {isEditPaymentModalOpen && editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cre-navy text-white">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-cre-navy">Edit Fee Payment</h3>
                    <p className="text-[11px] text-slate-500">For Month: {editingPayment.month}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPaymentModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditPayment} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correct Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editPaymentAmount}
                    onChange={(e) => setEditPaymentAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-cre-border rounded-xl font-black text-cre-navy focus:ring-2 focus:ring-cre-navy focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editPaymentDate}
                    onChange={(e) => setEditPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={editPaymentRemarks}
                    onChange={(e) => setEditPaymentRemarks(e.target.value)}
                    placeholder="e.g. Corrected cash amount"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-navy focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-cre-border flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditPaymentModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover rounded-xl shadow-xs"
                  >
                    Update Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FEE ADJUSTMENT MODAL */}
        {isAdjustModalOpen && adjustStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <h3 className="text-sm font-bold text-cre-navy">Adjust Monthly Fee Amount</h3>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAdjust} className="mt-4 space-y-3">
                <p className="text-xs text-slate-600">
                  Adjust expected fee for <span className="font-bold">{adjustStudent.name}</span> for month <span className="font-bold text-cre-navy">{activeMonth}</span>:
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Expected Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newExpectedFee}
                    onChange={(e) => setNewExpectedFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adjustment Reason / Remarks
                  </label>
                  <input
                    type="text"
                    value={adjustRemarks}
                    onChange={(e) => setAdjustRemarks(e.target.value)}
                    placeholder="e.g. Concession, orphan, discount"
                    className="w-full px-3 py-2 text-xs border border-cre-border rounded-xl"
                  />
                </div>

                <div className="pt-3 border-t border-cre-border flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAdjustModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover rounded-lg shadow-xs"
                  >
                    Save Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PAYMENT HISTORY MODAL */}
        {historyStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div>
                  <h3 className="text-sm font-bold text-cre-navy">Payment History</h3>
                  <p className="text-xs text-slate-500">{historyStudent.name} ({historyStudent.admissionNumber})</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryStudent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 divide-y divide-cre-border max-h-72 overflow-y-auto">
                {(() => {
                  const payments = dataService.getFeePayments(centerId).filter(p => p.studentId === historyStudent.id);
                  if (payments.length === 0) {
                    return <p className="py-6 text-center text-xs text-slate-400">No payment transactions recorded.</p>;
                  }
                  return payments.map(p => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg">
                      <div>
                        <span className="font-bold text-slate-800 block">Fee for Month: {p.month}</span>
                        <span className="text-[10px] text-slate-400">Date: {p.paymentDate} • {p.remarks || 'Cash'} • By: {p.recordedBy}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-cre-green">+{formatCurrency(p.amount)}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditSpecificPayment(p)}
                          className="p-1 text-slate-400 hover:text-cre-navy hover:bg-slate-200 rounded-sm"
                          title="Edit Payment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePaymentId(p.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-cre-navy bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM RESET TO UNPAID MODAL */}
        <ConfirmModal
          isOpen={!!resetUnpaidStudent}
          title="Reset Fee to Unpaid"
          message={`Are you sure you want to reset fee status to Unpaid for "${resetUnpaidStudent?.student.name}" for month ${resetUnpaidStudent?.month}? This will remove all payments recorded for this month.`}
          confirmText="Reset to Unpaid"
          isDanger={true}
          onConfirm={handleConfirmResetUnpaid}
          onCancel={() => setResetUnpaidStudent(null)}
        />

        {/* CONFIRM DELETE INDIVIDUAL PAYMENT MODAL */}
        <ConfirmModal
          isOpen={!!deletePaymentId}
          title="Delete Fee Payment Record"
          message="Are you sure you want to permanently delete this payment transaction? This will automatically recalculate the student's monthly fee status."
          confirmText="Delete Payment"
          isDanger={true}
          onConfirm={handleConfirmDeletePayment}
          onCancel={() => setDeletePaymentId(null)}
        />
      </div>
    </AppShell>
  );
}
