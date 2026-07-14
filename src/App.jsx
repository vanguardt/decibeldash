import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Recordings from '@/pages/Recordings';
import Compare from '@/pages/Compare';
import Rankings from '@/pages/Rankings';
import SoundRoulette from '@/pages/SoundRoulette';
import Recommend from '@/pages/Recommend';
import Creator from '@/pages/Creator';
import SwitchLibrary from '@/pages/SwitchLibrary';
import SwitchDetail from '@/pages/SwitchDetail';
import BuildProfiles from '@/pages/BuildProfiles';
import BuildProfileDetail from '@/pages/BuildProfileDetail';
import Settings from '@/pages/Settings';
import Pricing from '@/pages/Pricing';
import Marketplace from '@/pages/Marketplace';
import PaymentSuccess from '@/pages/PaymentSuccess';
import Privacy from '@/pages/Privacy';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AUTH_PAGE_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const currentPath = window.location.pathname;
  const isAuthPage = AUTH_PAGE_PATHS.includes(currentPath);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors — but always let auth pages render
  if (authError && !isAuthPage) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Navigate to="/login" replace />;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recordings" element={<Recordings />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/roulette" element={<SoundRoulette />} />
        <Route path="/recommend" element={<Recommend />} />
        <Route path="/creator" element={<Creator />} />
        <Route path="/switches" element={<SwitchLibrary />} />
        <Route path="/switches/:id" element={<SwitchDetail />} />
        <Route path="/builds" element={<BuildProfiles />} />
        <Route path="/builds/:id" element={<BuildProfileDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/pricing" element={<Pricing />} />
       // <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/privacy" element={<Privacy />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
    <footer
  style={{
    textAlign: "center",
    padding: "12px",
    fontSize: "0.85rem",
    opacity: 0.6,
    marginTop: "24px"
  }}
>
  Made by R&R Gaming • DecibelDash
</footer>

      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App