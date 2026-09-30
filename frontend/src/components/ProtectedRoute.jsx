import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--primary-dark)', fontWeight: 600 }}>Loading AGROFLOW AI...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (requiredRole === 'FARMER') {
      return <Navigate to="/farmer/auth" replace />;
    }
    if (requiredRole === 'BUYER') {
      return <Navigate to="/buyer/auth" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Prevent FARMER accessing BUYER dashboard and vice versa
    if (role === 'FARMER') {
      return <Navigate to="/farmer/dashboard" replace />;
    }
    if (role === 'BUYER') {
      return <Navigate to="/buyer/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
