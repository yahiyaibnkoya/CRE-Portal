import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Continuing Religious Education (CRE)',
  description: 'Privacy Policy for Continuing Religious Education (CRE) portal by Wisdom Islamic Students Organization.',
};

export default function PrivacyPolicyPage() {
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
            <div className="p-2.5 rounded-xl bg-cre-green-light text-cre-green">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-cre-navy">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500">
                Continuing Religious Education (CRE) • Wisdom Islamic Students Organization
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              This Privacy Policy explains how the Continuing Religious Education (CRE) portal, organized under the auspices of the <strong>Wisdom Islamic Students Organization</strong> in Kerala, collects, uses, and safeguards the administrative and academic records of registered students, parents, and centre administrators.
            </p>

            <h2 className="text-base font-bold text-cre-navy pt-2">1. Information We Collect</h2>
            <p>
              We collect information strictly necessary for academic administration, attendance monitoring, and fee records, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Student identification details (Full name, admission number, gender, place/locality).</li>
              <li>Parent/Guardian contact details (Parent name and mobile phone number).</li>
              <li>Centre administrative credentials (Administrator phone number and 4-digit PIN).</li>
              <li>Academic data (Attendance records, examination scores, monthly fee ledgers).</li>
            </ul>

            <h2 className="text-base font-bold text-cre-navy pt-2">2. Purpose of Processing</h2>
            <p>
              The collected data is utilized exclusively for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Facilitating parent access to attendance records and examination results.</li>
              <li>Empowering centre administrators to conduct classes and maintain accurate fee statements.</li>
              <li>Generating educational certificates and academic progress summaries.</li>
              <li>Enabling Super Admin statewide governance and quality assurance across affiliated CRE centres.</li>
            </ul>

            <h2 className="text-base font-bold text-cre-navy pt-2">3. Data Protection & Confidentiality</h2>
            <p>
              We do not sell, rent, or trade student, parent, or administrator personal data to third parties. All student records are restricted to their authorized centre administrators and verified parent phone numbers.
            </p>

            <h2 className="text-base font-bold text-cre-navy pt-2">4. Contact & Inquiries</h2>
            <p>
              For data access requests, corrections, or queries regarding student privacy, please contact your local CRE Centre Administrator or reach out to the statewide coordination desk through the registered Super Admin contact.
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
