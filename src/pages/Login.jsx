import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Controla se o usuário quer fazer Login ou Criar Conta
  const [isLogin, setIsLogin] = useState(true); 
  
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Fluxo de Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Se deu certo, manda pra Home!
        navigate('/home');
      } else {
        // Fluxo de Registo (Criar Conta)
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        alert('Conta criada com sucesso! Redirecionando...');
        navigate('/home');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1>{isLogin ? 'Entrar' : 'Criar Conta'}</h1>
      <p>Plataforma BIM - Gestão de Obras</p>

      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Seu e-mail" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <input 
          type="password" 
          placeholder="Sua senha (mín. 6 caracteres)" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', fontSize: '16px' }}
        />
        
        {error && <div style={{ color: 'red', fontSize: '14px' }}>Erro: {error}</div>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none' }}
        >
          {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Registrar')}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={() => setIsLogin(!isLogin)}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isLogin ? 'Não tem conta? Crie uma aqui.' : 'Já tem conta? Faça login.'}
        </button>
      </div>
    </div>
  );
}