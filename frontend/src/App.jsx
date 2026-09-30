import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import EntryScreen from './pages/EntryScreen';
import FarmerAuth from './pages/FarmerAuth';
import BuyerAuth from './pages/BuyerAuth';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* The ONLY landing page at root is the simple Entry Screen */}
            <Route path="/" element={<EntryScreen />} />

            {/* Farmer Module Flow */}
            <Route path="/farmer/auth" element={<FarmerAuth />} />
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute requiredRole="FARMER">
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Buyer Module Flow */}
            <Route path="/buyer/auth" element={<BuyerAuth />} />
            <Route
              path="/buyer/dashboard"
              element={
                <ProtectedRoute requiredRole="BUYER">
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
