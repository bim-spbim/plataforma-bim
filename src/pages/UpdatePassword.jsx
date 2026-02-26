import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

// A MÁGICA ESTÁ AQUI: "export default" é obrigatório!
export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("A senha deve ter no mínimo 6 caracteres!");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      alert("Erro ao atualizar senha: " + error.message);
    } else {
      alert("✅ Senha atualizada com sucesso! Guarde-a em um local seguro.");
      navigate('/home'); 
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div style={{ background: 'white', padding: '50px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        <div style={{ background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 20px auto', boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        
        <h2 style={{ margin: '0 0 10px 0', color: '#1a1a2e', fontSize: '24px' }}>Criar Nova Senha</h2>
        <p style={{ margin: '0 0 30px 0', color: '#8892b0', fontSize: '15px' }}>
          Digite sua nova senha de acesso abaixo.
        </p>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input 
            type="password" 
            placeholder="Nova senha (mín. 6 caracteres)" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            required 
            style={{ padding: '15px', backgroundColor: '#f5f7f9', border: 'none', borderRadius: '8px', fontSize: '15px', outline: 'none', color: '#333', width: '100%', boxSizing: 'border-box' }}
          />
          <button type="submit" disabled={loading} style={{ padding: '15px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)', transition: 'transform 0.1s' }}>
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}