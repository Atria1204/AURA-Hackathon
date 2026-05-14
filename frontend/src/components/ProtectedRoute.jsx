import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Guards admin routes — redirects to /login if not authenticated.
 * Auth state is stored in sessionStorage so it persists until the tab/browser closes.
 */
const ProtectedRoute = ({ children }) => {
  const isAuth = sessionStorage.getItem('aura_admin_auth') === 'true';

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
