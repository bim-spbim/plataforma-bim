import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { user } = useAuth();

  // Se não tiver usuário logado, chuta de volta pra página de Login ("/")
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Se tiver logado, deixa passar e renderiza a tela
  return children;
}