'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/lib/dataService';
import { DonatedContact, ContactStatus } from '@/types';
import {
  UserPlus,
  Search,
  Filter,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function SuperAdminContactsPage() {
  const { adminUser, refreshData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Status Change or Delete modal
  const [deletingContact, setDeletingContact] = useState<DonatedContact | null>(null);

  const centers = dataService.getCenters();
  const allContacts = dataService.getDonatedContacts();

  const filteredContacts = allContacts.filter((c) => {
    if (centerFilter !== 'ALL' && c.centerId !== centerFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone.includes(q);
      const matchPlace = c.place.toLowerCase().includes(q);
      return matchName || matchPhone || matchPlace;
    }
    return true;
  });

  const handleUpdateStatus = (contactId: string, newStatus: ContactStatus) => {
    dataService.updateDonatedContactStatus(contactId, newStatus, adminUser?.name || 'Super Admin');
    refreshData();
  };

  const handleDeleteConfirm = () => {
    if (!deletingContact) return;
    dataService.deleteDonatedContact(deletingContact.id, adminUser?.name || 'Super Admin');
    setDeletingContact(null);
    refreshData();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-cre-border">
          <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
            Donated Contacts (Admission Leads)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admission recommendation referrals submitted by students and parents
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, mobile, place..."
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
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer w-full"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Registered">Registered</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-cre-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-cre-border text-[11px] font-bold text-cre-navy uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Candidate Name</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Place / Location</th>
                  <th className="py-3.5 px-4">Centre</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cre-border">
                {filteredContacts.map((c) => {
                  const center = dataService.getCenterById(c.centerId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-cre-navy">
                        <a href={`tel:${c.phone}`} className="hover:underline flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-cre-green" />
                          {c.phone}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{c.place}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700">
                          {center?.name || c.centerId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                        {c.remarks || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={c.status}
                          onChange={(e) => handleUpdateStatus(c.id, e.target.value as ContactStatus)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer focus:outline-hidden ${
                            c.status === 'New'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : c.status === 'Contacted'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : c.status === 'Registered'
                              ? 'bg-cre-green-light text-cre-green border-cre-green/30'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Registered">Registered</option>
                          <option value="Not Interested">Not Interested</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeletingContact(c)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Referral"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No donated contact recommendations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        {deletingContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-cre-border text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-cre-navy">Delete Referral Lead</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Delete contact recommendation for <span className="font-bold text-slate-900">{deletingContact.name}</span>?
              </p>

              <div className="mt-5 flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setDeletingContact(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
