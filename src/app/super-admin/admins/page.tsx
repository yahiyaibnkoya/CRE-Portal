'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { AdminUser, Center } from '@/types';
import { normalizePhoneNumber, getDefaultPassword } from '@/lib/constants';
import {
  ShieldCheck,
  UserPlus,
  Search,
  KeyRound,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Phone,
  MapPin,
} from 'lucide-react';

export default function SuperAdminAdminsPage() {
  const { adminUser: currentSuperAdmin, refreshData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'CENTER_ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [isActiveAdmin, setIsActiveAdmin] = useState(true);
  const [selectedCenterIds, setSelectedCenterIds] = useState<string[]>([]);
  const [role, setRole] = useState<'CENTER_ADMIN' | 'SUPER_ADMIN'>('CENTER_ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const centers = dataService.getCenters();
  const users = dataService.getUsers();

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (statusFilter === 'ACTIVE' && !u.isActive) return false;
    if (statusFilter === 'INACTIVE' && u.isActive) return false;
    if (centerFilter !== 'ALL') {
      if (!u.centerIds.includes(centerFilter)) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchPhone = u.phone.includes(q);
      const matchPlace = (u.place || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchPlace;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setName('');
    setPhone('');
    setPlace('');
    setIsActiveAdmin(true);
    setSelectedCenterIds(centers.length > 0 ? [centers[0].id] : []);
    setRole('CENTER_ADMIN');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingAdmin(user);
    setName(user.name);
    setPhone(user.phone);
    setPlace(user.place || '');
    setIsActiveAdmin(user.isActive);
    setSelectedCenterIds(user.centerIds);
    setRole(user.role);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPhone = normalizePhoneNumber(phone);

    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    // Check 3 administrator limit per centre
    if (role === 'CENTER_ADMIN') {
      for (const cId of selectedCenterIds) {
        const center = dataService.getCenterById(cId);
        const existingAdminsForCenter = users.filter(
          (u) => u.isActive && u.centerIds.includes(cId) && u.uid !== editingAdmin?.uid
        );
        if (existingAdminsForCenter.length >= 3) {
          setError(`Centre "${center?.name || cId}" already has the maximum of 3 active administrators.`);
          return;
        }
      }
    }

    const defaultPwd = getDefaultPassword(cleanPhone);

    const updatedUser: AdminUser = {
      uid: editingAdmin ? editingAdmin.uid : 'admin-' + Date.now().toString(36),
      phone: cleanPhone,
      name,
      place: place.trim() || undefined,
      role,
      centerIds: selectedCenterIds,
      mustChangePassword: editingAdmin ? editingAdmin.mustChangePassword : true,
      isActive: isActiveAdmin,
      createdAt: editingAdmin ? editingAdmin.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dataService.saveUser(updatedUser);
    setIsModalOpen(false);
    setSuccessMsg(
      editingAdmin
        ? `Administrator "${name}" updated successfully.`
        : `Administrator created. Initial password: ${defaultPwd} (Compulsory change required on first login)`
    );
    setTimeout(() => setSuccessMsg(null), 5000);
    refreshData();
  };

  const handleToggleActive = (user: AdminUser) => {
    const updated = { ...user, isActive: !user.isActive };
    dataService.saveUser(updated);
    refreshData();
  };

  const handleConfirmResetPassword = () => {
    if (!resettingUser) return;
    dataService.resetUserPassword(resettingUser.phone, currentSuperAdmin?.name || 'Super Admin');
    setSuccessMsg(
      `Password for ${resettingUser.phone} reset to default (${getDefaultPassword(
        resettingUser.phone
      )}). First login password change enforced.`
    );
    setResettingUser(null);
    setTimeout(() => setSuccessMsg(null), 6000);
    refreshData();
  };

  const handleConfirmDelete = () => {
    if (!deletingAdmin) return;
    if (deletingAdmin.role === 'SUPER_ADMIN') {
      const allSuperAdmins = users.filter((u) => u.role === 'SUPER_ADMIN');
      if (allSuperAdmins.length <= 1) {
        setError('The primary Super Admin account cannot be deleted unless another Super Admin is added first.');
        setDeletingAdmin(null);
        return;
      }
    }
    if (deletingAdmin.phone === currentSuperAdmin?.phone) {
      const allSuperAdmins = users.filter((u) => u.role === 'SUPER_ADMIN');
      if (allSuperAdmins.length <= 1) {
        setError('You cannot delete your own account when you are the sole Super Admin.');
        setDeletingAdmin(null);
        return;
      }
    }

    const res = dataService.deleteUser(deletingAdmin.uid);
    if (res.success) {
      setSuccessMsg(`Administrator "${deletingAdmin.name}" (${deletingAdmin.phone}) deleted successfully.`);
      setDeletingAdmin(null);
      setTimeout(() => setSuccessMsg(null), 5000);
      refreshData();
    } else {
      setError(res.error || 'Failed to delete administrator account.');
      setDeletingAdmin(null);
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-cre-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
              Centre Administrators
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage authorized administrator logins and password credentials
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover transition-all shadow-md shadow-cre-green/20"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Administrator
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-cre-green-light border border-cre-green/30 rounded-2xl flex items-center space-x-3 text-xs text-cre-green font-bold shadow-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dynamic Exciting Filter Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => {
              setRoleFilter('ALL');
              setStatusFilter('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              roleFilter === 'ALL' && statusFilter === 'ALL'
                ? 'bg-cre-navy text-white border-cre-navy shadow-md scale-[1.02]'
                : 'bg-white text-slate-800 border-cre-border hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${roleFilter === 'ALL' && statusFilter === 'ALL' ? 'text-white/80' : 'text-slate-400'}`}>
                All Administrators
              </span>
              <ShieldCheck className={`w-4 h-4 ${roleFilter === 'ALL' && statusFilter === 'ALL' ? 'text-white' : 'text-cre-navy'}`} />
            </div>
            <div className="text-2xl font-black mt-2">{users.length}</div>
            <span className={`text-[10px] mt-0.5 block ${roleFilter === 'ALL' && statusFilter === 'ALL' ? 'text-white/70' : 'text-slate-400'}`}>
              Full administrative user list
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleFilter(roleFilter === 'SUPER_ADMIN' ? 'ALL' : 'SUPER_ADMIN');
              setStatusFilter('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              roleFilter === 'SUPER_ADMIN'
                ? 'bg-cre-navy text-white border-cre-navy shadow-md scale-[1.02]'
                : 'bg-white text-slate-800 border-cre-border hover:border-cre-navy/40 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${roleFilter === 'SUPER_ADMIN' ? 'text-white/80' : 'text-cre-navy'}`}>
                Super Admins
              </span>
              <ShieldCheck className={`w-4 h-4 ${roleFilter === 'SUPER_ADMIN' ? 'text-white' : 'text-cre-navy'}`} />
            </div>
            <div className={`text-2xl font-black mt-2 ${roleFilter === 'SUPER_ADMIN' ? 'text-white' : 'text-cre-navy'}`}>
              {users.filter((u) => u.role === 'SUPER_ADMIN').length}
            </div>
            <span className={`text-[10px] mt-0.5 block ${roleFilter === 'SUPER_ADMIN' ? 'text-white/70' : 'text-slate-400'}`}>
              Statewide administrative access
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleFilter(roleFilter === 'CENTER_ADMIN' ? 'ALL' : 'CENTER_ADMIN');
              setStatusFilter('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              roleFilter === 'CENTER_ADMIN'
                ? 'bg-cre-green text-white border-cre-green shadow-md scale-[1.02]'
                : 'bg-white text-slate-800 border-cre-border hover:border-cre-green/40 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${roleFilter === 'CENTER_ADMIN' ? 'text-white/80' : 'text-cre-green'}`}>
                Centre Admins
              </span>
              <Building className={`w-4 h-4 ${roleFilter === 'CENTER_ADMIN' ? 'text-white' : 'text-cre-green'}`} />
            </div>
            <div className={`text-2xl font-black mt-2 ${roleFilter === 'CENTER_ADMIN' ? 'text-white' : 'text-cre-green'}`}>
              {users.filter((u) => u.role === 'CENTER_ADMIN').length}
            </div>
            <span className={`text-[10px] mt-0.5 block ${roleFilter === 'CENTER_ADMIN' ? 'text-white/70' : 'text-slate-400'}`}>
              Local CRE centre managers
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE');
              setRoleFilter('ALL');
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                : 'bg-white text-slate-800 border-cre-border hover:border-emerald-400 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'ACTIVE' ? 'text-white/80' : 'text-emerald-600'}`}>
                Active Accounts
              </span>
              <CheckCircle className={`w-4 h-4 ${statusFilter === 'ACTIVE' ? 'text-white' : 'text-emerald-600'}`} />
            </div>
            <div className={`text-2xl font-black mt-2 ${statusFilter === 'ACTIVE' ? 'text-white' : 'text-emerald-600'}`}>
              {users.filter((u) => u.isActive).length}
            </div>
            <span className={`text-[10px] mt-0.5 block ${statusFilter === 'ACTIVE' ? 'text-white/70' : 'text-slate-400'}`}>
              Currently enabled for login
            </span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search administrator by name, phone, or place..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-cre-border rounded-xl bg-white focus:ring-2 focus:ring-cre-green focus:outline-hidden"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="SUPER_ADMIN">Super Admins ({users.filter((u) => u.role === 'SUPER_ADMIN').length})</option>
              <option value="CENTER_ADMIN">Centre Admins ({users.filter((u) => u.role === 'CENTER_ADMIN').length})</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-cre-border text-xs">
            <span className="text-slate-400 font-medium">Centre:</span>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Centres</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Mobile / Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Assigned Centre(s)</th>
                  <th className="py-3.5 px-4">Password Status</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {filteredUsers.map((u, idx) => {
                  const assignedCenters = centers.filter((c) => u.centerIds.includes(c.id));
                  const isSuperAdmin = u.role === 'SUPER_ADMIN';
                  const allSuperAdmins = users.filter((x) => x.role === 'SUPER_ADMIN');
                  const canDelete = isSuperAdmin ? allSuperAdmins.length > 1 : true;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[10px] text-slate-400">UID: {u.uid}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-cre-navy">
                        {u.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-cre-navy text-white'
                              : 'bg-cre-navy-light text-cre-navy'
                          }`}
                        >
                          {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Centre Admin'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === 'SUPER_ADMIN' ? (
                          <span className="text-[11px] font-semibold text-cre-green">
                            Global Platform Access
                          </span>
                        ) : assignedCenters.length > 0 ? (
                          <div className="space-y-1">
                            {assignedCenters.map((c) => (
                              <span
                                key={c.id}
                                className="inline-block text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium mr-1"
                              >
                                {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-amber-600 text-[10px] italic">No Centre Assigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.mustChangePassword ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Default (Change Pending)
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-cre-green bg-cre-green-light px-2 py-0.5 rounded-full border border-cre-green/30">
                            Custom Password Set
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
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
                            onClick={() => setResettingUser(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Reset to default PIN"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-cre-navy hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Administrator"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeletingAdmin(u)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Administrator"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD / EDIT ADMIN MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cre-border">
              <div className="flex items-center justify-between pb-3 border-b border-cre-border">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cre-green-light text-cre-green">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-cre-navy">
                    {editingAdmin ? 'Edit Administrator' : 'Create Administrator Account'}
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

              {error && (
                <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveAdmin} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Farooq K."
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
                    Registered Mobile Number (Username) *
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
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border border-cre-border rounded-xl focus:ring-2 focus:ring-cre-green focus:outline-hidden"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Default 4-digit PIN: <span className="font-semibold text-cre-green">{phone ? getDefaultPassword(phone) : 'Last 4 digits'}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'CENTER_ADMIN' | 'SUPER_ADMIN')}
                    className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                  >
                    <option value="CENTER_ADMIN">Centre Administrator (Max 3 per centre)</option>
                    <option value="SUPER_ADMIN">Super Administrator (Global)</option>
                  </select>
                </div>

                {editingAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Status
                    </label>
                    <select
                      value={isActiveAdmin ? 'active' : 'suspended'}
                      onChange={(e) => setIsActiveAdmin(e.target.value === 'active')}
                      className="w-full px-3.5 py-2 text-xs border border-cre-border rounded-xl font-semibold"
                    >
                      <option value="active">Active (Access Allowed)</option>
                      <option value="suspended">Suspended (Access Blocked)</option>
                    </select>
                  </div>
                )}

                {role === 'CENTER_ADMIN' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned CRE Centre(s)
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-cre-border rounded-xl">
                      {centers.map((c) => (
                        <label key={c.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCenterIds.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCenterIds([...selectedCenterIds, c.id]);
                              } else {
                                setSelectedCenterIds(selectedCenterIds.filter((id) => id !== c.id));
                              }
                            }}
                            className="rounded-sm text-cre-green focus:ring-cre-green"
                          />
                          <span className="font-medium">{c.name}</span>
                        </label>
                      ))}
                    </div>
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
                    {editingAdmin ? 'Update Administrator' : 'Save Administrator'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PASSWORD RESET CONFIRMATION MODAL */}
        {resettingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-cre-border text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-cre-navy">
                Reset Administrator Password
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Reset PIN for <span className="font-bold text-cre-navy">{resettingUser.name}</span> ({resettingUser.phone}) to the default last 4 digits ({getDefaultPassword(resettingUser.phone)})?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl my-4 text-[11px] text-slate-500">
                This administrator will be required to create a new password immediately upon their next login.
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPassword}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE ADMINISTRATOR CONFIRMATION MODAL */}
        {deletingAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-cre-border text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-cre-navy">
                Delete Administrator?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to permanently delete administrator account <span className="font-bold text-cre-navy">{deletingAdmin.name}</span> (<span className="font-mono font-semibold">{deletingAdmin.phone}</span>)?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl my-4 text-[11px] text-red-700 text-left">
                This will revoke their login access and dissociate their mobile number from any assigned CRE centres.
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setDeletingAdmin(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
