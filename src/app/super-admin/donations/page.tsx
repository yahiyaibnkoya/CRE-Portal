'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { Donation } from '@/types';
import { formatCurrency } from '@/lib/constants';
import {
  HeartHandshake,
  Plus,
  Search,
  Filter,
  Calendar,
  Building,
  CheckCircle,
  X,
  IndianRupee,
} from 'lucide-react';

export default function SuperAdminDonationsPage() {
  const { adminUser, refreshData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetCenterId, setTargetCenterId] = useState('');
  const [remarks, setRemarks] = useState('');

  const centers = dataService.getCenters();
  const allDonations = dataService.getDonations();

  const filteredDonations = allDonations.filter((d) => {
    if (centerFilter !== 'ALL' && d.centerId !== centerFilter) return false;
    if (selectedMonth && !d.date.startsWith(selectedMonth)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDonor = (d.donorName || '').toLowerCase().includes(q);
      const matchRemarks = (d.remarks || '').toLowerCase().includes(q);
      return matchDonor || matchRemarks;
    }
    return true;
  });

  const totalDonationAmount = filteredDonations.reduce((acc, d) => acc + (d.amount || 0), 0);

  const handleOpenAdd = () => {
    setDonorName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setTargetCenterId(centers.length > 0 ? centers[0].id : '');
    setRemarks('');
    setIsModalOpen(true);
  };

  const handleSaveDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !targetCenterId) return;

    dataService.addDonation({
      centerId: targetCenterId,
      donorName: donorName || 'Well-wisher (Anonymous)',
      amount: Number(amount),
      date,
      remarks,
      recordedBy: adminUser?.name || 'Super Admin',
    });

    setIsModalOpen(false);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Donations Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record and track voluntary financial contributions for CRE programmes
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record New Donation
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="bg-white p-5 rounded-2xl border border-cre-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Filtered Contributions
            </span>
            <div className="text-2xl font-black text-cre-green mt-1">
              {formatCurrency(totalDonationAmount)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {filteredDonations.length} total contributions recorded
            </p>
          </div>
          <div className="p-3 bg-cre-green-light text-cre-green rounded-2xl">
            <HeartHandshake className="w-7 h-7" />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search donor or remarks..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-cre-border rounded-xl bg-white focus:ring-2 focus:ring-cre-green focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <Building className="w-4 h-4 text-slate-400" />
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
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              placeholder="All Months"
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Donor Name</th>
                  <th className="py-3.5 px-4">Centre</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {filteredDonations.map((d) => {
                  const center = dataService.getCenterById(d.centerId);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600">{d.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{d.donorName || 'Well-wisher'}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700">
                          {center?.name || d.centerId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-cre-navy">
                        {formatCurrency(d.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                        {d.remarks || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-[10px] text-slate-400">
                        {d.recordedBy}
                      </td>
                    </tr>
                  );
                })}

                {filteredDonations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No donation entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD DONATION MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cre-green-light text-cre-green">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-cre-navy">Record Donation</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                    value={targetCenterId}
                    onChange={(e) => setTargetCenterId(e.target.value)}
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
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="1000"
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-bold text-cre-green focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remarks / Purpose
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Sponsoring study materials, Ramadan donation"
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

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
                    Save Donation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
