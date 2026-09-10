/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Pricing from './pages/public/Pricing';
import Contact from './pages/public/Contact';
import ScamAwareness from './pages/public/ScamAwareness';
import Legal from './pages/public/Legal';

// Dashboard Pages
import WorkerDashboard from './pages/worker/Dashboard';
import WorkerVerification from './pages/worker/Verification';
import BrowseJobs from './pages/worker/BrowseJobs';
import WorkerWallet from './pages/worker/Wallet';
import WorkerReviews from './pages/worker/Reviews';
import WorkerApplications from './pages/worker/Applications';
import WorkerMessages from './pages/worker/Messages';
import WorkerSettings from './pages/worker/Settings';
import WorkerProfile from './pages/worker/Profile';

// Company Pages
import CompanyDashboard from './pages/company/Dashboard';
import PostJob from './pages/company/PostJob';
import CompanyAnalytics from './pages/company/Analytics';
import CompanyManageJobs from './pages/company/ManageJobs';
import CompanyApplicants from './pages/company/Applicants';
import CompanyMessages from './pages/company/Messages';
import CompanyWallet from './pages/company/Wallet';
import CompanyVerification from './pages/company/Verification';
import CompanySettings from './pages/company/Settings';
import BrowseWorkers from './pages/company/BrowseWorkers';

// Employer Pages
import EmployerDashboard from './pages/employer/Dashboard';
import EmployerPostTask from './pages/employer/PostTask';
import EmployerMessages from './pages/employer/Messages';
import EmployerVerification from './pages/employer/Verification';
import EmployerWallet from './pages/employer/Wallet';
import EmployerSettings from './pages/employer/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';

// Auth Pages
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import RoleSelection from './pages/auth/RoleSelection';


// Dashboard Layouts
const LoadingSpinner = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 font-sans">
    <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Securing session...</p>
  </div>
);

/** Blocks access until profile is fully loaded, then enforces role-based routing. */
const DashboardRedirect = () => {
  const { user, profile, loading } = useAuth();
  
  if (loading || (user && !profile)) return <LoadingSpinner />;
  
  if (!user) return <Navigate to="/login" />;
  
  if (!profile) return <Navigate to="/select-role" />;

  if (profile.role === 'WORKER') return <Navigate to="/dashboard/worker" />;
  if (profile.role === 'COMPANY') return <Navigate to="/dashboard/company" />;
  if (profile.role === 'EMPLOYER') return <Navigate to="/dashboard/employer" />;
  if (profile.role === 'ADMIN') return <Navigate to="/admin" />;
  
  if (profile && !profile.role) return <Navigate to="/register" />;
  
  return null;
};

