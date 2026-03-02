import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecoverPage from "./pages/RecoverPage";
import DashboardPage from "./pages/DashboardPage";
import PensionPage from "./pages/PensionPage";
import HealthcarePage from "./pages/HealthcarePage";
import CareerPage from "./pages/CareerPage";
import CommunityPage from "./pages/CommunityPage";
import ResourcesPage from "./pages/ResourcesPage";
import NotificationsPage from "./pages/NotificationsPage";
import FeedbackPage from "./pages/FeedbackPage";
import ProfilePage from "./pages/ProfilePage";

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

export default function App() {
  return (
    <BrowserRouter>
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
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
