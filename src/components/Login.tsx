import React, { useState } from 'react';
import { dbService } from '../services/db';
import type { Profile } from '../types';
import { Lock, Mail, Shield, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (profile: Profile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error('Please enter your email address.');
      }
      if (!password) {
        throw new Error('Please enter your password.');
      }

      // Hard limit check: only specified emails are allowed as admin
      const emailLower = email.trim().toLowerCase();
      if (emailLower !== 'w.taufiqq@gmail.com' && emailLower !== 'operation@tadbeertt.com') {
        throw new Error('Access denied. Only authorized admins can access the Admin Control Panel.');
      }

      const { profile } = await dbService.login(email, 'admin', password);
      
      if (profile.role !== 'admin') {
        // Sign out if non-admin somehow authenticated
        await dbService.logout();
        throw new Error('This portal is for Administrative personnel only. Interns must sign in via Magic Link.');
      }

      onLoginSuccess(profile);
    } catch (err: any) {
      setError(err.message || 'Invalid administrative credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('w.taufiqq@gmail.com');
    setPassword('tadbeer2025');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Graphic Assets */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#C5A85C]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#0D4855]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 z-10">
        
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-[#FAF8F5] border border-[#C5A85C]/35 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <svg viewBox="0 0 100 100" className="w-9 h-9 text-[#C5A85C]">
              <path
                d="M 50,10 L 80,30 L 80,70 L 50,90 L 20,70 L 20,30 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
              />
              <circle cx="50" cy="50" r="14" fill="currentColor" className="opacity-90" />
              <path
                d="M 50,10 L 50,36 M 80,30 L 58,45 M 80,70 L 58,55 M 50,90 L 50,64 M 20,70 L 42,55 M 20,30 L 42,45"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-[#0D4855] uppercase tracking-wider">
            TADBEER
          </h2>
          <span className="text-xs text-[#C5A85C] tracking-[0.25em] font-semibold uppercase mt-1">
            Transformation Trading
          </span>
          <p className="text-sm text-gray-500 mt-3 font-medium">
            Administrative Control Portal
          </p>
        </div>

        {/* Info Banner for Interns */}
        <div className="mb-6 bg-[#FAF8F5] border border-[#C5A85C]/20 rounded-2xl p-4 text-left">
          <h4 className="text-xs font-bold text-[#0D4855] uppercase tracking-wider mb-1">Intern Notice</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
            To view or log work logs, please access the platform directly using the unique **Magic Link** sent by your supervisor. Password login is not required for interns.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-gray-500">Admin Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="admin@tadbeer.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A85C] focus:border-[#C5A85C] text-[#0D4855] placeholder-gray-400 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-gray-500">Security Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A85C] focus:border-[#C5A85C] text-[#0D4855] placeholder-gray-400 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none tracking-wider uppercase flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>{isLoading ? 'Verifying Admin Access...' : 'Sign In as Admin'}</span>
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
            Quick-access Demo Role
          </span>
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={handleQuickFill}
              className="px-4 py-2 text-[10px] font-bold text-[#C5A85C] bg-[#C5A85C]/5 border border-[#C5A85C]/10 rounded-lg hover:bg-[#C5A85C]/10 transition-all flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Taufiqq (Admin)</span>
            </button>
          </div>
        </div>

      </div>

      <div className="mt-8 text-center text-xs text-gray-400 font-medium">
        © {new Date().getFullYear()} Tadbeer Transformation Trading. All rights reserved.
      </div>
    </div>
  );
};
