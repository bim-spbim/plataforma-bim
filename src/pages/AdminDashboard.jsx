import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../services/logger';

// --- Ícones Minimalistas ---
const DashboardIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const ActivityIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
const UsersIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const BackIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview'); 

  const [logs, setLogs] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [stats, setStats] = useState({ totalProjects: 0, totalLogs: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Permissões
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [newRole, setNewRole] = useState('user');

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('spbim_theme') === 'dark');
  
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDarkMode(localStorage.getItem('spbim_theme') === 'dark'));
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user && user.email !== 'bim@spbim.com.br') {
      navigate('/home');
      return;
    }

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const { data: logData } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (logData) setLogs(logData);

        const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (usersData) setSystemUsers(usersData);

        const { count: projCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        
        setStats({
          totalProjects: projCount || 0,
          totalLogs: logData ? logData.length : 0,
          totalUsers: usersData ? usersData.length : 0
        });
      } catch (err) {
        console.error("Erro geral no painel Admin:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchAdminData();
  }, [user, navigate]);

  // --- FUNÇÕES DE GESTÃO DE USUÁRIOS ---

  // 1. Abre o Modal para alterar o nível de acesso
  const openEditRoleModal = (u) => {
    setUserToEdit(u);
    setNewRole(u.role || 'user'); // Se não tiver role no banco, assume 'user'
    setIsEditRoleModalOpen(true);
  };

  // 2. Salva o novo nível de acesso no banco
  const handleSaveRole = async (e) => {
    e.preventDefault();
    const email = userToEdit.email || userToEdit.user_email;

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userToEdit.id);
    
    if (!error) {
      setSystemUsers(systemUsers.map(u => u.id === userToEdit.id ? { ...u, role: newRole } : u));
      await logAction(user.email, 'ALTERAÇÃO DE ACESSO', `Alterou a permissão de ${email} para "${newRole}"`);
      setIsEditRoleModalOpen(false);
      setUserToEdit(null);
    } else {
      alert("Erro ao alterar tipo de usuário: " + error.message);
    }
  };

  // 3. Exclui o usuário da plataforma
  const handleDeleteUser = async (id, email) => {
    const isConfirmed = window.confirm(`⚠️ ATENÇÃO: Tem certeza que deseja excluir o usuário ${email} do sistema?\nEle perderá acesso a todos os projetos imediatamente.`);
    if (!isConfirmed) return;

    await supabase.from('project_members').delete().eq('user_email', email);
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (!error) {
      setSystemUsers(systemUsers.filter(u => u.id !== id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      await logAction(user.email, 'EXCLUSÃO DE USUÁRIO', `Excluiu o usuário ${email} e revogou seus acessos.`);
    } else {
      alert("Erro ao excluir perfil: " + error.message);
    }
  };

  // Funções Auxiliares de Visualização
  const formatRoleName = (role) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Administrador';
    return 'Usuário Padrão';
  };

  const getRoleColor = (role) => {
    if (role === 'super_admin') return { bg: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }; // Vermelho
    if (role === 'admin') return { bg: 'rgba(111, 66, 193, 0.1)', color: '#6f42c1' }; // Roxo
    return { bg: isDarkMode ? '#2a2a40' : '#f0f4f8', color: isDarkMode ? '#8892b0' : '#666666' }; // Cinza
  };

  const bgMain = isDarkMode ? '#121212' : '#f4f7f6';
  const bgSidebar = isDarkMode ? '#1a1a2e' : '#ffffff';
  const cardBg = isDarkMode ? '#1e1e2f' : '#ffffff';
  const textPrimary = isDarkMode ? '#ffffff' : '#1a1a2e';
  const textSecondary = isDarkMode ? '#8892b0' : '#666666';
  const border = isDarkMode ? '1px solid #2a2a40' : '1px solid #eaeaea';
  const themeColor = '#1a3a5f'; 
  const activeSidebarBg = isDarkMode ? '#232336' : '#eaf0f6'; 
  const hoverBg = isDarkMode ? '#2a2a40' : '#f0f4f8';
  const inputBg = isDarkMode ? '#232336' : '#f5f7f9';

  const renderSidebarButton = (id, icon, label) => {
    const isActive = activeTab === id;
    return (
      <button 
        key={id}
        onClick={() => setActiveTab(id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '15px', padding: '18px 25px', 
          background: isActive ? activeSidebarBg : 'transparent',
          color: isActive ? themeColor : textSecondary,
          border: 'none', borderRadius: '0', cursor: 'pointer', fontSize: '15px', fontWeight: isActive ? 'bold' : '500',
          transition: 'background-color 0.2s', textAlign: 'left',
          borderLeft: isActive ? `4px solid ${themeColor}` : '4px solid transparent'
        }}
        onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = hoverBg)}
        onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {icon} {label}
      </button>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: textPrimary, minHeight: '100vh', backgroundColor: bgMain }}>Carregando Painel Admin...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: bgMain, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR MINIMALISTA */}
      <div style={{ width: '260px', backgroundColor: bgSidebar, borderRight: border, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginTop: '30px' }}>
          {renderSidebarButton('overview', <DashboardIcon />, 'Visão Geral')}
          {renderSidebarButton('users', <UsersIcon />, 'Gestão de Usuários')}
          {renderSidebarButton('logs', <ActivityIcon />, 'Auditoria (Logs)')}
        </div>

        <div style={{ borderTop: border }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: textSecondary, textDecoration: 'none', fontSize: '15px', fontWeight: '500', padding: '20px 25px', transition: 'background-color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hoverBg} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor='transparent'}>
            <BackIcon /> Sair do Admin
          </Link>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div style={{ flex: 1, padding: '50px 60px', overflowY: 'auto' }}>
        
        {/* VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div>
            <h1 style={{ margin: '0 0 40px 0', color: textPrimary, fontSize: '32px' }}>Visão Geral</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px' }}>
              <div style={{ background: cardBg, border: border, borderRadius: '12px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ background: 'rgba(26, 58, 95, 0.1)', color: themeColor, padding: '12px', borderRadius: '10px' }}><DashboardIcon /></div>
                  <h3 style={{ margin: 0, color: textSecondary, fontSize: '15px', fontWeight: '500' }}>Total de Projetos</h3>
                </div>
                <p style={{ margin: 0, fontSize: '42px', fontWeight: 'bold', color: textPrimary }}>{stats?.totalProjects || 0}</p>
              </div>

              <div style={{ background: cardBg, border: border, borderRadius: '12px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ background: 'rgba(111, 66, 193, 0.1)', color: '#6f42c1', padding: '12px', borderRadius: '10px' }}><UsersIcon /></div>
                  <h3 style={{ margin: 0, color: textSecondary, fontSize: '15px', fontWeight: '500' }}>Usuários Cadastrados</h3>
                </div>
                <p style={{ margin: 0, fontSize: '42px', fontWeight: 'bold', color: textPrimary }}>{stats?.totalUsers || 0}</p>
              </div>

              <div style={{ background: cardBg, border: border, borderRadius: '12px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', padding: '12px', borderRadius: '10px' }}><ActivityIcon /></div>
                  <h3 style={{ margin: 0, color: textSecondary, fontSize: '15px', fontWeight: '500' }}>Ações Registradas</h3>
                </div>
                <p style={{ margin: 0, fontSize: '42px', fontWeight: 'bold', color: textPrimary }}>{stats?.totalLogs || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* GESTÃO DE USUÁRIOS */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h1 style={{ margin: 0, color: textPrimary, fontSize: '32px' }}>Gestão de Usuários</h1>
            </div>

            <div style={{ background: cardBg, border: border, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: isDarkMode ? '#232336' : '#f8fafc', borderBottom: border }}>
                    <th style={{ padding: '18px 25px', color: textSecondary, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Data de Cadastro</th>
                    <th style={{ padding: '18px 25px', color: textSecondary, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>E-mail</th>
                    <th style={{ padding: '18px 25px', color: textSecondary, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nível de Acesso</th>
                    <th style={{ padding: '18px 25px', color: textSecondary, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {systemUsers?.length > 0 ? (
                    systemUsers.map((u) => {
                      const roleStyle = getRoleColor(u.role || 'user');
                      return (
                        <tr key={u.id} style={{ borderBottom: border, transition: 'background-color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hoverBg} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor='transparent'}>
                          <td style={{ padding: '18px 25px', color: textSecondary, fontSize: '14px', whiteSpace: 'nowrap' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td style={{ padding: '18px 25px', color: textPrimary, fontSize: '14px', fontWeight: '500' }}>
                            {u.email || u.user_email || 'E-mail não registrado'}
                          </td>
                          <td style={{ padding: '18px 25px' }}>
                            <span style={{ background: roleStyle.bg, color: roleStyle.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                              {formatRoleName(u.role || 'user')}
                            </span>
                          </td>
                          <td style={{ padding: '18px 25px', display: 'flex', gap: '15px' }}>
                            <button onClick={() => openEditRoleModal(u)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} title="Alterar Tipo de Usuário" onMouseEnter={(e)=>e.currentTarget.style.color=themeColor} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}>
                              <EditIcon />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id, u.email || u.user_email)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} title="Revogar Acesso e Excluir" onMouseEnter={(e)=>e.currentTarget.style.color='#e63946'} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}>
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: textSecondary }}>
                        Nenhum usuário encontrado na tabela.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDITORIA (LOGS) */}
        {activeTab === 'logs' && (
          <div>
            <h1 style={{ margin: '0 0 30px 0', color: textPrimary, fontSize: '32px' }}>Auditoria do Sistema</h1>
            <div style={{ background: cardBg, border: border, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: isDarkMode ? '#232336' : '#f8fafc', borderBottom: border }}>
                    <th style={{ padding: '18px 25px', color: textSecondary, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Data / Hora</th>
                    <th style={{ padding: '18px 25px', color: textSecondary, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Usuário</th>
                    <th style={{ padding: '18px 25px', color: textSecondary, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Ação</th>
                    <th style={{ padding: '18px 25px', color: textSecondary, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: border, transition: 'background-color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hoverBg} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor='transparent'}>
                        <td style={{ padding: '18px 25px', color: textPrimary, fontSize: '14px', whiteSpace: 'nowrap' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td style={{ padding: '18px 25px', color: textPrimary, fontSize: '14px', fontWeight: '500' }}>
                          {log.user_email}
                        </td>
                        <td style={{ padding: '18px 25px' }}>
                          <span style={{ background: isDarkMode ? '#2a2a40' : '#f0f4f8', color: themeColor, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '18px 25px', color: textSecondary, fontSize: '14px' }}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: textSecondary }}>
                        Nenhum log registrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL DE EDIÇÃO DE ROLE --- */}
      {isEditRoleModalOpen && userToEdit && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10003, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: cardBg, padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: border, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <h3 style={{ color: textPrimary, margin: '0 0 5px 0', fontSize: '20px' }}>Alterar Nível de Acesso</h3>
                <p style={{ margin: '0 0 20px 0', color: textSecondary, fontSize: '14px' }}>{userToEdit.email || userToEdit.user_email}</p>
                
                <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label style={{ color: textPrimary, fontSize: '13px', marginBottom: '-10px', fontWeight: 'bold' }}>Permissão do Sistema</label>
                    <select 
                      value={newRole} 
                      onChange={(e)=>setNewRole(e.target.value)} 
                      style={{ padding: '12px', background: inputBg, color: textPrimary, border: 'none', borderRadius: '8px', outline: 'none', fontSize: '14px', cursor: 'pointer' }}
                    >
                        <option value="user">Usuário Padrão</option>
                        <option value="admin">Administrador</option>
                        <option value="super_admin">Super Admin</option>
                    </select>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button type="button" onClick={()=>setIsEditRoleModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: textSecondary, border: border, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                        <button type="submit" style={{ flex: 1, padding: '12px', background: themeColor, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Alteração</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}