import React, { useState } from 'react';
import { User, Mail, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

interface InternIntakeProps {
  email: string;
  defaultName: string;
  onComplete: (name: string) => Promise<void>;
}

export const InternIntake: React.FC<InternIntakeProps> = ({ email, defaultName, onComplete }) => {
  const [name, setName] = useState(defaultName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete(name.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#C5A85C]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#0D4855]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 z-10 text-left">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-8 border-b border-gray-100 pb-6">
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
          <h2 className="text-2xl font-bold text-[#0D4855] uppercase tracking-wider">
            TADBEER
          </h2>
          <span className="text-[10px] text-[#C5A85C] tracking-[0.25em] font-semibold uppercase mt-0.5">
            Operations Blueprint
          </span>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            Profile Registration Portal
          </p>
        </div>

        {/* Introduction */}
        <div className="mb-6 bg-[#0D4855]/5 border border-[#0D4855]/10 rounded-2xl p-4 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-[#C5A85C] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#0D4855]">Secure Access Confirmed</h4>
            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
              Your supervisor has authorized your intern profile. Please complete your registration details to activate your Daily Work Tracker dashboard.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email (Disabled, verified by token) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Authorized Email Address</label>
            <div className="relative opacity-65">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm text-[#0D4855] font-semibold focus:outline-none select-none"
              />
            </div>
          </div>

          {/* Full Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Your Full Name *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#C5A85C]">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Aisha Al-Hashimi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A85C] focus:border-[#C5A85C] text-[#0D4855] placeholder-gray-400 font-semibold transition-all"
                disabled={isSubmitting}
                required
              />
            </div>
            <p className="text-[9px] text-gray-400">Please provide your official name for reporting summaries.</p>
          </div>

          {/* Complete Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 mt-2 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none tracking-wider uppercase flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Registering Profile...' : 'Complete Profile Setup'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

      </div>

      <div className="mt-8 text-center text-xs text-gray-400 font-medium">
        © {new Date().getFullYear()} Tadbeer Transformation Trading. All rights reserved.
      </div>
    </div>
  );
};
