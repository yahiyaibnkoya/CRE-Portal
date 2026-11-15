'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { dataService } from '@/lib/dataService';
import { formatCurrency } from '@/lib/constants';
import { generatePdfReport } from '@/lib/reportUtils';
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
} from 'lucide-react';

export default function SuperAdminFinancePage() {
  const [selectedCenter, setSelectedCenter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  const centers = dataService.getCenters();

  const summary = useMemo(() => {
    return dataService.getFinancialSummary(
      selectedCenter === 'ALL' ? undefined : selectedCenter,
      selectedMonth
    );
  }, [selectedCenter, selectedMonth]);

  const feePayments = useMemo(() => {
    return dataService.getFeePayments(
      selectedCenter === 'ALL' ? undefined : selectedCenter,
      selectedMonth
    );
  }, [selectedCenter, selectedMonth]);

  const donations = useMemo(() => {
    return dataService.getDonations(
      selectedCenter === 'ALL' ? undefined : selectedCenter,
      selectedMonth
    );
  }, [selectedCenter, selectedMonth]);

  const expenses = useMemo(() => {
    return dataService.getExpenses(
      selectedCenter === 'ALL' ? undefined : selectedCenter,
      selectedMonth
    );
  }, [selectedCenter, selectedMonth]);

  const handleDownloadPdf = () => {
    const centerObj = centers.find((c) => c.id === selectedCenter);
    const centerName = centerObj ? centerObj.name : 'Statewide (All Centres)';

    const rows: (string | number)[][] = [];

    // Add Fee Income summary row
    rows.push(['Income: Fee Collection', `${feePayments.length} student payments`, formatCurrency(summary.totalFeeIncome)]);
    rows.push(['Income: Donations', `${donations.length} donation records`, formatCurrency(summary.totalDonationIncome)]);
    rows.push(['Total Income', '', formatCurrency(summary.totalIncome)]);
    rows.push(['Expense: Weekly Class Expenses', 'Faculty TA & Refreshments', formatCurrency(summary.totalWeeklyExpense)]);
    rows.push(['Expense: Other Operational', 'Printing & Misc', formatCurrency(summary.totalOtherExpense)]);
    rows.push(['Total Expenses', '', formatCurrency(summary.totalExpenses)]);
    rows.push(['NET BALANCE', '', formatCurrency(summary.netBalance)]);

    generatePdfReport({
      title: 'Statewide Financial Overview Report',
      centerName,
      period: selectedMonth,
      summaryItems: [
        { label: 'Total Income', value: formatCurrency(summary.totalIncome) },
        { label: 'Total Expenses', value: formatCurrency(summary.totalExpenses) },
        { label: 'Net Balance', value: formatCurrency(summary.netBalance) },
      ],
      columns: ['Category / Head', 'Details', 'Amount (INR)'],
      rows,
      fileName: `financial_overview_${selectedMonth}`,
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

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover transition-all shadow-md shadow-cre-navy/20"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download Financial PDF
          </button>
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
            <Calendar className="w-4 h-4 text-cre-navy" />
            <span className="text-slate-400 font-medium">Reporting Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-hidden cursor-pointer w-full"
            />
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Fee Income
            </span>
            <div className="mt-2 text-2xl font-black text-cre-green">
              {formatCurrency(summary.totalFeeIncome)}
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
              {formatCurrency(summary.totalDonationIncome)}
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
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Weekly: {formatCurrency(summary.totalWeeklyExpense)} | Other: {formatCurrency(summary.totalOtherExpense)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Balance
            </span>
            <div
              className={`mt-2 text-2xl font-black ${
                summary.netBalance >= 0 ? 'text-cre-navy' : 'text-red-600'
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Total Income: {formatCurrency(summary.totalIncome)}
            </p>
          </div>
        </div>

        {/* Breakdown Sections: Income vs Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Column */}
          <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                Income Records ({selectedMonth})
              </h3>
              <span className="text-xs font-bold text-cre-green">
                Total: {formatCurrency(summary.totalIncome)}
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
                    <span className="font-bold text-cre-navy">+{formatCurrency(d.amount)}</span>
                  </div>
                );
              })}

              {feePayments.length === 0 && donations.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No income transactions found for {selectedMonth}.
                </div>
              )}
            </div>
          </div>

          {/* Expense Column */}
          <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                Expense Records ({selectedMonth})
              </h3>
              <span className="text-xs font-bold text-red-600">
                Total: {formatCurrency(summary.totalExpenses)}
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
                    <span className="font-bold text-slate-700">-{formatCurrency(e.amount)}</span>
                  </div>
                );
              })}

              {expenses.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No expense records found for {selectedMonth}.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
