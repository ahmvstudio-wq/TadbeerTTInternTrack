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
    <header className="sticky top-0 z-50 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-gray-200/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Tadbeer Logo & Branding */}
        <div className="flex items-center gap-3">
          {/* SVG representation of the gold geometric logo in screenshot */}
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white rounded-xl border border-[#C5A85C]/20 shadow-sm">
            <svg viewBox="0 0 100 100" className="w-7 h-7 text-[#C5A85C]">
              <path
                d="M 50,10 L 80,30 L 80,70 L 50,90 L 20,70 L 20,30 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <circle cx="50" cy="50" r="14" fill="currentColor" className="opacity-80" />
              <path
                d="M 50,10 L 50,36 M 80,30 L 58,45 M 80,70 L 58,55 M 50,90 L 50,64 M 20,70 L 42,55 M 20,30 L 42,45"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex flex-col select-none">
            <span className="text-lg font-bold text-[#0D4855] tracking-widest uppercase">
              Tadbeer
            </span>
            <span className="text-[9px] font-medium text-[#C5A85C] tracking-[0.25em] uppercase">
              Transformation Trading
            </span>
          </div>
        </div>

        {/* Action pills & user profiles */}
        <div className="flex items-center gap-4">
          {/* Operations Blueprint pill (styled after Tadbeer website in screenshot) */}
          <div className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-xs font-semibold text-gray-600">
            <FileText className="w-3.5 h-3.5 text-[#C5A85C]" />
            <span>OPERATIONS BLUEPRINT</span>
          </div>

          {/* User pill */}
          <div className="flex items-center gap-2.5 pl-2.5 pr-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
            <div className="w-7 h-7 rounded-full bg-[#0D4855] text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-[#0D4855] leading-tight">
                {user.name}
              </span>
              <span className="text-[9px] font-medium text-[#C5A85C] uppercase tracking-wider leading-none">
                {user.role}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 rounded-full shadow-sm transition-all"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
