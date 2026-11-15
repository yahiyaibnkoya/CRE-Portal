'use client';

import React, { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { formatCurrency } from '@/lib/constants';
import { IndianRupee, Clock, History, CheckCircle, AlertCircle } from 'lucide-react';

export default function StudentFeesPage() {
  const { selectedStudent, activeCenter } = useAuth();
  const studentId = selectedStudent?.id || '';
  const centerId = selectedStudent?.centerId || '';

  const monthlyFees = useMemo(() => {
    if (!studentId || !centerId) return [];
    const all = dataService.getMonthlyFees(centerId);
    return all.filter((f) => f.studentId === studentId);
  }, [studentId, centerId]);

  const paymentHistory = useMemo(() => {
    if (!studentId || !centerId) return [];
    const payments = dataService.getFeePayments(centerId);
    return payments.filter((p) => p.studentId === studentId);
  }, [studentId, centerId]);

  const totalPaidAllTime = paymentHistory.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalOutstanding = monthlyFees.reduce((acc, f) => acc + (f.outstandingAmount || 0), 0);
  const totalAdvance = monthlyFees.reduce((acc, f) => acc + (f.advanceCredit || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Monthly Fee Details
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official fee statements and payment receipt ledger for {selectedStudent?.name}
          </p>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Default Monthly Fee
            </span>
            <div className="mt-2 text-2xl font-black text-cre-navy">
              {formatCurrency(selectedStudent?.defaultFee || 100)}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Per Month</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Amount Paid
            </span>
            <div className="mt-2 text-2xl font-black text-cre-green">
              {formatCurrency(totalPaidAllTime)}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">{paymentHistory.length} Payments Recorded</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Outstanding Dues
            </span>
            <div className="mt-2 text-2xl font-black text-red-600">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Pending Clearance</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Advance Credit
            </span>
            <div className="mt-2 text-2xl font-black text-amber-600">
              {formatCurrency(totalAdvance)}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Credited Forward</p>
          </div>
        </div>

        {/* Month-wise Statement Table */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
              Month-wise Fee Statement
            </h3>
            <span className="text-[10px] text-slate-400">Read-Only Statement</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4">Expected Fee</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Advance Credit</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {monthlyFees.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{rec.month}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{formatCurrency(rec.expectedFee)}</td>
                    <td className="py-3.5 px-4 font-bold text-cre-green">{formatCurrency(rec.paidAmount)}</td>
                    <td className="py-3.5 px-4 font-bold text-red-600">{formatCurrency(rec.outstandingAmount)}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">
                      {rec.advanceCredit > 0 ? `+${formatCurrency(rec.advanceCredit)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Paid'
                            ? 'bg-cre-green-light text-cre-green border border-cre-green/30'
                            : rec.status === 'Advance / Excess'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : rec.status === 'Partially Paid'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {monthlyFees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No monthly billing records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Payment Transaction History */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
              Payment Receipts History
            </h3>
            <span className="text-[10px] text-slate-500">
              {paymentHistory.length} Receipts
            </span>
          </div>

          <div className="divide-y divide-cre-border">
            {paymentHistory.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900 block">
                    Payment for {p.month}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Received on: {p.paymentDate} • {p.remarks || 'Cash Payment'} • Recorded by: {p.recordedBy}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-cre-green text-sm block">
                    +{formatCurrency(p.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                </div>
              </div>
            ))}

            {paymentHistory.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No payment transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
