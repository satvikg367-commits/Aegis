import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const RecoverPage = lazy(() => import("./pages/RecoverPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PensionPage = lazy(() => import("./pages/PensionPage"));
const HealthcarePage = lazy(() => import("./pages/HealthcarePage"));
const CareerPage = lazy(() => import("./pages/CareerPage"));
const CsdPage = lazy(() => import("./pages/CsdPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function Shell() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function NotFound() {
  return <div className="center-note">Page not found.</div>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/recover" element={<RecoverPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Shell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pension" element={<PensionPage />} />
          <Route path="/healthcare" element={<HealthcarePage />} />
          <Route path="/career" element={<CareerPage />} />
          <Route path="/csd" element={<CsdPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/community" element={<Navigate to="/" replace />} />
          <Route path="/feedback" element={<Navigate to="/" replace />} />
          <Route path="/resources" element={<Navigate to="/" replace />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="center-note">Loading portal...</div>}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}
