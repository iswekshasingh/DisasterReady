import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PlayGamePage } from './pages/PlayGamePage';

// Simple 404 view
const NotFoundPage = () => (
  <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
    <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-orange)', marginBottom: '0.5rem' }}>
      404
    </h1>
    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', marginBottom: '1.5rem' }}>
      Page Not Found
    </h2>
    <a href="/" className="btn btn-primary">
      Return to Home
    </a>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Leaderboard */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Guest-only Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />

            {/* Protected Trainee Dashboard & Simulation */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/play/earthquake"
              element={
                <ProtectedRoute>
                  <PlayGamePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
