import { Suspense, useState, useEffect } from "react";
import { Navigate, Route, Routes, useRoutes, Outlet } from "react-router-dom";
import routes from "tempo-routes";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import AdminRoute from "./components/auth/AdminRoute";
import Dashboard from "./components/pages/dashboard";
import BrainDump from "./components/pages/brain-dump";
import BrainDumps from "./components/pages/brain-dumps";
import Creator from "./components/pages/creator";
import Products from "./components/pages/products";
import ProductDetail from "./components/pages/product-detail";
import Debug from "./components/pages/debug";
import Success from "./components/pages/success";
import Home from "./components/pages/home";
import Settings from "./components/pages/settings";
import Documentation from "./components/pages/documentation";
import Support from "./components/pages/support";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider, useAuth } from "../supabase/auth";
import { Toaster } from "./components/ui/toaster";
import { WorkflowProvider } from "./lib/contexts/WorkflowContext";
import { ThemeProvider } from "./lib/contexts/ThemeContext";
import AuthModal from "./components/auth/AuthModal";
import WorkflowContainer from "./components/workflow/WorkflowContainer";
import WorkflowSelectionPage from "./components/workflow/WorkflowSelectionPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-yellow"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialAuthView, setInitialAuthView] = useState<'login' | 'signup'>('login');

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setInitialAuthView(view);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/brain-dump"
          element={
            <PrivateRoute>
              <BrainDump />
            </PrivateRoute>
          }
        />
        <Route
          path="/brain-dump/:id"
          element={
            <PrivateRoute>
              <BrainDump />
            </PrivateRoute>
          }
        />
        <Route
          path="/brain-dumps"
          element={
            <PrivateRoute>
              <BrainDumps />
            </PrivateRoute>
          }
        />
        <Route
          path="/brain-dumps/:id"
          element={
            <PrivateRoute>
              <BrainDump />
            </PrivateRoute>
          }
        />
        <Route
          path="/creator"
          element={
            <PrivateRoute>
              <WorkflowProvider>
                <Creator />
              </WorkflowProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/workflow"
          element={
            <PrivateRoute>
              <WorkflowSelectionPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/workflow/:type"
          element={
            <PrivateRoute>
              <WorkflowProvider>
                <WorkflowContainer />
              </WorkflowProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/workflow/:type/:id"
          element={
            <PrivateRoute>
              <WorkflowProvider>
                <WorkflowContainer />
              </WorkflowProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <PrivateRoute>
              <ProductDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/documentation"
          element={
            <PrivateRoute>
              <Documentation />
            </PrivateRoute>
          }
        />
        <Route
          path="/support"
          element={
            <PrivateRoute>
              <Support />
            </PrivateRoute>
          }
        />
        <Route
          path="/debug"
          element={
            <PrivateRoute>
              <Debug />
            </PrivateRoute>
          }
        />
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<AdminDashboard />} />
        </Route>
        <Route path="/success" element={<Success />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={initialAuthView}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
