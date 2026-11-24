'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Expense, Donation } from '@/types';
import { formatCurrency, DEFAULT_WEEKLY_EXPENSE_CATEGORIES } from '@/lib/constants';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Wallet,
  Receipt,
  HeartHandshake,
  TrendingUp,
  Plus,
  Calendar,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  IndianRupee,
  Coffee,
  Car,
} from 'lucide-react';

export default function CenterAdminFinancePage() {
  const { activeCenter, adminUser, refreshData } = useAuth();
  const centerId = activeCenter?.id || '';

  const [filterMode, setFilterMode] = useState<'month' | 'date'>('month');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [localVersion, setLocalVersion] = useState(0);

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [deleteDonationId, setDeleteDonationId] = useState<string | null>(null);

  // Expense Form State
  const [expenseType, setExpenseType] = useState<'weekly' | 'other'>('weekly');
  const [category, setCategory] = useState<string>('Faculty TA');
  const [customCategory, setCustomCategory] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Donation Form State
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState<number | ''>('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [donationRemarks, setDonationRemarks] = useState('');

  const activePeriodFilter = filterMode === 'month' ? selectedMonth : undefined;

  const summary = useMemo(() => {
    return dataService.getFinancialSummary(centerId, activePeriodFilter);
  }, [centerId, activePeriodFilter, localVersion]);

  const rawFeePayments = useMemo(() => {
    return dataService.getFeePayments(centerId, activePeriodFilter);
  }, [centerId, activePeriodFilter, localVersion]);

  const rawDonations = useMemo(() => {
    return dataService.getDonations(centerId, activePeriodFilter);
  }, [centerId, activePeriodFilter, localVersion]);

  const rawExpenses = useMemo(() => {
    return dataService.getExpenses(centerId, activePeriodFilter);
  }, [centerId, activePeriodFilter, localVersion]);

  // If filterMode === 'date', filter items strictly by exact date
  const feePayments = useMemo(() => {
    if (filterMode === 'date') return rawFeePayments.filter((p) => p.paymentDate === selectedDate);
    return rawFeePayments;
  }, [rawFeePayments, filterMode, selectedDate]);

  const donations = useMemo(() => {
    if (filterMode === 'date') return rawDonations.filter((d) => d.date === selectedDate);
    return rawDonations;
  }, [rawDonations, filterMode, selectedDate]);

  const expenses = useMemo(() => {
    if (filterMode === 'date') return rawExpenses.filter((e) => e.date === selectedDate);
    return rawExpenses;
  }, [rawExpenses, filterMode, selectedDate]);

  const weeklyExpenses = useMemo(() => {
    return expenses.filter((e) => e.type === 'weekly');
  }, [expenses]);

  const otherExpenses = useMemo(() => {
    return expenses.filter((e) => e.type === 'other');
  }, [expenses]);

  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseType('weekly');
    setCategory('Faculty TA');
    setCustomCategory('');
    setTitle('');
    setAmount('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setSessionDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setExpenseType(exp.type);
    setCategory(exp.category);
    setCustomCategory('');
    setTitle(exp.title || '');
    setAmount(exp.amount);
    setExpDate(exp.date);
    setSessionDate(exp.sessionDate || exp.date);
    setDescription(exp.description || '');
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !centerId) return;

    const finalCategory = category === 'Other' ? (customCategory || 'Misc') : category;

    if (editingExpense) {
      dataService.updateExpense(
        editingExpense.id,
        {
          type: expenseType,
          sessionDate: expenseType === 'weekly' ? sessionDate : undefined,
          category: finalCategory,
          title: expenseType === 'other' ? title : undefined,
          amount: Number(amount),
          date: expDate,
          description,
        },
        adminUser?.name || 'Centre Admin'
      );
    } else {
      dataService.addExpense({
        centerId,
        type: expenseType,
        sessionDate: expenseType === 'weekly' ? sessionDate : undefined,
        category: finalCategory,
        title: expenseType === 'other' ? title : undefined,
        amount: Number(amount),
        date: expDate,
        description,
        recordedBy: adminUser?.name || 'Centre Admin',
      });
    }

    setLocalVersion((v) => v + 1);
    setIsExpenseModalOpen(false);
    refreshData();
  };

  const handleDeleteExpense = (id: string) => {
    setDeleteExpenseId(id);
  };

  const handleConfirmDeleteExpense = () => {
    if (!deleteExpenseId) return;
    dataService.deleteExpense(deleteExpenseId, adminUser?.name || 'Centre Admin');
    setLocalVersion((v) => v + 1);
    setDeleteExpenseId(null);
    refreshData();
  };

  const handleOpenAddDonation = () => {
    setEditingDonation(null);
    setDonorName('');
    setDonationAmount('');
    setDonationDate(new Date().toISOString().split('T')[0]);
    setDonationRemarks('');
    setIsDonationModalOpen(true);
  };

  const handleOpenEditDonation = (d: Donation) => {
    setEditingDonation(d);
    setDonorName(d.donorName || '');
    setDonationAmount(d.amount);
    setDonationDate(d.date);
    setDonationRemarks(d.remarks || '');
    setIsDonationModalOpen(true);
  };

  const handleSaveDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount || Number(donationAmount) <= 0 || !centerId) return;

    if (editingDonation) {
      dataService.updateDonation(
        editingDonation.id,
        {
          donorName: donorName || 'Anonymous Well-wisher',
          amount: Number(donationAmount),
          date: donationDate,
          remarks: donationRemarks,
        },
        adminUser?.name || 'Centre Admin'
      );
    } else {
      dataService.addDonation({
        centerId,
        donorName: donorName || 'Anonymous Well-wisher',
        amount: Number(donationAmount),
        date: donationDate,
        remarks: donationRemarks,
        recordedBy: adminUser?.name || 'Centre Admin',
      });
    }

    setLocalVersion((v) => v + 1);
    setIsDonationModalOpen(false);
    refreshData();
  };

  const handleDeleteDonation = (id: string) => {
    setDeleteDonationId(id);
  };

  const handleConfirmDeleteDonation = () => {
    if (!deleteDonationId) return;
    dataService.deleteDonation(deleteDonationId, adminUser?.name || 'Centre Admin');
    setLocalVersion((v) => v + 1);
    setDeleteDonationId(null);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Income & Expense Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Centre financial ledger, class session expenses, and voluntary donations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Month vs Date */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'month'
                    ? 'bg-white text-cre-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                By Month
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('date')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'date'
                    ? 'bg-white text-cre-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                By Date
              </button>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-xl border border-cre-border shadow-xs text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-cre-navy" />
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
                  className="bg-transparent focus:outline-hidden cursor-pointer font-bold"
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenAddDonation}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-cre-navy bg-cre-navy-light hover:bg-cre-navy hover:text-white transition-all shadow-xs"
            >
              + Donation
            </button>

            <button
              type="button"
              onClick={handleOpenAddExpense}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20 inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Record Expense
            </button>
          </div>
        </div>

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Fee Income
            </span>
            <div className="mt-2 text-2xl font-black text-cre-green">
              {formatCurrency(summary.totalFeeIncome)}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Auto-linked from fee payments
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Donations
            </span>
            <div className="mt-2 text-2xl font-black text-cre-navy">
              {formatCurrency(summary.totalDonationIncome)}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              {donations.length} contributions
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Expenses
            </span>
            <div className="mt-2 text-2xl font-black text-slate-800">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Weekly: {formatCurrency(summary.totalWeeklyExpense)} | Other: {formatCurrency(summary.totalOtherExpense)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Surplus / Balance
            </span>
            <div
              className={`mt-2 text-2xl font-black ${
                summary.netBalance >= 0 ? 'text-cre-navy' : 'text-red-600'
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Total Income: {formatCurrency(summary.totalIncome)}
            </p>
          </div>
        </div>

        {/* 2 Grid Columns: Income vs Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INCOME COLUMN */}
          <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                  Income Register ({selectedMonth})
                </h3>
                <span className="text-[10px] text-slate-400">
                  Total Income: <span className="font-bold text-cre-green">{formatCurrency(summary.totalIncome)}</span>
                </span>
              </div>
            </div>

            <div className="divide-y divide-cre-border max-h-96 overflow-y-auto">
              {feePayments.map((p, idx) => {
                const st = dataService.getStudentById(p.studentId);
                return (
                  <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">{st?.name}</span>
                        <span className="text-[10px] text-slate-400">
                          Date: {p.paymentDate} • Monthly Fee • {p.remarks || 'Cash'}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-cre-green">+{formatCurrency(p.amount)}</span>
                  </div>
                );
              })}

              {donations.map((d, idx) => (
                <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs bg-amber-50/20 group">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-100/70 text-amber-700 shrink-0">
                      #{feePayments.length + idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-cre-navy block">Donation: {d.donorName}</span>
                      <span className="text-[10px] text-slate-400">
                        Date: {d.date} • {d.remarks || 'General Donation'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-cre-navy">+{formatCurrency(d.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditDonation(d)}
                      className="p-1 text-slate-400 hover:text-cre-navy rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit donation"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDonation(d.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete donation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {feePayments.length === 0 && donations.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No income entries recorded for selected period.
                </div>
              )}
            </div>
          </div>

          {/* EXPENSE COLUMN */}
          <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                  Expense Register ({filterMode === 'month' ? selectedMonth : selectedDate})
                </h3>
                <span className="text-[10px] text-slate-400">
                  Total Expenses: <span className="font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</span>
                </span>
              </div>
            </div>

            <div className="divide-y divide-cre-border max-h-96 overflow-y-auto">
              {expenses.map((e, idx) => (
                <div key={e.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs group">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900">
                          {e.category} {e.title ? `– ${e.title}` : ''}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {e.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Date: {e.date} • {e.description || 'Session Expense'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">-{formatCurrency(e.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditExpense(e)}
                      className="p-1 text-slate-400 hover:text-cre-navy rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit expense"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(e.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No expense records found for {selectedMonth}.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RECORD EXPENSE MODAL */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <h3 className="text-sm font-bold text-cre-navy">{editingExpense ? 'Edit Expense' : 'Record Expense'}</h3>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setExpenseType('weekly')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      expenseType === 'weekly' ? 'bg-cre-navy text-white' : 'text-slate-600'
                    }`}
                  >
                    Weekly Class Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType('other')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      expenseType === 'other' ? 'bg-cre-navy text-white' : 'text-slate-600'
                    }`}
                  >
                    Other Expense
                  </button>
                </div>

                {expenseType === 'weekly' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expense Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    >
                      {DEFAULT_WEEKLY_EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Other">Other Custom Category</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expense Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Exam Question Paper Printing"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>
                )}

                {category === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Maintenance, Sound system"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="e.g. 300"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-bold focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Remarks
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Tea and biscuits for 25 students"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-cre-border flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                  >
                    {editingExpense ? 'Update Expense' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECORD DONATION MODAL */}
        {isDonationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <h3 className="text-sm font-bold text-cre-navy">{editingDonation ? 'Edit Voluntary Donation' : 'Record Voluntary Donation'}</h3>
                <button
                  type="button"
                  onClick={() => setIsDonationModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDonation} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Donor Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Haji Usman / Anonymous"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(Number(e.target.value))}
                      placeholder="1000"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-bold text-cre-green"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={donationDate}
                      onChange={(e) => setDonationDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={donationRemarks}
                    onChange={(e) => setDonationRemarks(e.target.value)}
                    placeholder="e.g. Sponsoring student books"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl"
                  />
                </div>

                <div className="pt-3 border-t border-cre-border flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsDonationModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                  >
                    {editingDonation ? 'Update Donation' : 'Save Donation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Expense Modal */}
        <ConfirmModal
          isOpen={!!deleteExpenseId}
          title="Delete Expense Record"
          message="Are you sure you want to delete this expense record? This action will permanently remove it from the centre financial ledger."
          confirmText="Delete Expense"
          isDanger={true}
          onConfirm={handleConfirmDeleteExpense}
          onCancel={() => setDeleteExpenseId(null)}
        />

        {/* Confirm Delete Donation Modal */}
        <ConfirmModal
          isOpen={!!deleteDonationId}
          title="Delete Donation Record"
          message="Are you sure you want to delete this donation record? This will deduct the contribution from centre accounts."
          confirmText="Delete Donation"
          isDanger={true}
          onConfirm={handleConfirmDeleteDonation}
          onCancel={() => setDeleteDonationId(null)}
        />
      </div>
    </AppShell>
  );
}
