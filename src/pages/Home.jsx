import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- Ícones Minimalistas ---
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const FolderIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;

export default function Home() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Estados do Modal de CRIAR Projeto ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState('Em andamento');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // --- Estados do Modal de EDITAR Projeto ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectClient, setEditProjectClient] = useState('');
  const [editProjectAddress, setEditProjectAddress] = useState('');
  const [editProjectStatus, setEditProjectStatus] = useState('Em andamento');
  const [editProjectStartDate, setEditProjectStartDate] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('spbim_theme') === 'dark');

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDarkMode(localStorage.getItem('spbim_theme') === 'dark'));
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    setIsLoading(true);
    
    // Busca os projetos onde o usuário é dono
    const { data: ownedProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Busca os projetos onde o usuário é convidado
    const { data: memberLinks } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_email', user.email);

    let invitedProjects = [];
    if (memberLinks && memberLinks.length > 0) {
      const projectIds = memberLinks.map(link => link.project_id);
      const { data: shared } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false });
      if (shared) invitedProjects = shared;
    }

    // Une os dois sem duplicatas
    const allProjectsMap = new Map();
    [...(ownedProjects || []), ...invitedProjects].forEach(p => allProjectsMap.set(p.id, p));
    
    setProjects(Array.from(allProjectsMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setIsLoading(false);
  };

  // --- FUNÇÃO DE CRIAR ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName) return alert("O nome do projeto é obrigatório.");
    setIsCreating(true);

    try {
      const { data, error } = await supabase.from('projects').insert([{
        name: newProjectName,
        user_id: user.id,
        client_name: newProjectClient,
        address: newProjectAddress,
        status: newProjectStatus,
        start_date: newProjectStartDate || null,
        description: newProjectDescription
      }]).select();

      if (error) throw error;

      setProjects([data[0], ...projects]);
      
      // Reseta os campos e fecha
      setNewProjectName(''); setNewProjectClient(''); setNewProjectAddress('');
      setNewProjectStatus('Em andamento'); setNewProjectStartDate(''); setNewProjectDescription('');
      setIsCreateModalOpen(false);
    } catch (error) {
      alert("Erro ao criar projeto: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // --- FUNÇÕES DE EDITAR ---
  const openEditModal = (project, e) => {
    e.preventDefault(); // Previne de clicar no link do projeto acidentalmente
    e.stopPropagation();
    setProjectToEdit(project);
    setEditProjectName(project.name || '');
    setEditProjectClient(project.client_name || '');
    setEditProjectAddress(project.address || '');
    setEditProjectStatus(project.status || 'Em andamento');
    setEditProjectStartDate(project.start_date || '');
    setEditProjectDescription(project.description || '');
    setIsEditModalOpen(true);
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    if (!editProjectName) return alert("O nome do projeto é obrigatório.");
    setIsEditing(true);

    try {
      const { error } = await supabase.from('projects').update({
        name: editProjectName,
        client_name: editProjectClient,
        address: editProjectAddress,
        status: editProjectStatus,
        start_date: editProjectStartDate || null,
        description: editProjectDescription
      }).eq('id', projectToEdit.id);

      if (error) throw error;

      // Atualiza a lista na tela
      setProjects(projects.map(p => p.id === projectToEdit.id ? {
        ...p,
        name: editProjectName,
        client_name: editProjectClient,
        address: editProjectAddress,
        status: editProjectStatus,
        start_date: editProjectStartDate || null,
        description: editProjectDescription
      } : p));

      setIsEditModalOpen(false);
      setProjectToEdit(null);
    } catch (error) {
      alert("Erro ao salvar projeto: " + error.message);
    } finally {
      setIsEditing(false);
    }
  };

  // --- FUNÇÃO DE DELETAR ---
  const handleDeleteProject = async (projectId, projectName, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`⚠️ Apagar o projeto "${projectName}" e TUDO que há nele? (Esta ação não pode ser desfeita)`)) return;
    
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (!error) {
      setProjects(projects.filter(p => p.id !== projectId));
    } else {
      alert("Erro ao apagar projeto.");
    }
  };

  const textPrimary = isDarkMode ? '#ffffff' : '#1a1a2e';
  const textSecondary = isDarkMode ? '#8892b0' : '#666666';
  const cardBg = isDarkMode ? '#1e1e2f' : '#ffffff';
  const cardBorder = isDarkMode ? '1px solid #2a2a40' : '1px solid #eaeaea';
  const inputBg = isDarkMode ? '#232336' : '#f5f7f9';

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '32px', fontWeight: 'bold' }}>Seus Projetos</h1>
          <p style={{ margin: 0, color: textSecondary, fontSize: '15px' }}>Gerencie suas obras e mapeamentos.</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <PlusIcon /> Novo Projeto
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: textSecondary }}>Carregando projetos...</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: cardBg, border: cardBorder, borderRadius: '16px' }}>
          <FolderIcon style={{ width: '48px', height: '48px', color: textSecondary, marginBottom: '15px', opacity: 0.5 }} />
          <h2 style={{ color: textPrimary, margin: '0 0 10px 0' }}>Nenhum projeto encontrado</h2>
          <p style={{ color: textSecondary, margin: '0 0 20px 0' }}>Você ainda não tem obras cadastradas.</p>
          <button onClick={() => setIsCreateModalOpen(true)} style={{ padding: '10px 20px', background: '#00d2ff20', color: '#00d2ff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Criar meu primeiro projeto</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
          {projects.map(project => {
            const isOwner = user.id === project.user_id;

            return (
              <Link 
                to={`/dashboard/${project.id}`} 
                key={project.id} 
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{ background: cardBg, borderRadius: '16px', border: cardBorder, padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; }}>
                  
                  {/* Badge de Status e Botões de Ação */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ background: project.status === 'Concluído' ? '#10b98120' : (project.status === 'Pausado' ? '#e6394620' : '#00d2ff20'), color: project.status === 'Concluído' ? '#10b981' : (project.status === 'Pausado' ? '#e63946' : '#00d2ff'), padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px' }}>
                      {project.status || 'Em andamento'}
                    </span>
                    
                    {isOwner && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={(e) => openEditModal(project, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: '4px' }} title="Editar Ficha" onMouseEnter={(e) => e.currentTarget.style.color = '#00d2ff'} onMouseLeave={(e) => e.currentTarget.style.color = textSecondary}><EditIcon /></button>
                        <button onClick={(e) => handleDeleteProject(project.id, project.name, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: '4px' }} title="Apagar Obra" onMouseEnter={(e) => e.currentTarget.style.color = '#e63946'} onMouseLeave={(e) => e.currentTarget.style.color = textSecondary}><TrashIcon /></button>
                      </div>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', color: textPrimary, fontSize: '20px', fontWeight: 'bold' }}>{project.name}</h3>
                  
                  {project.client_name && (
                    <p style={{ margin: '0 0 15px 0', color: textSecondary, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Cliente: <strong style={{ color: textPrimary }}>{project.client_name}</strong>
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: cardBorder, paddingTop: '15px', marginTop: '15px' }}>
                     {!isOwner && <span style={{ fontSize: '11px', background: '#6f42c120', color: '#6f42c1', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Convidado</span>}
                     <span style={{ fontSize: '12px', color: textSecondary, marginLeft: isOwner ? '0' : 'auto' }}>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL DE CRIAR NOVO PROJETO                                       */}
      {/* ================================================================= */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ background: cardBg, width: '100%', maxWidth: '600px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', border: cardBorder, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <div>
                      <h2 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '22px' }}>Criar Novo Projeto</h2>
                      <p style={{ margin: 0, color: textSecondary, fontSize: '14px' }}>Preencha a ficha cadastral da obra.</p>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: 0 }}><CloseIcon /></button>
                </div>

                <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Nome da Obra *</label>
                            <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Status</label>
                            <select value={newProjectStatus} onChange={(e) => setNewProjectStatus(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
                                <option value="Em andamento">Em andamento</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Pausado">Pausado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Cliente ou Construtora</label>
                        <input type="text" placeholder="Ex: Engenharia SA" value={newProjectClient} onChange={(e) => setNewProjectClient(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Endereço Completo</label>
                        <input type="text" placeholder="Ex: Av. Paulista, 1000 - SP" value={newProjectAddress} onChange={(e) => setNewProjectAddress(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Data de Início</label>
                        <input type="date" value={newProjectStartDate} onChange={(e) => setNewProjectStartDate(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textSecondary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Descrição / Notas do Projeto</label>
                        <textarea placeholder="Informações adicionais da obra..." value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>

                    <button type="submit" disabled={isCreating} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isCreating ? 'not-allowed' : 'pointer', fontSize: '16px', marginTop: '10px', opacity: isCreating ? 0.7 : 1 }}>
                        {isCreating ? 'Criando Projeto...' : 'Criar Projeto'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL DE EDITAR PROJETO                                           */}
      {/* ================================================================= */}
      {isEditModalOpen && projectToEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ background: cardBg, width: '100%', maxWidth: '600px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', border: cardBorder, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <div>
                      <h2 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '22px' }}>Editar Ficha Cadastral</h2>
                      <p style={{ margin: 0, color: textSecondary, fontSize: '14px' }}>Atualize as informações da obra.</p>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); setIsEditModalOpen(false); }} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: 0 }}><CloseIcon /></button>
                </div>

                <form onSubmit={handleEditProject} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Nome da Obra *</label>
                            <input type="text" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Status</label>
                            <select value={editProjectStatus} onChange={(e) => setEditProjectStatus(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
                                <option value="Em andamento">Em andamento</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Pausado">Pausado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Cliente ou Construtora</label>
                        <input type="text" placeholder="Ex: Engenharia SA" value={editProjectClient} onChange={(e) => setEditProjectClient(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Endereço Completo</label>
                        <input type="text" placeholder="Ex: Av. Paulista, 1000 - SP" value={editProjectAddress} onChange={(e) => setEditProjectAddress(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Data de Início</label>
                        <input type="date" value={editProjectStartDate} onChange={(e) => setEditProjectStartDate(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textSecondary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Descrição / Notas do Projeto</label>
                        <textarea placeholder="Informações adicionais da obra..." value={editProjectDescription} onChange={(e) => setEditProjectDescription(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>

                    <button type="submit" disabled={isEditing} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isEditing ? 'not-allowed' : 'pointer', fontSize: '16px', marginTop: '10px', opacity: isEditing ? 0.7 : 1 }}>
                        {isEditing ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}