import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Assuming AuthContext is for admin
import { useStoreManagerAuth } from '../contexts/StoreManagerAuthContext'; // For store manager auth
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  storeManagerOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  storeManagerOnly = false,
}) => {
  const { user, loading: authLoading, isSuperAdmin } = useAuth(); // Admin auth
  const { manager, loading: managerAuthLoading } = useStoreManagerAuth(); // Store manager auth

  // Show loading only if authentication is still being determined
  if (authLoading || managerAuthLoading) {
    return <LoadingSpinner />;
  }

  // Admin protection
  if (adminOnly) {
    // Check if user exists and has superadmin role
    if (!user || !isSuperAdmin || manager) { // If no admin user, not superadmin, or if a store manager is logged in
      return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
  }

  // Store Manager protection
  if (storeManagerOnly) {
    if (!manager) {
      return <Navigate to="/store-manager/login" replace />;
    }
    return <>{children}</>;
  }

  // Default protection (either admin or store manager can access, or no specific role required)
  if (!user && !manager) {
    // If neither is logged in, redirect to admin login by default, or a public page
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

