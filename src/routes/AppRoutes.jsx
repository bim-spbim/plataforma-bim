import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from '../pages/Login';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard'; // <-- A nossa página nova!
import UpdatePassword from '../pages/UpdatePassword';
import PrivateRoute from './PrivateRoute';
import { AuthProvider } from '../contexts/AuthContext';
import EditProfile from '../pages/EditProfile';

export default function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<Login />} />
          
          {/* Rotas Privadas (Protegidas pelo nosso segurança) */}
          <Route path="/home" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          
          <Route path="/update-password" element={<UpdatePassword />} />

          <Route path="/projeto/:id" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          {/* NOVA ROTA DO ADMIN 👑 */}
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* ROTA DO PERFIL */}
          <Route path="/perfil" element={
            <PrivateRoute>
              <EditProfile />
            </PrivateRoute>
          } />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}