import React from 'react';
import { LogOut, User, FileText } from 'lucide-react';
import type { Profile } from '../types';

interface HeaderProps {
  user: Profile;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
}) => {
  return (
    <header className="flex-shrink-0 z-50 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-gray-200/50">
      <div className="w-full px-3 sm:px-6 h-12 flex items-center justify-between">
        
        {/* Tadbeer Logo & Branding */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Tadbeer Logo" className="h-8 w-auto object-contain" />
        </div>

        {/* Action pills & user profiles */}
        <div className="flex items-center gap-2">
          {/* Operations Blueprint pill (styled after Tadbeer website in screenshot) */}
          <div className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-xs font-semibold text-gray-600">
            <FileText className="w-3.5 h-3.5 text-[#C5A85C]" />
            <span>OPERATIONS BLUEPRINT</span>
          </div>

          {/* User pill */}
          <div className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
            <div className="w-6 h-6 rounded-full bg-[#0D4855] text-white flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left pr-2">
              <span className="text-[10px] font-bold text-[#0D4855] leading-none">
                {user.name.split(' ')[0]}
              </span>
              <span className="text-[8px] font-medium text-[#C5A85C] uppercase tracking-wider leading-none mt-0.5">
                {user.role}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-red-600 rounded-full shadow-sm"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
