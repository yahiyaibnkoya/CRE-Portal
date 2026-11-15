'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { adminUser, completePasswordChange } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await completePasswordChange(newPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          if (adminUser?.role === 'SUPER_ADMIN') {
            router.push('/super-admin');
          } else {
            router.push('/center-admin');
          }
        }, 1200);
      } else {
        setError(res.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cre-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <Image
            src="/cre-logo.png"
            alt="CRE Logo"
            width={140}
            height={50}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-lg sm:text-xl font-black text-cre-navy uppercase tracking-wide">
          Compulsory Password Change
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Wisdom Islamic Students Organization – CRE Management Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-cre-border sm:px-10">
          {/* Security Alert Header */}
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-800">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">First-Time Login Security</p>
              <p className="mt-1 leading-relaxed">
                You are currently using the default initial password. For the security of your CRE Centre data, you must establish a personalized, confidential password before accessing the dashboard.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-xs text-red-700 p-3 rounded-xl">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-cre-green mx-auto animate-bounce" />
              <h3 className="text-sm font-bold text-cre-navy">Password Updated Successfully!</h3>
              <p className="text-xs text-slate-500">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="block w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-cre-green focus:border-cre-green focus:outline-hidden bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="block w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-cre-green focus:border-cre-green focus:outline-hidden bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-xs font-bold text-white bg-cre-green hover:bg-cre-green-hover shadow-md shadow-cre-green/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Set Password & Enter Portal'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
