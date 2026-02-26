import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

// Mini Logo SVG para a Navbar
const NavCloudLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="nav_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#6f42c1', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#00d2ff', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M18.5 10C18.5 6.68629 15.8137 4 12.5 4C9.64275 4 7.25464 6.03857 6.65097 8.73025C4.55136 9.11363 3 10.948 3 13.125C3 15.5412 4.95875 17.5 7.375 17.5H17.875C20.0151 17.5 21.75 15.7651 21.75 13.625C21.75 11.6631 20.2873 10.0412 18.3935 10.0037C18.4287 9.99875 18.4642 9.99625 18.5 10Z" fill="url(#nav_gradient)" />
  </svg>
);

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ⚠️ SEU E-MAIL DE ADMIN AQUI
  const ADMIN_EMAIL = 'bim@spbim.com.br';

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'US';

  useEffect(() => {
    const savedTheme = localStorage.getItem('spbim_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.style.backgroundColor = '#121212';
    } else {
      document.body.style.backgroundColor = '#f4f7f6';
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      localStorage.setItem('spbim_theme', 'dark');
      document.body.style.backgroundColor = '#121212';
    } else {
      localStorage.setItem('spbim_theme', 'light');
      document.body.style.backgroundColor = '#f4f7f6';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navBg = isDarkMode ? '#1a1a2e' : '#ffffff';
  const navText = isDarkMode ? '#ffffff' : '#1a1a2e';
  const navBorder = isDarkMode ? '#2a2a40' : '#eaeaea';
  const dropBg = isDarkMode ? '#232336' : '#ffffff';
  const dropHover = isDarkMode ? '#2f2f47' : '#f5f7f9';

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 30px', backgroundColor: navBg, color: navText,
      borderBottom: `1px solid ${navBorder}`, position: 'sticky', top: 0, zIndex: 900,
      transition: 'all 0.3s ease'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/home" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NavCloudLogo />
          <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px' }}>
            SPBIM <span style={{ color: '#8892b0', fontWeight: '400' }}>Cloud</span>
          </span>
        </Link>
      </div>

      <div style={{ position: 'relative' }} ref={dropdownRef}>
        
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)',
            color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            boxShadow: '0 2px 8px rgba(111, 66, 193, 0.3)', transition: 'transform 0.1s'
          }}
          title={user?.email}
        >
          {userInitials}
        </button>

        {isDropdownOpen && (
          <div style={{
            position: 'absolute', top: '50px', right: 0, width: '220px',
            backgroundColor: dropBg, borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: `1px solid ${navBorder}`, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            zIndex: 1000
          }}>
            
            <div style={{ padding: '15px', borderBottom: `1px solid ${navBorder}`, wordBreak: 'break-all' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#8892b0', fontWeight: 'bold' }}>LOGADO COMO</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: '500', color: navText }}>{user?.email}</p>
            </div>

            <div style={{ padding: '8px 0' }}>
              
              {user?.email === ADMIN_EMAIL && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsDropdownOpen(false)} 
                  style={{ display: 'block', padding: '10px 20px', color: navText, textDecoration: 'none', fontSize: '14px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dropHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Painel Admin
                </Link>
              )}

              {/* Botão de Perfil ajustado para o visual do Dropdown */}
              <Link 
                to="/perfil" 
                onClick={() => setIsDropdownOpen(false)} 
                style={{ display: 'block', padding: '10px 20px', color: navText, textDecoration: 'none', fontSize: '14px' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dropHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Meu Perfil
              </Link>

              <div 
                onClick={toggleDarkMode} 
                style={{ padding: '10px 20px', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: navText }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dropHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  Modo Escuro
                </div>
                <div style={{ width: '36px', height: '20px', backgroundColor: isDarkMode ? '#00d2ff' : '#ccc', borderRadius: '15px', position: 'relative', transition: 'background-color 0.3s' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isDarkMode ? '18px' : '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

            </div>

            <div style={{ borderTop: `1px solid ${navBorder}`, padding: '8px 0' }}>
              <button 
                onClick={handleLogout} 
                style={{ width: '100%', textAlign: 'left', padding: '10px 20px', background: 'none', border: 'none', color: '#e63946', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#3a1e22' : '#ffeeee'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Sair da Plataforma
              </button>
            </div>
            
          </div>
        )}
      </div>
    </nav>
  );
}