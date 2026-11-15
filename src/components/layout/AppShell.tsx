'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-cre-bg font-sans">
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen((v) => !v)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-7 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
