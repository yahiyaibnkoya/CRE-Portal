'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { PinInput } from '@/components/ui/PinInput';
import {
  Settings,
  ShieldCheck,
  Building2,
  Lock,
  Phone,
  MessageSquare,
  Database,
  Download,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

export default function SuperAdminSettingsPage() {
  const { adminUser, updateCurrentAdminProfile, updateSuperAdminPhoneAndPin, refreshData } = useAuth();
  const currentSettings = dataService.getSettings();

  // Admin Profile Details & Credentials
  const [profileName, setProfileName] = useState(adminUser?.name || 'Super Admin');
  const [profilePhone, setProfilePhone] = useState(adminUser?.phone || '9644889944');
  const [profilePlace, setProfilePlace] = useState(adminUser?.place || 'Calicut');
  const [profilePin, setProfilePin] = useState(adminUser?.passwordPin || '9944');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [approvalMode, setApprovalMode] = useState<'automatic' | 'manual'>(
    currentSettings.newCenterApprovalMode
  );
  const [studentAccess, setStudentAccess] = useState<boolean>(
    currentSettings.studentQuickAccessEnabled
  );
  const [superPhone, setSuperPhone] = useState<string>(currentSettings.superAdminPhone);
  const [whatsappReset, setWhatsappReset] = useState<string>(
    currentSettings.superAdminResetWhatsapp
  );
  const [districts, setDistricts] = useState<string[]>(currentSettings.districts || []);
  const [newDistrict, setNewDistrict] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const auditLogs = dataService.getAuditLogs();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (!profileName.trim()) {
      setProfileError('Please enter administrator full name.');
      return;
    }
    const cleanPhone = profilePhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setProfileError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (profilePin && profilePin.length !== 4) {
      setProfileError('Login PIN must be exactly a 4-digit number.');
      return;
    }

    const success = await updateSuperAdminPhoneAndPin(
      cleanPhone,
      profilePin,
      profileName.trim(),
      profilePlace.trim()
    );
    if (success) {
      setSuperPhone(cleanPhone);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 5000);
    } else {
      setProfileError('Failed to update Super Admin credentials.');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateSettings({
      newCenterApprovalMode: approvalMode,
      studentQuickAccessEnabled: studentAccess,
      superAdminPhone: superPhone,
      superAdminResetWhatsapp: whatsappReset,
      districts,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    refreshData();
  };

  const handleAddDistrict = () => {
    if (!newDistrict.trim()) return;
    if (!districts.includes(newDistrict.trim())) {
      setDistricts([...districts, newDistrict.trim()]);
    }
    setNewDistrict('');
  };

  const handleRemoveDistrict = (d: string) => {
    setDistricts(districts.filter((item) => item !== d));
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            System Settings & Controls
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Super Admin platform configuration, credential security, and state controls
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 bg-cre-green-light border border-cre-green/30 rounded-2xl flex items-center space-x-2 text-xs text-cre-green font-bold shadow-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>System settings updated successfully.</span>
          </div>
        )}

        {/* Super Admin Profile Details & Credentials Card */}
        <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs">
          <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-cre-navy text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cre-navy">Super Admin Details & Login Credentials</h2>
              <p className="text-xs text-slate-500">
                Update your administrator profile, login mobile number, and 4-digit PIN. Changes take effect immediately in the database and for login across all devices.
              </p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mb-4 p-3.5 bg-cre-green-light border border-cre-green/30 rounded-xl flex items-center space-x-2 text-xs text-cre-green font-bold shadow-xs">
              <CheckCircle className="w-4 h-4 shrink-0 text-cre-green" />
              <span>Super Admin profile, phone number ({profilePhone}), and PIN updated successfully in the database.</span>
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700 font-bold shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. State CRE Director"
                  className="w-full px-3.5 py-2 text-xs font-semibold border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Super Admin Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. 9644889944"
                    className="w-full pl-3.5 pr-8 py-2 text-xs font-bold border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden font-mono text-cre-navy"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-cre-green">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used for Super Admin login
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Place *
                </label>
                <input
                  type="text"
                  required
                  value={profilePlace}
                  onChange={(e) => setProfilePlace(e.target.value)}
                  placeholder="e.g. Kozhikode State HQ"
                  className="w-full px-3.5 py-2 text-xs font-semibold border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4-Digit Login PIN *
                </label>
                <div className="bg-slate-50 p-2 rounded-xl border border-cre-border flex items-center justify-center">
                  <PinInput
                    value={profilePin}
                    onChange={(v) => setProfilePin(v)}
                    length={4}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block text-center">
                  4-digit authentication PIN
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-navy hover:bg-cre-navy-hover transition-all shadow-xs inline-flex items-center"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                Save Super Admin Details & PIN
              </button>
            </div>
          </form>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card 1: Centre Approval Policy */}
          <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-xl bg-cre-navy-light text-cre-navy">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-cre-navy">
                  New Centre Approval Mode
                </h3>
                <p className="text-xs text-slate-500">
                  Controls initial activation status when new CRE centres register
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setApprovalMode('automatic')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  approvalMode === 'automatic'
                    ? 'border-cre-green bg-cre-green-light/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Automatic Approval</span>
                  <input
                    type="radio"
                    name="approvalMode"
                    checked={approvalMode === 'automatic'}
                    onChange={() => setApprovalMode('automatic')}
                    className="text-cre-green focus:ring-cre-green"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Newly registered centres immediately become <span className="font-bold text-cre-green">ACTIVE</span> and can start managing students and attendance.
                </p>
              </label>

              <label
                onClick={() => setApprovalMode('manual')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  approvalMode === 'manual'
                    ? 'border-cre-navy bg-cre-navy-light/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Manual Approval Required</span>
                  <input
                    type="radio"
                    name="approvalMode"
                    checked={approvalMode === 'manual'}
                    onChange={() => setApprovalMode('manual')}
                    className="text-cre-navy focus:ring-cre-navy"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Newly added centres remain <span className="font-bold text-amber-600">PENDING</span> until explicitly reviewed and approved by Super Admin.
                </p>
              </label>
            </div>
          </div>

          {/* Card 2: Student Portal Access Control */}
          <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-cre-navy">
                  Student / Parent Quick Access
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allows students and parents to view attendance, fees, and marks with registered phone number
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={studentAccess}
                  onChange={(e) => setStudentAccess(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cre-green"></div>
              </label>
            </div>
          </div>

          {/* Card 3: Contact & Password Reset Phone */}
          <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs">
            <h3 className="text-sm font-bold text-cre-navy mb-4">
              Security & Password Reset Contacts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Super Admin Registered Login Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={superPhone}
                    onChange={(e) => setSuperPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs border border-cre-border rounded-xl font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Password-Reset Destination Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={whatsappReset}
                    onChange={(e) => setWhatsappReset(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs border border-cre-border rounded-xl font-mono font-semibold text-cre-navy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: District Management */}
          <div className="bg-white p-6 rounded-2xl border border-cre-border shadow-xs">
            <h3 className="text-sm font-bold text-cre-navy mb-1">
              Configurable Districts Directory (Kerala)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add or adjust districts available in the centre registration dropdown
            </p>

            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={newDistrict}
                onChange={(e) => setNewDistrict(e.target.value)}
                placeholder="Enter district name"
                className="px-3.5 py-2 text-xs border border-cre-border rounded-xl flex-1 focus:ring-2 focus:ring-cre-green focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddDistrict}
                className="px-4 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {districts.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                >
                  <span>{d}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDistrict(d)}
                    className="ml-2 text-slate-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
            >
              Save System Settings
            </button>
          </div>
        </form>

        {/* Audit Log Card */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-cre-border bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cre-navy" />
              <h3 className="text-xs font-bold text-cre-navy uppercase tracking-wider">
                System Audit Trail (Latest 20 Events)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              {auditLogs.length} total logged events
            </span>
          </div>

          <div className="divide-y divide-cre-border max-h-72 overflow-y-auto text-xs">
            {auditLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">{log.action}</span>
                  <span className="text-[11px] text-slate-500">{log.details}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-600 block">{log.performedBy}</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No audit entries recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
