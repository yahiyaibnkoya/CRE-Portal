'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { formatCurrency, DEFAULT_WEEKLY_EXPENSE_CATEGORIES } from '@/lib/constants';
import { generatePdfReport } from '@/lib/reportUtils';
import { Expense, Donation } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Wallet,
  IndianRupee,
  Receipt,
  HeartHandshake,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Building,
  Plus,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';

export default function SuperAdminFinancePage() {
  const { adminUser, refreshData } = useAuth();
  const [selectedCenter, setSelectedCenter] = useState('ALL');
  const [filterMode, setFilterMode] = useState<'month' | 'date'>('month');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [deleteDonationId, setDeleteDonationId] = useState<string | null>(null);

  // Expense form state
  const [expenseCenterId, setExpenseCenterId] = useState('');
  const [expenseType, setExpenseType] = useState<'weekly' | 'other'>('weekly');
  const [expenseCategory, setExpenseCategory] = useState(DEFAULT_WEEKLY_EXPENSE_CATEGORIES[0]);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDesc, setExpenseDesc] = useState('');

  // Donation form state
  const [donationCenterId, setDonationCenterId] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState<number | ''>('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [donationRemarks, setDonationRemarks] = useState('');

  const centers = dataService.getCenters();

  const feePayments = useMemo(() => {
    let list = dataService.getFeePayments(selectedCenter === 'ALL' ? undefined : selectedCenter);
    if (filterMode === 'month') {
      list = list.filter((p) => p.month === selectedMonth);
    } else {
      list = list.filter((p) => p.paymentDate === selectedDate);
    }
    return list;
  }, [selectedCenter, filterMode, selectedMonth, selectedDate]);

  const donations = useMemo(() => {
    let list = dataService.getDonations(selectedCenter === 'ALL' ? undefined : selectedCenter);
    if (filterMode === 'month') {
      list = list.filter((d) => d.date.startsWith(selectedMonth));
    } else {
      list = list.filter((d) => d.date === selectedDate);
    }
    return list;
  }, [selectedCenter, filterMode, selectedMonth, selectedDate]);

  const expenses = useMemo(() => {
    let list = dataService.getExpenses(selectedCenter === 'ALL' ? undefined : selectedCenter);
    if (filterMode === 'month') {
      list = list.filter((e) => e.date.startsWith(selectedMonth));
    } else {
      list = list.filter((e) => e.date === selectedDate);
    }
    return list;
  }, [selectedCenter, filterMode, selectedMonth, selectedDate]);

  const totalFeeIncome = feePayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalDonationIncome = donations.reduce((acc, d) => acc + (d.amount || 0), 0);
  const totalIncome = totalFeeIncome + totalDonationIncome;

  const totalWeeklyExpense = expenses
    .filter((e) => e.type === 'weekly')
    .reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalOtherExpense = expenses
    .filter((e) => e.type === 'other')
    .reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalExpenses = totalWeeklyExpense + totalOtherExpense;
  const netBalance = totalIncome - totalExpenses;

  // Expense Handlers
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseCenterId(centers.length > 0 ? centers[0].id : '');
    setExpenseType('weekly');
    setExpenseCategory(DEFAULT_WEEKLY_EXPENSE_CATEGORIES[0]);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseDesc('');
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setExpenseCenterId(e.centerId);
    setExpenseType(e.type);
    setExpenseCategory(e.category);
    setExpenseTitle(e.title || '');
    setExpenseAmount(e.amount);
    setExpenseDate(e.date);
    setExpenseDesc(e.description || '');
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || Number(expenseAmount) <= 0 || !expenseCenterId) return;

    if (editingExpense) {
      dataService.updateExpense(
        editingExpense.id,
        {
          centerId: expenseCenterId,
          type: expenseType,
          category: expenseType === 'weekly' ? expenseCategory : 'General',
          title: expenseType === 'other' ? expenseTitle : expenseCategory,
          amount: Number(expenseAmount),
          date: expenseDate,
          description: expenseDesc,
        },
        adminUser?.name || 'Super Admin'
      );
    } else {
      dataService.addExpense({
        centerId: expenseCenterId,
        type: expenseType,
        category: expenseType === 'weekly' ? expenseCategory : 'General',
        title: expenseType === 'other' ? expenseTitle : expenseCategory,
        amount: Number(expenseAmount),
        date: expenseDate,
        description: expenseDesc,
        recordedBy: adminUser?.name || 'Super Admin',
      });
    }

    setIsExpenseModalOpen(false);
    refreshData();
  };

  const handleConfirmDeleteExpense = () => {
    if (deleteExpenseId) {
      dataService.deleteExpense(deleteExpenseId, adminUser?.name || 'Super Admin');
      setDeleteExpenseId(null);
      refreshData();
    }
  };

  // Donation Handlers
  const handleOpenAddDonation = () => {
    setEditingDonation(null);
    setDonationCenterId(centers.length > 0 ? centers[0].id : '');
    setDonorName('');
    setDonationAmount('');
    setDonationDate(new Date().toISOString().split('T')[0]);
    setDonationRemarks('');
    setIsDonationModalOpen(true);
  };

  const handleOpenEditDonation = (d: Donation) => {
    setEditingDonation(d);
    setDonationCenterId(d.centerId);
    setDonorName(d.donorName || '');
    setDonationAmount(d.amount);
    setDonationDate(d.date);
    setDonationRemarks(d.remarks || '');
    setIsDonationModalOpen(true);
  };

  const handleSaveDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationAmount || Number(donationAmount) <= 0 || !donationCenterId) return;

    if (editingDonation) {
      dataService.updateDonation(
        editingDonation.id,
        {
          centerId: donationCenterId,
          donorName: donorName || 'Well-wisher (Anonymous)',
          amount: Number(donationAmount),
          date: donationDate,
          remarks: donationRemarks,
        },
        adminUser?.name || 'Super Admin'
      );
    } else {
      dataService.addDonation({
        centerId: donationCenterId,
        donorName: donorName || 'Well-wisher (Anonymous)',
        amount: Number(donationAmount),
        date: donationDate,
        remarks: donationRemarks,
        recordedBy: adminUser?.name || 'Super Admin',
      });
    }

    setIsDonationModalOpen(false);
    refreshData();
  };

  const handleConfirmDeleteDonation = () => {
    if (deleteDonationId) {
      dataService.deleteDonation(deleteDonationId, adminUser?.name || 'Super Admin');
      setDeleteDonationId(null);
      refreshData();
    }
  };

  const handleDownloadPdf = () => {
    const centerObj = centers.find((c) => c.id === selectedCenter);
    const centerName = centerObj ? centerObj.name : 'Statewide (All Centres)';
    const period = filterMode === 'month' ? selectedMonth : selectedDate;

    const rows: (string | number)[][] = [];
    rows.push(['Income: Fee Collection', `${feePayments.length} student payments`, formatCurrency(totalFeeIncome)]);
    rows.push(['Income: Donations', `${donations.length} donation records`, formatCurrency(totalDonationIncome)]);
    rows.push(['Total Income', '', formatCurrency(totalIncome)]);
    rows.push(['Expense: Weekly Class Expenses', 'Faculty TA & Refreshments', formatCurrency(totalWeeklyExpense)]);
    rows.push(['Expense: Other Operational', 'Printing & Misc', formatCurrency(totalOtherExpense)]);
    rows.push(['Total Expenses', '', formatCurrency(totalExpenses)]);
    rows.push(['NET BALANCE', '', formatCurrency(netBalance)]);

    generatePdfReport({
      title: 'Statewide Financial Overview Report',
      centerName,
      period,
      summaryItems: [
        { label: 'Total Income', value: formatCurrency(totalIncome) },
        { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
        { label: 'Net Balance', value: formatCurrency(netBalance) },
      ],
      columns: ['Category / Head', 'Details', 'Amount (INR)'],
      rows,
      fileName: `financial_overview_${period}`,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Financial Overview
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive accounts, fee collections, donations, and class expenditures
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddExpense}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Record Expense
            </button>
            <button
              type="button"
              onClick={handleOpenAddDonation}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Record Donation
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <Building className="w-4 h-4 text-cre-navy" />
            <span className="text-slate-400 font-medium">Filter by Centre:</span>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All CRE Centres (Statewide)</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs font-semibold text-slate-800">
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
                className="bg-transparent text-slate-800 focus:outline-hidden cursor-pointer w-full"
              />
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-hidden cursor-pointer w-full"
              />
            )}
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Fee Income
            </span>
            <div className="mt-2 text-2xl font-black text-cre-green">
              {formatCurrency(totalFeeIncome)}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {feePayments.length} recorded fee transactions
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Donations
            </span>
            <div className="mt-2 text-2xl font-black text-cre-navy">
              {formatCurrency(totalDonationIncome)}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {donations.length} donation contributions
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Operational Expenses
            </span>
            <div className="mt-2 text-2xl font-black text-slate-800">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Weekly: {formatCurrency(totalWeeklyExpense)} | Other: {formatCurrency(totalOtherExpense)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Balance
            </span>
            <div
              className={`mt-2 text-2xl font-black ${
                netBalance >= 0 ? 'text-cre-navy' : 'text-red-600'
              }`}
            >
              {formatCurrency(netBalance)}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Total Income: {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        {/* Breakdown Sections: Income vs Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Column */}
          <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                Income Records ({filterMode === 'month' ? selectedMonth : selectedDate})
              </h3>
              <span className="text-xs font-bold text-cre-green">
                Total: {formatCurrency(totalIncome)}
              </span>
            </div>

            <div className="divide-y divide-cre-border max-h-96 overflow-y-auto">
              {feePayments.map((p) => {
                const st = dataService.getStudentById(p.studentId);
                const c = dataService.getCenterById(p.centerId);
                return (
                  <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{st?.name || 'Student'}</span>
                      <span className="text-[10px] text-slate-400">
                        {c?.name} • Paid: {p.paymentDate} • {p.remarks || 'Monthly Fee'}
                      </span>
                    </div>
                    <span className="font-bold text-cre-green">+{formatCurrency(p.amount)}</span>
                  </div>
                );
              })}

              {donations.map((d) => {
                const c = dataService.getCenterById(d.centerId);
                return (
                  <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs bg-amber-50/30">
                    <div>
                      <span className="font-bold text-cre-navy block">
                        Donation: {d.donorName || 'Anonymous Well-wisher'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c?.name} • Date: {d.date} • {d.remarks || 'General Donation'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-cre-navy">+{formatCurrency(d.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditDonation(d)}
                        className="p-1 text-slate-400 hover:text-cre-navy hover:bg-slate-100 rounded-sm"
                        title="Edit Donation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteDonationId(d.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm"
                        title="Delete Donation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {feePayments.length === 0 && donations.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No income transactions found for {filterMode === 'month' ? selectedMonth : selectedDate}.
                </div>
              )}
            </div>
          </div>

          {/* Expense Column */}
          <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                Expense Records ({filterMode === 'month' ? selectedMonth : selectedDate})
              </h3>
              <span className="text-xs font-bold text-red-600">
                Total: {formatCurrency(totalExpenses)}
              </span>
            </div>

            <div className="divide-y divide-cre-border max-h-96 overflow-y-auto">
              {expenses.map((e) => {
                const c = dataService.getCenterById(e.centerId);
                return (
                  <div key={e.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {e.category} {e.title ? `– ${e.title}` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c?.name} • Date: {e.date} • {e.description || e.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-700">-{formatCurrency(e.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditExpense(e)}
                        className="p-1 text-slate-400 hover:text-cre-navy hover:bg-slate-100 rounded-sm"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteExpenseId(e.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {expenses.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No expense records found for {filterMode === 'month' ? selectedMonth : selectedDate}.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ADD / EDIT EXPENSE MODAL */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <h3 className="text-sm font-bold text-cre-navy">
                  {editingExpense ? 'Edit Expense Record' : 'Record Operational Expense'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select CRE Centre *
                  </label>
                  <select
                    required
                    value={expenseCenterId}
                    onChange={(e) => setExpenseCenterId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                  >
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
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
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      placeholder="e.g. Office Stationery, Whiteboard"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
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
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(Number(e.target.value))}
                      placeholder="250"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-bold text-red-600 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Details / Bill Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
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

        {/* ADD / EDIT DONATION MODAL */}
        {isDonationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <h3 className="text-sm font-bold text-cre-navy">
                  {editingDonation ? 'Edit Donation Record' : 'Record Voluntary Donation'}
                </h3>
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
                    Select CRE Centre *
                  </label>
                  <select
                    required
                    value={donationCenterId}
                    onChange={(e) => setDonationCenterId(e.target.value)}
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
          message="Are you sure you want to delete this expense record? This action will permanently remove it from the financial ledger."
          confirmText="Delete Expense"
          isDanger={true}
          onConfirm={handleConfirmDeleteExpense}
          onCancel={() => setDeleteExpenseId(null)}
        />

        {/* Confirm Delete Donation Modal */}
        <ConfirmModal
          isOpen={!!deleteDonationId}
          title="Delete Donation Record"
          message="Are you sure you want to delete this donation record? This will deduct the contribution from accounts."
          confirmText="Delete Donation"
          isDanger={true}
          onConfirm={handleConfirmDeleteDonation}
          onCancel={() => setDeleteDonationId(null)}
        />
      </div>
    </AppShell>
  );
}
