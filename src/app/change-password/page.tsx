'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PinInput } from '@/components/ui/PinInput';
import { ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

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

    if (newPassword.length !== 4) {
      setError('PIN must be exactly a 4-digit number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('PINs do not match. Please re-enter.');
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
        setError(res.error || 'Failed to update PIN. Please try again.');
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
          Set 4-Digit Login PIN
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
              <p className="font-bold text-amber-900">Personalize Your PIN</p>
              <p className="mt-1 leading-relaxed">
                For the security of your CRE Centre data, please set a confidential 4-digit PIN for your mobile number.
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
              <h3 className="text-sm font-bold text-cre-navy">PIN Updated Successfully!</h3>
              <p className="text-xs text-slate-500">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  New 4-Digit PIN
                </label>
                <PinInput
                  value={newPassword}
                  onChange={setNewPassword}
                  autoFocus={true}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Confirm 4-Digit PIN
                </label>
                <PinInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoFocus={false}
                />
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
