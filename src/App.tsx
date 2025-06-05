
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RequireAdmin from "@/guards/RequireAdmin";

// Pages
import HomePage from "@/pages/HomePage";
import CertificationListPage from "@/pages/CertificationListPage";
import CertificationDetailPage from "@/pages/CertificationDetailPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import ExamStartPage from "@/pages/ExamStartPage";
import ExamPage from "@/pages/ExamPage";
import ResultsPage from "@/pages/ResultsPage";
import CertificatePage from "@/pages/CertificatePage";
import AboutPage from "@/pages/AboutPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminPage from "@/pages/AdminPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/certifications" element={<CertificationListPage />} />
              <Route path="/certifications/:id" element={<CertificationDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/exam/start" element={
                <ProtectedRoute>
                  <ExamStartPage />
                </ProtectedRoute>
              } />
              <Route path="/exam/:id" element={
                <ProtectedRoute>
                  <ExamPage />
                </ProtectedRoute>
              } />
              <Route path="/results/:id" element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              } />
              <Route path="/certificate/:id" element={
                <ProtectedRoute>
                  <CertificatePage />
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              } />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
