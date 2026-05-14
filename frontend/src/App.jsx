import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import ClaimPortal from './pages/ClaimPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * Inner component that has access to useLocation().
 * The key on Routes forces React to fully remount components
 * on every navigation, preventing stale cached renders
 * (e.g., old login background showing after logout).
 */
function AppRoutes() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<ClaimPortal />} />
      <Route path="/claim" element={<ClaimPortal />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
