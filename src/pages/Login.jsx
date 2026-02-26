import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

// Componente do Ícone de Nuvem com Degradê SPBIM
const CloudLogo = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '20px' }}>
    <defs>
      <linearGradient id="spbim_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#6f42c1', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#00d2ff', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M18.5 10C18.5 6.68629 15.8137 4 12.5 4C9.64275 4 7.25464 6.03857 6.65097 8.73025C4.55136 9.11363 3 10.948 3 13.125C3 15.5412 4.95875 17.5 7.375 17.5H17.875C20.0151 17.5 21.75 15.7651 21.75 13.625C21.75 11.6631 20.2873 10.0412 18.3935 10.0037C18.4287 9.99875 18.4642 9.99625 18.5 10Z" fill="url(#spbim_gradient)" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Controles de qual tela mostrar
  const [isResetMode, setIsResetMode] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false); 
  
  const navigate = useNavigate();

  const inputStyle = {
    padding: '15px', backgroundColor: '#f5f7f9', border: 'none', borderRadius: '8px',
    fontSize: '15px', outline: 'none', color: '#333', width: '100%', boxSizing: 'border-box'
  };

  const buttonStyle = {
    padding: '15px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)',
    color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600',
    cursor: 'pointer', boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)', transition: 'transform 0.1s', width: '100%'
  };

  // FUNÇÃO 1: Fazer Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/home');
    } catch (error) { 
      alert("Erro ao entrar: " + error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // FUNÇÃO 2: Criar Conta Nova
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('Conta criada com sucesso! Bem-vindo(a) ao SPBIM Cloud.');
      navigate('/home');
    } catch (error) { 
      alert("Erro ao criar conta: " + error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // FUNÇÃO 3: Recuperar Senha
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) return alert("Por favor, digite seu e-mail primeiro!");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` });
    setLoading(false);
    if (error) { alert("Erro ao enviar e-mail: " + error.message); } 
    else { alert("✅ Link de recuperação enviado! Verifique seu e-mail."); setIsResetMode(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxSizing: 'border-box', margin: 0, padding: 0 }}>
      <div style={{ background: 'white', padding: '50px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        
        <CloudLogo />

        <h2 style={{ margin: '0 0 10px 0', color: '#1a1a2e', fontSize: '28px', fontWeight: '700' }}>SPBIM Cloud</h2>
        <p style={{ margin: '0 0 40px 0', color: '#8892b0', fontSize: '15px' }}>
          {isResetMode ? "Recupere seu acesso à plataforma" : isSignUpMode ? "Crie sua conta para começar" : "Acesse seus projetos de nuvem de pontos"}
        </p>

        {isResetMode ? (
          // --- MODO: RECUPERAR SENHA ---
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="email" placeholder="Digite seu e-mail cadastrado" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle}/>
            <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'Enviando...' : 'Enviar Link Seguro'}</button>
            <button type="button" onClick={() => setIsResetMode(false)} style={{ background: 'none', border: 'none', color: '#8892b0', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>← Voltar para o Login</button>
          </form>

        ) : isSignUpMode ? (
          // --- MODO: CRIAR CONTA ---
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="email" placeholder="Seu melhor e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle}/>
            <input type="password" placeholder="Crie uma senha forte" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle}/>
            <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'Criando conta...' : 'Criar Minha Conta'}</button>
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              Já tem uma conta? <button type="button" onClick={() => setIsSignUpMode(false)} style={{ background: 'none', border: 'none', color: '#6f42c1', cursor: 'pointer', fontWeight: '600', padding: 0 }}>Entrar aqui</button>
            </div>
          </form>

        ) : (
          // --- MODO: LOGIN NORMAL ---
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle}/>
            <input type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle}/>
            <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'Entrando...' : 'Entrar na Plataforma'}</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
              <button type="button" onClick={() => setIsResetMode(true)} style={{ background: 'none', border: 'none', color: '#8892b0', cursor: 'pointer', fontSize: '13px', padding: 0 }}>Esqueceu a senha?</button>
              <button type="button" onClick={() => setIsSignUpMode(true)} style={{ background: 'none', border: 'none', color: '#6f42c1', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}>Criar conta nova</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}