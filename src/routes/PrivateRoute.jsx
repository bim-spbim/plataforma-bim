import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar'; 

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando a plataforma...</div>;
  if (!user) return <Navigate to="/" />;

  return (
    // O TRUQUE: position 'absolute', top/left 0 e width '100vw' quebram a gaiola do CSS global!
    // Tiramos a cor de fundo daqui para ele respeitar a cor escura/clara que a Navbar joga no 'body'.
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      minHeight: '100vh', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      overflowX: 'hidden' 
    }}>
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
}