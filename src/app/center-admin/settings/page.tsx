'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import {
  Settings,
  Building,
  KeyRound,
  IndianRupee,
  GraduationCap,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function CenterAdminSettingsPage() {
  const { activeCenter, refreshData } = useAuth();
  const centerId = activeCenter?.id || '';

  const [defaultFee, setDefaultFee] = useState<number>(activeCenter?.defaultFee || 100);
  const [examMode, setExamMode] = useState<'semester' | 'non-semester'>(activeCenter?.examMode || 'semester');
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCenter) return;

    dataService.saveCenter({
      ...activeCenter,
      defaultFee: Number(defaultFee),
      examMode,
    });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Centre Settings & Policies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Default monthly tuition fees and examination structure
          </p>
        </div>

        {success && (
          <div className="p-4 bg-cre-green-light border border-cre-green/30 rounded-2xl flex items-center space-x-2 text-xs text-cre-green font-bold shadow-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Centre policies updated successfully.</span>
          </div>
        )}

        {/* Quick Links Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/center-admin/info"
            className="p-5 bg-white rounded-2xl border border-cre-border hover:border-cre-navy transition-all shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cre-navy-light text-cre-navy">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-cre-navy group-hover:underline">
                  Institutional Profile & Schedule
                </h3>
                <p className="text-[11px] text-slate-500">Class timings, zone/unit, and faculty</p>
              </div>
            </div>
          </Link>

          <Link
            href="/center-admin/logins"
            className="p-5 bg-white rounded-2xl border border-cre-border hover:border-cre-navy transition-all shadow-xs flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cre-green-light text-cre-green">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-cre-navy group-hover:underline">
                  Administrator Logins
                </h3>
                <p className="text-[11px] text-slate-500">Manage up to 3 authorized mobile numbers</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-cre-navy mb-4">
              Academic & Fee Defaults
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Monthly Student Fee (₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    required
                    value={defaultFee}
                    onChange={(e) => setDefaultFee(Number(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2 text-xs border border-cre-border rounded-xl font-bold text-cre-green focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatically assigned to newly admitted students. Can be customized per student.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Examination Mode
                </label>
                <select
                  value={examMode}
                  onChange={(e) => setExamMode(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                >
                  <option value="semester">Semester-Wise Examinations</option>
                  <option value="non-semester">Non-Semester Examinations (Portion-Based)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Choose between formal semesters or flexible portion evaluations.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-cre-border flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
            >
              Save Centre Policies
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
