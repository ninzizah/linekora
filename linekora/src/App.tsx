/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';

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


// Dashboard Layouts
const DashboardRedirect = () => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 font-sans">
      <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Securing session...</p>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  if (!profile && !loading) {
    // If we have a user but no profile doc, send to register to finish setup
    return <Navigate to="/register" />;
  }

  if (profile?.role === 'WORKER') return <Navigate to="/dashboard/worker" />;
  if (profile?.role === 'COMPANY') return <Navigate to="/dashboard/company" />;
  if (profile?.role === 'EMPLOYER') return <Navigate to="/dashboard/employer" />;
  if (profile?.role === 'ADMIN') return <Navigate to="/admin" />;
  
  // Profile exists but no recognized role — back to register
  if (profile && !profile.role) return <Navigate to="/register" />;
  
  return null;
};

import { LanguageProvider } from './lib/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/scams" element={<ScamAwareness />} />
          <Route path="/legal" element={<Legal />} />

          {/* Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Dashboard Entry */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard/worker" element={<WorkerDashboard />} />
          <Route path="/dashboard/worker/verify" element={<WorkerVerification />} />
          <Route path="/dashboard/worker/browse" element={<BrowseJobs />} />
          <Route path="/dashboard/worker/wallet" element={<WorkerWallet />} />
          <Route path="/dashboard/worker/reviews" element={<WorkerReviews />} />
          <Route path="/dashboard/worker/applications" element={<WorkerApplications />} />
          <Route path="/dashboard/worker/messages" element={<WorkerMessages />} />
          <Route path="/dashboard/worker/settings" element={<WorkerSettings />} />
          <Route path="/dashboard/worker/profile" element={<WorkerProfile />} />
          <Route path="/dashboard/worker/*" element={<WorkerDashboard />} />
          
          <Route path="/dashboard/company" element={<CompanyDashboard />} />
          <Route path="/dashboard/company/post" element={<PostJob />} />
          <Route path="/dashboard/company/jobs" element={<CompanyManageJobs />} />
          <Route path="/dashboard/company/applicants" element={<CompanyApplicants />} />
          <Route path="/dashboard/company/messages" element={<CompanyMessages />} />
          <Route path="/dashboard/company/verify" element={<CompanyVerification />} />
          <Route path="/dashboard/company/payments" element={<CompanyWallet />} />
          <Route path="/dashboard/company/analytics" element={<CompanyAnalytics />} />
          <Route path="/dashboard/company/settings" element={<CompanySettings />} />
          <Route path="/dashboard/company/browse" element={<BrowseWorkers />} />
          <Route path="/dashboard/company/*" element={<CompanyDashboard />} />
          
          <Route path="/dashboard/employer" element={<EmployerDashboard />} />
          <Route path="/dashboard/employer/post" element={<EmployerPostTask />} />
          <Route path="/dashboard/employer/browse" element={<BrowseWorkers />} />
          <Route path="/dashboard/employer/messages" element={<EmployerMessages />} />
          <Route path="/dashboard/employer/verify" element={<EmployerVerification />} />
          <Route path="/dashboard/employer/wallet" element={<EmployerWallet />} />
          <Route path="/dashboard/employer/settings" element={<EmployerSettings />} />
          <Route path="/dashboard/employer/*" element={<EmployerDashboard />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </LanguageProvider>
  );
}
