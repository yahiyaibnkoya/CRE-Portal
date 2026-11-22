import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Continuing Religious Education (CRE)',
  description: 'Terms of Service for Continuing Religious Education (CRE) portal by Wisdom Islamic Students Organization.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cre-bg flex flex-col justify-between font-sans text-slate-800">
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

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 my-6">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-cre-border shadow-xs space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-cre-border">
            <div className="p-2.5 rounded-xl bg-cre-navy-light text-cre-navy">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
                Terms of Service
              </h1>
              <p className="text-xs text-slate-500">
                Continuing Religious Education (CRE) • Wisdom Islamic Students Organization
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Welcome to the Continuing Religious Education (CRE) Portal. By accessing or using this portal as an administrator, student, or parent, you agree to comply with and be bound by the following terms and guidelines.
            </p>

            <h2 className="text-base font-bold text-cre-navy pt-2">1. Scope of Service</h2>
            <p>
              The CRE Portal is an educational management tool provided for affiliated CRE centres operated under the direction of the Wisdom Islamic Students Organization. The portal is dedicated to facilitating student enrollment, attendance recording, academic assessment, and financial transparency.
            </p>

            <h2 className="text-base font-bold text-cre-navy pt-2">2. Administrative Responsibilities</h2>
            <p>
              Appointed Centre Administrators and Super Administrators are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintaining the confidentiality of their 4-digit administrator login PIN.</li>
              <li>Ensuring the accuracy and truthfulness of student attendance, marks, and financial ledger entries.</li>
              <li>Limiting access exclusively to authorized personnel (maximum 3 administrators per registered centre).</li>
            </ul>

            <h2 className="text-base font-bold text-cre-navy pt-2">3. Student & Parent Access</h2>
            <p>
              Students and parents are granted direct read-only access using their registered phone numbers. Any unauthorized attempts to compromise or alter records are strictly prohibited.
            </p>

            <h2 className="text-base font-bold text-cre-navy pt-2">4. Modifications & Updates</h2>
            <p>
              The Wisdom Islamic Students Organization reserves the right to enhance or update platform functionality to support the educational welfare of students and improve centre governance.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-cre-border py-4 text-center text-xs text-slate-500">
        <p>Continuing Religious Education (CRE) • Wisdom Islamic Students Organization</p>
      </footer>
    </div>
  );
}
