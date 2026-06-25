import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { InternDashboard } from './components/InternDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ReportDetailsModal } from './components/ReportDetailsModal';
import { InternIntake } from './components/InternIntake';
import { dbService } from './services/db';
import type { Profile, DailyReport } from './types';
import { AlertCircle } from 'lucide-react';

function App() {
  // Session & Authentication state
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  
  // Magic link invitation states
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [inviteDefaultName, setInviteDefaultName] = useState<string | null>(null);
  const [isIntake, setIsIntake] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Modal State for viewing report details
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);

  // Initialize Session and force light mode on mount
  useEffect(() => {
    // 1. Force light mode only
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('tadbeer_dark_mode');

    // 2. Parse invite_token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite_token');

    if (token) {
      const verifyAndLogin = async () => {
        setVerifyingToken(true);
        setTokenError(null);
        try {
          // Verify invitation token
          const invite = await dbService.verifyInvitationToken(token);
          
          try {
            // Try silently logging in with token as password (if already registered)
            const profile = await dbService.loginWithToken(token, invite.email);
            handleLoginSuccess(profile);
            
            // Clean URL query parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (loginErr) {
            // If login fails, user has not registered yet -> show intake form
            setInviteToken(token);
            setInviteEmail(invite.email);
            setInviteDefaultName(invite.name);
            setIsIntake(true);
          }
        } catch (err: any) {
          setTokenError(err.message || 'The invitation link is invalid or has expired.');
        } finally {
          setVerifyingToken(false);
        }
      };

      verifyAndLogin();
    } else {
      // Regular session check
      const savedUser = localStorage.getItem('tadbeer_session');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('tadbeer_session');
        }
      }
    }
  }, []);

  // Auth Handlers
  const handleLoginSuccess = (profile: Profile) => {
    setCurrentUser(profile);
    localStorage.setItem('tadbeer_session', JSON.stringify(profile));
  };

  const handleLogout = () => {
    dbService.logout();
    setCurrentUser(null);
    localStorage.removeItem('tadbeer_session');
    setActiveReport(null);
  };

  const handleIntakeComplete = async (name: string, roleTitle: string, workProfile: string, objectivesToAchieve: string) => {
    if (!inviteToken) return;
    try {
      const profile = await dbService.completeInternRegistration(inviteToken, name, roleTitle, workProfile, objectivesToAchieve);
      handleLoginSuccess(profile);
      setIsIntake(false);
      setInviteToken(null);
      setInviteEmail(null);
      setInviteDefaultName(null);
      
      // Clean URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to complete registration.');
    }
  };

  // Open Details Modal Handler
  const handleOpenReport = (report: DailyReport) => {
    setActiveReport(report);
  };

  const handleCloseReport = () => {
    setActiveReport(null);
  };

  // Add Comment Handler (inside details modal)
  const handleAddComment = async (reportId: string, commentText: string) => {
    if (!currentUser) return;
    
    try {
      const newComment = await dbService.addComment(reportId, currentUser.id, commentText);
      
      // Update active report state locally to render comment immediately
      if (activeReport && activeReport.id === reportId) {
        setActiveReport((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            comments: [...(prev.comments || []), newComment],
          };
        });
      }

      // Trigger custom window event to notify Admin Dashboard to refresh data counters
      window.dispatchEvent(new Event('refresh-admin-dashboard'));
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  // 1. Loading state for magic link verification
  if (verifyingToken) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-6 text-center">
        <div className="w-14 h-14 bg-white border border-[#C5A85C]/35 rounded-2xl flex items-center justify-center mb-6 shadow-sm animate-pulse">
          <svg viewBox="0 0 100 100" className="w-9 h-9 text-[#C5A85C]">
            <path
              d="M 50,10 L 80,30 L 80,70 L 50,90 L 20,70 L 20,30 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
            />
            <circle cx="50" cy="50" r="14" fill="currentColor" className="opacity-90 animate-ping" style={{ animationDuration: '3s' }} />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#0D4855] uppercase tracking-wider animate-pulse">
          Verifying Invitation Link...
        </h3>
        <p className="text-xs text-gray-400 mt-2 font-medium animate-pulse">
          Securing connection and checking credentials
        </p>
      </div>
    );
  }

  // 2. Error state for invalid/expired tokens
  if (tokenError) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-6 text-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="w-14 h-14 bg-red-50 border border-red-150 rounded-2xl flex items-center justify-center mb-6 mx-auto text-red-500 shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-[#0D4855] uppercase tracking-wider">
            Verification Failed
          </h3>
          <p className="text-xs text-gray-500 mt-3 font-medium leading-relaxed">
            {tokenError}
          </p>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => {
                setTokenError(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="px-6 py-3 bg-[#0D4855] text-white hover:bg-[#0A3D49] font-bold text-xs rounded-xl shadow-md transition-all tracking-wider uppercase"
            >
              Go to Login Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Intake state for first-time intern details entry
  if (isIntake && inviteEmail) {
    return (
      <InternIntake
        email={inviteEmail}
        defaultName={inviteDefaultName || ''}
        onComplete={handleIntakeComplete}
      />
    );
  }

  // 4. Standard admin password authentication form
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0D4855] flex flex-col font-sans">
      {/* Header */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentUser.role === 'admin' ? (
          <AdminDashboard currentUser={currentUser} onOpenReport={handleOpenReport} />
        ) : (
          <InternDashboard user={currentUser} onOpenReport={handleOpenReport} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-gray-200/50 bg-[#FAF8F5]/50 text-center text-xs text-gray-400 font-medium">
        Tadbeer Daily Work Tracker • Operations Blueprint v1.0
      </footer>

      {/* Details Journal Modal Overlay */}
      {activeReport && (
        <ReportDetailsModal
          report={activeReport}
          currentUser={currentUser}
          onClose={handleCloseReport}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
}

export default App;
