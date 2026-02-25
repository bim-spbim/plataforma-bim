import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (data) setProjects(data);
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName) return;
    
    // Cria apenas o nome do projeto (a planta será adicionada lá dentro)
    const { data } = await supabase.from('projects')
      .insert([{ name: projectName, user_id: user.id, floor_plan_url: 'multistorey' }]) // floor_plan_url mantido só para não quebrar tabelas antigas
      .select();

    if (data) {
      setProjects([data[0], ...projects]);
      setProjectName('');
      setShowForm(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Meus Projetos</h1>
        <button onClick={() => { supabase.auth.signOut(); navigate('/'); }}>Sair</button>
      </div>
      
      <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', marginBottom: '20px', cursor: 'pointer' }}>
        {showForm ? 'Cancelar' : '+ Novo Projeto'}
      </button>

      {showForm && (
        <form onSubmit={handleCreateProject} style={{ marginBottom: '20px', padding: '15px', background: '#f1f1f1' }}>
          <input type="text" placeholder="Nome do Projeto" value={projectName} onChange={(e) => setProjectName(e.target.value)} required style={{ padding: '8px', marginRight: '10px' }}/>
          <button type="submit" style={{ padding: '8px 15px', background: '#007bff', color: 'white', border: 'none' }}>Criar</button>
        </form>
      )}

      {projects.map(proj => (
        <div key={proj.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <h3>{proj.name}</h3>
          <Link to={`/projeto/${proj.id}`} style={{ background: '#007bff', color: 'white', padding: '10px', textDecoration: 'none' }}>Acessar Projeto ➔</Link>
        </div>
      ))}
    </div>
  );
}