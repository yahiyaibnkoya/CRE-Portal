'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Building,
  ShieldCheck,
  Users,
  Wallet,
  HeartHandshake,
  FileSpreadsheet,
  FileText,
  UserPlus,
  Settings,
  CalendarCheck,
  IndianRupee,
  GraduationCap,
  Receipt,
  KeyRound,
  Home,
  Award,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const pathname = usePathname();
  const { role, activeCenter } = useAuth();

  const superAdminNav = [
    { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
    { name: 'CRE Centres', href: '/super-admin/centers', icon: Building2 },
    { name: 'Centre Administrators', href: '/super-admin/admins', icon: ShieldCheck },
    { name: 'Faculties', href: '/super-admin/faculties', icon: GraduationCap },
    { name: 'Students', href: '/super-admin/students', icon: Users },
    { name: 'Attendance', href: '/super-admin/attendance', icon: CalendarCheck },
    { name: 'Financial Overview', href: '/super-admin/finance', icon: Wallet },
    { name: 'Donations', href: '/super-admin/donations', icon: HeartHandshake },
    { name: 'Reports', href: '/super-admin/reports', icon: FileSpreadsheet },
    { name: 'Donated Contacts', href: '/super-admin/contacts', icon: UserPlus },
    { name: 'Settings', href: '/super-admin/settings', icon: Settings },
  ];

  const centerAdminNav = [
    { name: 'Dashboard', href: '/center-admin', icon: LayoutDashboard },
    { name: 'Centre Information', href: '/center-admin/info', icon: Building },
    { name: 'Students', href: '/center-admin/students', icon: Users },
    { name: 'Attendance', href: '/center-admin/attendance', icon: CalendarCheck },
    { name: 'Fee Register', href: '/center-admin/fees', icon: IndianRupee },
    { name: 'Examinations', href: '/center-admin/exams', icon: GraduationCap },
    { name: 'Income & Expenses', href: '/center-admin/finance', icon: Receipt },
    { name: 'Reports', href: '/center-admin/reports', icon: FileText },
    { name: 'Login Management', href: '/center-admin/logins', icon: KeyRound },
    { name: 'Settings', href: '/center-admin/settings', icon: Settings },
  ];

  const studentNav = [
    { name: 'Overview', href: '/student', icon: Home },
    { name: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
    { name: 'Fee Details', href: '/student/fees', icon: IndianRupee },
    { name: 'Examination Results', href: '/student/exams', icon: Award },
    { name: 'Centre Information', href: '/student/center', icon: Building },
    { name: 'Donate a Contact', href: '/student/donate-contact', icon: UserPlus },
  ];

  const navItems =
    role === 'SUPER_ADMIN'
      ? superAdminNav
      : role === 'CENTER_ADMIN'
      ? centerAdminNav
      : studentNav;

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-cre-border transition-all duration-300 ease-in-out">
      {/* Centre context banner */}
      {activeCenter && (
        <div className="p-4 border-b border-cre-border bg-slate-50/70">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cre-green">
            Current Centre
          </span>
          <p className="text-xs font-bold text-cre-navy truncate mt-0.5">
            {activeCenter.name}
          </p>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-cre-green/10 text-cre-green font-semibold">
            {activeCenter.status}
          </span>
        </div>
      )}

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/super-admin' &&
              item.href !== '/center-admin' &&
              item.href !== '/student' &&
              pathname?.startsWith(item.href));

          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-cre-green-light text-cre-green font-bold shadow-xs border border-cre-green/20 translate-x-1'
                  : 'text-slate-600 hover:text-cre-navy hover:bg-slate-50 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cre-green' : 'text-slate-400 group-hover:text-cre-navy'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-cre-green" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Info */}
      <div className="p-3 border-t border-cre-border bg-slate-50/50 text-[10px] text-slate-500 flex flex-col space-y-0.5">
        <span className="font-bold text-cre-navy">CRE Management Portal</span>
        <span>Wisdom Islamic Students Org</span>
        <span className="text-[9px] text-slate-400">Asia/Kolkata (IST)</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar with subtle slide entry */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4.5rem)] sticky top-18 z-30 transition-transform duration-300 ease-in-out">
        {content}
      </aside>

      {/* Mobile Drawer Overlay with fluid sliding animation */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${
          isOpenMobile ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        <div
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isOpenMobile ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />
        <div
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
            isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-cre-border">
            <span className="text-xs font-bold text-cre-navy">Navigation Menu</span>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{content}</div>
        </div>
      </div>
    </>
  );
};
