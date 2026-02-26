import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../services/logger';

// --- ÍCONES MINIMALISTAS (SVG) ---
const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

export default function Home() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Controle de Tema (Claro/Escuro)
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('spbim_theme') === 'dark');

  useEffect(() => {
    // "Olheiro" que avisa a Home se a Navbar mudou a cor do fundo do site
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('spbim_theme') === 'dark');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: myProjects } = await supabase.from('projects').select('*').eq('user_id', user.id);
      const { data: memberData } = await supabase.from('project_members').select('project_id').eq('user_email', user.email);
      
      const sharedProjectIds = memberData?.map(m => m.project_id) || [];
      let sharedProjects = [];
      if (sharedProjectIds.length > 0) {
        const { data: shared } = await supabase.from('projects').select('*').in('id', sharedProjectIds);
        sharedProjects = shared || [];
      }

      const allProjects = [...(myProjects || []), ...sharedProjects];
      const uniqueProjects = Array.from(new Map(allProjects.map(item => [item.id, item])).values());
      uniqueProjects.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      setProjects(uniqueProjects);
    };
    fetchProjects();
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName) return;
    const { data } = await supabase.from('projects').insert([{ name: projectName, user_id: user.id, floor_plan_url: 'multistorey' }]).select();
    if (data) { 
      setProjects([data[0], ...projects]); 
      await logAction(user.email, 'CRIAÇÃO DE PROJETO', `Criou o projeto: ${projectName}`);
      setProjectName(''); 
      setShowForm(false); 
    }
  };

  const handleEditProject = async (id, currentName) => {
    const newName = window.prompt("Digite o novo nome do projeto:", currentName);
    if (!newName || newName === currentName) return;
    const { error } = await supabase.from('projects').update({ name: newName }).eq('id', id);
    if (!error) {
      setProjects(projects.map(p => p.id === id ? { ...p, name: newName } : p));
      await logAction(user.email, 'EDIÇÃO DE PROJETO', `Renomeou o projeto de "${currentName}" para "${newName}"`);
    }
  };

  const handleDeleteProject = async (id, projectName) => {
    const isConfirmed = window.confirm(`⚠️ ATENÇÃO!\nTem certeza que deseja apagar o projeto "${projectName}" e tudo dentro dele?`);
    if (!isConfirmed) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects(projects.filter(p => p.id !== id));
      await logAction(user.email, 'EXCLUSÃO DE PROJETO', `Apagou o projeto: ${projectName}`);
    }
  };

  // Cores dinâmicas e minimalistas
  const textPrimary = isDarkMode ? '#ffffff' : '#1a1a2e';
  const textSecondary = isDarkMode ? '#8892b0' : '#666666';
  const cardBg = isDarkMode ? '#1e1e2f' : '#ffffff';
  const cardBorder = isDarkMode ? '1px solid #2a2a40' : '1px solid #eaeaea';
  const inputBg = isDarkMode ? '#232336' : '#f5f7f9';
  const gradient = 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)';

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: textPrimary, fontSize: '28px', fontWeight: 'bold' }}>Meus Projetos</h1>
          <p style={{ margin: 0, color: textSecondary, fontSize: '15px' }}>Gerencie suas obras e escaneamentos BIM.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={{ padding: '12px 24px', background: showForm ? 'transparent' : gradient, color: showForm ? textSecondary : 'white', border: showForm ? `1px solid ${textSecondary}` : 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '14px' }}
        >
          {showForm ? 'Cancelar' : '+ Novo Projeto'}
        </button>
      </div>

      {/* FORMULÁRIO MINIMALISTA */}
      {showForm && (
        <form onSubmit={handleCreateProject} style={{ marginBottom: '40px', padding: '25px', background: cardBg, borderRadius: '12px', border: cardBorder, display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Nome do Novo Projeto" 
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)} 
            required 
            style={{ padding: '14px', flex: 1, border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', fontSize: '15px', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '14px 24px', background: textPrimary, color: cardBg, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            Criar
          </button>
        </form>
      )}

      {/* GRADE DE PROJETOS MINIMALISTA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {projects.map(proj => (
          <div key={proj.id} style={{ background: cardBg, borderRadius: '12px', padding: '24px', border: cardBorder, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
               onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: textPrimary, fontSize: '18px', fontWeight: '600', paddingRight: '15px', wordBreak: 'break-word' }}>{proj.name}</h3>
              
              {/* ÍCONES MINIMALISTAS (SVGs) ALINHADOS À DIREITA */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                <button 
                  onClick={() => handleEditProject(proj.id, proj.name)} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0, transition: 'color 0.2s', display: 'flex' }} 
                  title="Editar Nome"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#00d2ff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = textSecondary}
                >
                  <EditIcon />
                </button>
                <button 
                  onClick={() => handleDeleteProject(proj.id, proj.name)} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0, transition: 'color 0.2s', display: 'flex' }} 
                  title="Apagar Projeto"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e63946'}
                  onMouseLeave={(e) => e.currentTarget.style.color = textSecondary}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: textSecondary }}>
              Criado em: {new Date(proj.created_at).toLocaleDateString('pt-BR')}
            </p>

            {/* Botão de Acesso Discreto */}
            <Link to={`/projeto/${proj.id}`} style={{ marginTop: 'auto', background: inputBg, color: textPrimary, padding: '12px', textAlign: 'center', textDecoration: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#2a2a40' : '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = inputBg}>
              Abrir Projeto ➔
            </Link>
          </div>
        ))}

        {projects.length === 0 && !showForm && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: cardBg, border: cardBorder, borderRadius: '12px' }}>
            <p style={{ color: textSecondary, margin: 0 }}>Nenhum projeto encontrado. Comece criando um novo!</p>
          </div>
        )}
      </div>
    </div>
  );
}