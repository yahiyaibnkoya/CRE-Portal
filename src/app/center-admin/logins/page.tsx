'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { AdminUser } from '@/types';
import { normalizePhoneNumber, getDefaultPassword } from '@/lib/constants';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  KeyRound,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  X,
  Phone,
  Trash2,
  Lock,
  Edit2,
  MapPin,
} from 'lucide-react';

export default function CenterAdminLoginsPage() {
  const { activeCenter, refreshData } = useAuth();
  const centerId = activeCenter?.id || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const allUsers = dataService.getUsers();
  // Admins who have access to this centre
  const centerAdmins = allUsers.filter((u) => u.centerIds.includes(centerId));
  const activeAdminsCount = centerAdmins.filter((u) => u.isActive).length;
  const canDeleteAdmin = activeAdminsCount > 1;

  const handleOpenAdd = () => {
    if (activeAdminsCount >= 3) {
      setError('Each centre can have a maximum of THREE administrator login numbers.');
      return;
    }
    setEditingAdmin(null);
    setName('');
    setPhone('');
    setPlace('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingAdmin(user);
    setName(user.name);
    setPhone(user.phone);
    setPlace(user.place || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = normalizePhoneNumber(phone);
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (!editingAdmin && activeAdminsCount >= 3) {
      setError('Maximum 3 active administrator logins allowed for this centre.');
      return;
    }

    const defaultPwd = getDefaultPassword(cleanPhone);

    if (editingAdmin) {
      const updated: AdminUser = {
        ...editingAdmin,
        name,
        phone: cleanPhone,
        place: place.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      dataService.saveUser(updated);
      setIsModalOpen(false);
      setSuccess(`Administrator "${name}" updated successfully.`);
    } else {
      const newAdmin: AdminUser = {
        uid: 'admin-' + Date.now().toString(36),
        phone: cleanPhone,
        name,
        place: place.trim() || undefined,
        role: 'CENTER_ADMIN',
        centerIds: [centerId],
        mustChangePassword: true, // First login password change compulsory
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dataService.saveUser(newAdmin);
      setIsModalOpen(false);
      setSuccess(
        `Administrator added successfully. Default 4-digit PIN: ${defaultPwd} (Compulsory change required on first login)`
      );
    }

    setTimeout(() => setSuccess(null), 5000);
    refreshData();
  };

  const handleToggleActive = (user: AdminUser) => {
    const updated = { ...user, isActive: !user.isActive };
    dataService.saveUser(updated);
    refreshData();
  };

  const handleRemove = (user: AdminUser) => {
    if (!canDeleteAdmin) {
      setError('A centre must have at least one active administrator. You cannot delete the sole administrator; you can edit their details instead.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    setAdminToRemove(user);
  };

  const handleConfirmRemove = () => {
    if (!adminToRemove) return;
    const updatedCenters = adminToRemove.centerIds.filter((id) => id !== centerId);
    dataService.saveUser({ ...adminToRemove, centerIds: updatedCenters });
    setAdminToRemove(null);
    setSuccess(`Administrator removed from this centre.`);
    setTimeout(() => setSuccess(null), 4000);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Centre Login Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized administrator phone numbers for {activeCenter?.name}
            </p>
          </div>

          <button
            type="button"
            disabled={activeAdminsCount >= 3}
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Administrator ({activeAdminsCount}/3)
          </button>
        </div>

        {/* 3-Admin Rule Notice */}
        <div className="bg-cre-navy-light/40 border border-cre-navy/15 p-4 rounded-2xl flex items-start space-x-3 text-xs text-slate-700">
          <ShieldCheck className="w-5 h-5 text-cre-navy shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-cre-navy">Administrator Quota Policy</p>
            <p className="text-[11px] leading-relaxed">
              Each CRE centre is permitted a maximum of <span className="font-bold text-cre-navy">THREE</span> administrator logins. Newly created accounts automatically receive an initial password equal to the <span className="font-semibold text-cre-green">first 8 digits</span> of their registered mobile number, with mandatory password change upon first login.
            </p>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-cre-green-light border border-cre-green/30 rounded-2xl flex items-center space-x-2 text-xs text-cre-green font-bold shadow-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2 text-xs text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table of Centre Admins */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Administrator Name</th>
                  <th className="py-3.5 px-4">Registered Login Phone</th>
                  <th className="py-3.5 px-4">Password Status</th>
                  <th className="py-3.5 px-4">Login Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {centerAdmins.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cre-navy">{u.phone}</td>
                    <td className="py-3.5 px-4">
                      {u.mustChangePassword ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Default Password (Pending Change)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cre-green-light text-cre-green border border-cre-green/30">
                          Custom Password Set
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-cre-navy hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Administrator"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {canDeleteAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRemove(u)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Administrator from Centre"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {centerAdmins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No administrators assigned to this centre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT ADMIN MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <h3 className="text-sm font-bold text-cre-navy">
                  {editingAdmin ? 'Edit Centre Administrator' : 'Add Centre Administrator'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shameem K."
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Place / Town
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="e.g. Manjeri, Malappuram"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (Login Username) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9847123456"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Default 4-digit PIN: <span className="font-semibold text-cre-green">{phone ? getDefaultPassword(phone) : 'Last 4 digits'}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-cre-border flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover rounded-xl shadow-xs"
                  >
                    {editingAdmin ? 'Update Administrator' : 'Create Administrator'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Remove Admin Modal */}
        <ConfirmModal
          isOpen={!!adminToRemove}
          title="Remove Administrator"
          message={`Are you sure you want to remove administrator "${adminToRemove?.name}" (${adminToRemove?.phone}) from this centre? They will no longer have access to this centre.`}
          confirmText="Remove Administrator"
          isDanger={true}
          onConfirm={handleConfirmRemove}
          onCancel={() => setAdminToRemove(null)}
        />
      </div>
    </AppShell>
  );
}
