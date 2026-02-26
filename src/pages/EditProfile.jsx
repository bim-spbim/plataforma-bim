import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../services/logger';

// --- Ícones Minimalistas ---
const BackIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const MoonIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const SunIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Estado do Tema (Lê o LocalStorage para saber como iniciar)
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('spbim_theme') === 'dark');

  useEffect(() => {
    if (user) setEmail(user.email);
    
    // Observador para o caso do tema mudar enquanto a página tá aberta
    const observer = new MutationObserver(() => setIsDarkMode(localStorage.getItem('spbim_theme') === 'dark'));
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [user]);

  // --- FUNÇÕES DE ATUALIZAÇÃO ---
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!email || email === user.email) return;

    const isConfirmed = window.confirm(`ATENÇÃO: Ao trocar de e-mail, o Supabase enviará um link de confirmação para o NOVO e-mail e para o ANTIGO.\n\nVocê precisa confirmar em ambos para a troca ser efetivada. Deseja continuar?`);
    if (!isConfirmed) return;

    setLoadingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: email });
    setLoadingEmail(false);

    if (error) {
      alert("Erro ao atualizar e-mail: " + error.message);
    } else {
      await logAction(user.email, 'ALTERAÇÃO DE PERFIL', `Solicitou troca de e-mail para ${email}`);
      alert("✅ Solicitação enviada! Verifique a caixa de entrada dos dois e-mails para confirmar a troca.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");

    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoadingPassword(false);

    if (error) {
      alert("Erro ao atualizar senha: " + error.message);
    } else {
      await logAction(user.email, 'ALTERAÇÃO DE PERFIL', `Atualizou a senha de acesso.`);
      alert("✅ Senha atualizada com sucesso!");
      setNewPassword('');
    }
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    localStorage.setItem('spbim_theme', newTheme);
    // Aplica no body na hora para forçar o sistema todo a ler
    document.body.style.backgroundColor = newTheme === 'dark' ? '#121212' : '#f4f7f6';
    setIsDarkMode(newTheme === 'dark');
  };

  // Cores do Tema
  const bgMain = isDarkMode ? '#121212' : '#f4f7f6';
  const cardBg = isDarkMode ? '#1e1e2f' : '#ffffff';
  const textPrimary = isDarkMode ? '#ffffff' : '#1a1a2e';
  const textSecondary = isDarkMode ? '#8892b0' : '#666666';
  const border = isDarkMode ? '1px solid #2a2a40' : '1px solid #eaeaea';
  const inputBg = isDarkMode ? '#232336' : '#f5f7f9';
  const themeColor = '#1a3a5f'; 

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgMain, padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <Link to="/home" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: textSecondary, textDecoration: 'none', fontSize: '15px', fontWeight: '500', marginBottom: '30px', transition: 'color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.color=themeColor} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}>
          <BackIcon /> Voltar à Plataforma
        </Link>

        <h1 style={{ margin: '0 0 10px 0', color: textPrimary, fontSize: '32px' }}>Configurações de Conta</h1>
        <p style={{ margin: '0 0 40px 0', color: textSecondary, fontSize: '15px' }}>Gerencie suas credenciais de acesso e preferências.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* CARTÃO 1: E-MAIL */}
          <div style={{ background: cardBg, border: border, borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: isDarkMode ? '#2a2a40' : '#f0f4f8', color: textPrimary, padding: '10px', borderRadius: '10px' }}><UserIcon /></div>
              <h2 style={{ margin: 0, color: textPrimary, fontSize: '20px' }}>E-mail de Acesso</h2>
            </div>
            <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '14px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={loadingEmail || email === user?.email} style={{ padding: '12px 24px', background: themeColor, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: email === user?.email ? 'not-allowed' : 'pointer', opacity: email === user?.email ? 0.5 : 1 }}>
                  {loadingEmail ? 'Processando...' : 'Alterar E-mail'}
                </button>
              </div>
            </form>
          </div>

          {/* CARTÃO 2: SENHA */}
          <div style={{ background: cardBg, border: border, borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: isDarkMode ? '#2a2a40' : '#f0f4f8', color: textPrimary, padding: '10px', borderRadius: '10px' }}><LockIcon /></div>
              <h2 style={{ margin: 0, color: textPrimary, fontSize: '20px' }}>Segurança (Senha)</h2>
            </div>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="password" 
                placeholder="Digite a nova senha (mínimo 6 caracteres)"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '14px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={loadingPassword || !newPassword} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: !newPassword ? 'not-allowed' : 'pointer', opacity: !newPassword ? 0.5 : 1, boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)' }}>
                  {loadingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>

          {/* CARTÃO 3: PREFERÊNCIAS (TEMA) */}
          <div style={{ background: cardBg, border: border, borderRadius: '16px', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: isDarkMode ? '#2a2a40' : '#f0f4f8', color: textPrimary, padding: '10px', borderRadius: '10px' }}>
                {isDarkMode ? <MoonIcon /> : <SunIcon />}
              </div>
              <div>
                <h2 style={{ margin: 0, color: textPrimary, fontSize: '18px' }}>Aparência do Sistema</h2>
                <p style={{ margin: '4px 0 0 0', color: textSecondary, fontSize: '13px' }}>Forçar o Modo {isDarkMode ? 'Claro' : 'Escuro'} no seu navegador.</p>
              </div>
            </div>
            
            <button onClick={toggleTheme} style={{ padding: '10px 20px', background: inputBg, color: textPrimary, border: border, borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Trocar Tema
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}