/** Route guard: only renders children if the user's role is in allowedRoles. */
const RoleRoute = ({ allowedRoles, children }: { allowedRoles: string[]; children: ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/select-role" replace />;

  if (!allowedRoles.includes(profile.role)) {
    // Redirect to the correct dashboard for their actual role
    if (profile.role === 'WORKER') return <Navigate to="/dashboard/worker" replace />;
    if (profile.role === 'COMPANY') return <Navigate to="/dashboard/company" replace />;
    if (profile.role === 'EMPLOYER') return <Navigate to="/dashboard/employer" replace />;
    if (profile.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/select-role" replace />;
  }

  return <>{children}</>;
};

import { LanguageProvider } from './lib/LanguageContext';

// Redirect logged-in users away from the public landing page
const HomeRoute = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user && profile?.role) {
        navigate('/dashboard', { replace: true });
      } else if (user && !profile) {
        navigate('/select-role', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading || (user && profile?.role)) return null;
  if (user && !profile) return null;
  return <Home />;
};

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/scams" element={<ScamAwareness />} />
          <Route path="/legal" element={<Legal />} />

          {/* Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/select-role" element={<RoleSelection />} />

          {/* Dashboard Entry */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard/worker" element={<RoleRoute allowedRoles={['WORKER']}><WorkerDashboard /></RoleRoute>} />
          <Route path="/dashboard/worker/verify" element={<RoleRoute allowedRoles={['WORKER']}><WorkerVerification /></RoleRoute>} />
          <Route path="/dashboard/worker/browse" element={<RoleRoute allowedRoles={['WORKER']}><BrowseJobs /></RoleRoute>} />
          <Route path="/dashboard/worker/wallet" element={<RoleRoute allowedRoles={['WORKER']}><WorkerWallet /></RoleRoute>} />
          <Route path="/dashboard/worker/reviews" element={<RoleRoute allowedRoles={['WORKER']}><WorkerReviews /></RoleRoute>} />
          <Route path="/dashboard/worker/applications" element={<RoleRoute allowedRoles={['WORKER']}><WorkerApplications /></RoleRoute>} />
          <Route path="/dashboard/worker/messages" element={<RoleRoute allowedRoles={['WORKER']}><WorkerMessages /></RoleRoute>} />
          <Route path="/dashboard/worker/settings" element={<RoleRoute allowedRoles={['WORKER']}><WorkerSettings /></RoleRoute>} />
          <Route path="/dashboard/worker/profile" element={<RoleRoute allowedRoles={['WORKER']}><WorkerProfile /></RoleRoute>} />
          <Route path="/dashboard/worker/*" element={<RoleRoute allowedRoles={['WORKER']}><WorkerDashboard /></RoleRoute>} />
          
          <Route path="/dashboard/company" element={<RoleRoute allowedRoles={['COMPANY']}><CompanyDashboard /></RoleRoute>} />
          <Route path="/dashboard/company/post" element={<RoleRoute allowedRoles={['COMPANY']}><PostJob /></RoleRoute>} />
          <Route path="/dashboard/company/jobs" element={<RoleRoute allowedRoles={['COMPANY']}><CompanyManageJobs /></RoleRoute>} />
          <Route path="/dashboard/company/applicants" element={<RoleRoute allowedRoles={['COMPANY']}><CompanyApplicants /></RoleRoute>} />
          <Route path="/dashboard/company/messages" element={<RoleRoute allowedRoles={['COMPANY']}><CompanyMessages /></RoleRoute>} />
          <Route path="/dashboard/company/verify" element={<RoleRoute allowedRoles={['COMPANY']}><CompanyVerification /></RoleRoute>} />
          <Route path="/dashboard/company/payments" element={<RoleRoute allowedRoles={['COMPANY']}><CompanyWallet /></RoleRoute>} />
          <Route path="/dashboard/company/analytics" element={<RoleRoute allowedRoles={['COMPANY']}><CompanyAnalytics /></RoleRoute>} />
          <Route path="/dashboard/company/settings" element={<RoleRoute allowedRoles={['COMPANY']}><CompanySettings /></RoleRoute>} />
          <Route path="/dashboard/company/browse" element={<RoleRoute allowedRoles={['COMPANY']}><BrowseWorkers /></RoleRoute>} />
          <Route path="/dashboard/company/*" element={<RoleRoute allowedRoles={['COMPANY']}><CompanyDashboard /></RoleRoute>} />
          
          <Route path="/dashboard/employer" element={<RoleRoute allowedRoles={['EMPLOYER']}><EmployerDashboard /></RoleRoute>} />
          <Route path="/dashboard/employer/post" element={<RoleRoute allowedRoles={['EMPLOYER']}><EmployerPostTask /></RoleRoute>} />
          <Route path="/dashboard/employer/browse" element={<RoleRoute allowedRoles={['EMPLOYER']}><BrowseWorkers /></RoleRoute>} />
          <Route path="/dashboard/employer/messages" element={<RoleRoute allowedRoles={['EMPLOYER']}><EmployerMessages /></RoleRoute>} />
          <Route path="/dashboard/employer/verify" element={<RoleRoute allowedRoles={['EMPLOYER']}><EmployerVerification /></RoleRoute>} />
          <Route path="/dashboard/employer/wallet" element={<RoleRoute allowedRoles={['EMPLOYER']}><EmployerWallet /></RoleRoute>} />
          <Route path="/dashboard/employer/settings" element={<RoleRoute allowedRoles={['EMPLOYER']}><EmployerSettings /></RoleRoute>} />
          <Route path="/dashboard/employer/*" element={<RoleRoute allowedRoles={['EMPLOYER']}><EmployerDashboard /></RoleRoute>} />
          {/* Admin Routes */}
          <Route path="/admin" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/*" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </LanguageProvider>
  );
}
