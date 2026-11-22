import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ShieldCheck, GraduationCap, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cre-bg flex flex-col justify-between font-sans">
      <header className="bg-white border-b border-cre-border py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative h-9 w-28 sm:h-11 sm:w-34">
              <Image
                src="/cre-logo.png"
                alt="CRE Logo"
                width={140}
                height={50}
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block h-6 w-px bg-slate-200"></div>
            <div className="hidden sm:block text-xs font-bold text-cre-navy">
              Wisdom Islamic Students Organization
            </div>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-cre-green hover:text-cre-green-hover flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-cre-navy-light text-cre-navy flex items-center justify-center font-black text-3xl shadow-xs border border-cre-navy/10 mb-6">
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-cre-navy tracking-tight">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed max-w-md">
          The page or portal record you are looking for does not exist, has been removed, or has been moved to a new web location.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <Link
            href="/"
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-cre-border rounded-xl transition-all shadow-xs group"
          >
            <Home className="w-5 h-5 text-cre-navy mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Home Page</span>
          </Link>

          <Link
            href="/login?tab=admin"
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-cre-border rounded-xl transition-all shadow-xs group"
          >
            <ShieldCheck className="w-5 h-5 text-cre-navy mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Admin Login</span>
          </Link>

          <Link
            href="/login?tab=student"
            className="flex flex-col items-center justify-center p-4 bg-white hover:bg-slate-50 border border-cre-border rounded-xl transition-all shadow-xs group"
          >
            <GraduationCap className="w-5 h-5 text-cre-green mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Student Portal</span>
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-cre-border py-4 text-center text-xs text-slate-500">
        <p>Continuing Religious Education (CRE) • Wisdom Islamic Students Organization</p>
      </footer>
    </div>
  );
}
