import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportFormPage from './pages/ReportFormPage';
import ReportListPage from './pages/ReportListPage';
import ReportDetailPage from './pages/ReportDetailPage';
import ReviewApprovalPage from './pages/ReviewApprovalPage';
import CCTVMasterPage from './pages/CCTVMasterPage';
import StationMasterPage from './pages/StationMasterPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="reports" element={<ReportListPage />} />
            <Route path="reports/:id" element={<ReportDetailPage />} />

            <Route
              path="reports/new"
              element={
                <ProtectedRoute allowedRoles={['petugas']}>
                  <ReportFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['petugas']}>
                  <ReportFormPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="review"
              element={
                <ProtectedRoute allowedRoles={['assistant_manager']}>
                  <ReviewApprovalPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="master/cctv"
              element={
                <ProtectedRoute allowedRoles={['assistant_manager']}>
                  <CCTVMasterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="master/stations"
              element={
                <ProtectedRoute allowedRoles={['assistant_manager']}>
                  <StationMasterPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
