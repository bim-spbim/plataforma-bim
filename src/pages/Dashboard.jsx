import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import MapViewer from '../features/map-viewer/MapViewer';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../services/logger'; 
import emailjs from '@emailjs/browser';

// --- Ícones Minimalistas (SVGs) ---
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const MailIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const UsersIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const BoxIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;

export default function Dashboard() {
  const { id } = useParams();
  const { user } = useAuth(); 
  
  const [project, setProject] = useState(null);
  const [floorPlans, setFloorPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  
  const [targetCount, setTargetCount] = useState(0);
  const [projectMembers, setProjectMembers] = useState([]);
  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);

  // --- Estados da Nova Planta ---
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [ifcFile, setIfcFile] = useState(null); // Agora é o ARQUIVO IFC
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  
  // --- Estados da Edição de Planta ---
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editIfcFile, setEditIfcFile] = useState(null); // Agora é o ARQUIVO IFC
  const [isEditing, setIsEditing] = useState(false); 

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('spbim_theme') === 'dark');

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDarkMode(localStorage.getItem('spbim_theme') === 'dark'));
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadProjectData = async () => {
      const { data: projData } = await supabase.from('projects').select('*').eq('id', id).single();
      if (projData) setProject(projData);

      const { data: plansData } = await supabase.from('floor_plans').select('*').eq('project_id', id).order('created_at', { ascending: false });
      if (plansData) setFloorPlans(plansData);

      const { count: tCount } = await supabase.from('targets').select('*', { count: 'exact', head: true }).eq('project_id', id);
      setTargetCount(tCount || 0);

      const { data: membersData } = await supabase.from('project_members').select('*').eq('project_id', id);
      if (membersData) setProjectMembers(membersData);
    };
    loadProjectData();
  }, [id]);

  const filteredPlans = useMemo(() => {
    return floorPlans.filter(plan => plan.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [floorPlans, searchQuery]);

  // --- FUNÇÕES DE EQUIPE ---
  const handleInviteMember = async () => {
    const guestEmail = window.prompt("E-mail do usuário a convidar:");
    if (!guestEmail) return;
    const emailLimpo = guestEmail.toLowerCase().trim();
    const { data: newMember, error } = await supabase.from('project_members').insert([{ project_id: id, user_email: emailLimpo }]).select();
    
    if (error && error.code === '23505') return alert("Este e-mail já tem acesso!");
    
    await logAction(user.email, 'CONVITE ENVIADO', `Convidou ${emailLimpo} para o projeto`);
    if (newMember) setProjectMembers([...projectMembers, newMember[0]]);
    
    emailjs.send('service_0tob8zq', 'template_p7pmmph', { to_email: emailLimpo, project_name: project.name, link: window.location.origin }, '5GqgKyCAyw74i6C7_')
      .then(() => alert(`✅ Convite enviado para ${emailLimpo}.`), () => alert("Acesso liberado, mas erro ao enviar o e-mail."));
  };

  const handleRemoveMember = async (memberEmail) => {
    if (!window.confirm(`⚠️ Tem certeza que deseja remover o acesso de ${memberEmail}? Ele não poderá mais ver o projeto.`)) return;
    const { error } = await supabase.from('project_members').delete().eq('project_id', id).eq('user_email', memberEmail);
    if (!error) {
      setProjectMembers(projectMembers.filter(m => m.user_email !== memberEmail));
      await logAction(user.email, 'ACESSO REVOGADO', `Removeu o acesso de ${memberEmail} do projeto`);
    } else {
      alert("Erro ao remover usuário.");
    }
  };

  // --- UPLOAD DE NOVA PLANTA + MODELO 3D ---
  const handleUploadPlan = async (e) => {
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    setUploadProgressText("Fazendo upload da imagem da planta...");
    
    try {
      // 1. Upload da Planta (Imagem)
      const fileExt = file.name.split('.').pop();
      const safeFileName = `planta_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('plantas').upload(safeFileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('plantas').getPublicUrl(safeFileName);
      
      // 2. Upload do Arquivo IFC (Se selecionado)
      let finalIfcUrl = null;
      if (ifcFile) {
        setUploadProgressText("Fazendo upload do Modelo 3D (Isso pode demorar)...");
        const ifcExt = ifcFile.name.split('.').pop();
        const safeIfcName = `bim_${Date.now()}_${Math.random().toString(36).substring(7)}.${ifcExt}`;
        const { error: ifcUploadError } = await supabase.storage.from('modelos-bim').upload(safeIfcName, ifcFile);
        if (ifcUploadError) throw ifcUploadError;
        
        const { data: ifcUrlData } = supabase.storage.from('modelos-bim').getPublicUrl(safeIfcName);
        finalIfcUrl = ifcUrlData.publicUrl;
      }

      setUploadProgressText("Salvando informações...");

      // 3. Salva no banco de dados
      const { data: newPlan, error: dbError } = await supabase.from('floor_plans').insert([{ 
        project_id: id, 
        title: title, 
        file_name: file.name, 
        image_url: urlData.publicUrl,
        ifc_url: finalIfcUrl // Guarda o link do Supabase aqui
      }]).select();

      if (dbError) throw dbError;
      
      if (newPlan) {
        setFloorPlans([newPlan[0], ...floorPlans]);
        await logAction(user.email, 'UPLOAD DE PLANTA', `Adicionou a planta "${title}"`);
        setTitle(''); setFile(null); setIfcFile(null); setShowUpload(false);
      }
    } catch (error) { 
      alert("Erro ao enviar: " + error.message); 
    } finally { 
      setUploading(false); 
      setUploadProgressText('');
    }
  };


  // --- EDIÇÃO DE PLANTA BLINDADA ---
  const openEditPlanModal = (plan, e) => {
    e.stopPropagation();
    setPlanToEdit(plan);
    setEditTitle(plan.title);
    setEditFile(null);    // Limpa estado de arquivo novo
    setEditIfcFile(null); // Limpa estado de arquivo novo
    setIsEditPlanModalOpen(true);
  };

  const handleSaveEditedPlan = async (e) => {
    e.preventDefault();
    if (!editTitle) return alert("O título é obrigatório.");
    setIsEditing(true);

    try {
        // COMEÇA GUARDANDO OS VALORES ANTIGOS PARA NÃO PERDERMOS NADA
        let finalImageUrl = planToEdit.image_url;
        let finalFileName = planToEdit.file_name;
        let finalIfcUrl = planToEdit.ifc_url; 
        
        let logDetails = `Editou a planta "${editTitle}"`;

        // 1. SÓ atualiza a Imagem se o usuário inseriu um arquivo NOVO
        if (editFile) {
            const fileExt = editFile.name.split('.').pop();
            const safeFileName = `planta_edit_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('plantas').upload(safeFileName, editFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('plantas').getPublicUrl(safeFileName);
            finalImageUrl = urlData.publicUrl; // Substitui pela URL nova
            finalFileName = editFile.name;
            logDetails += ` e alterou a imagem`;
        }

        // 2. SÓ atualiza o Modelo IFC se o usuário inseriu um arquivo NOVO
        if (editIfcFile) {
            const ifcExt = editIfcFile.name.split('.').pop();
            const safeIfcName = `bim_edit_${Date.now()}_${Math.random().toString(36).substring(7)}.${ifcExt}`;
            const { error: ifcUploadError } = await supabase.storage.from('modelos-bim').upload(safeIfcName, editIfcFile);
            if (ifcUploadError) throw ifcUploadError;

            const { data: ifcUrlData } = supabase.storage.from('modelos-bim').getPublicUrl(safeIfcName);
            finalIfcUrl = ifcUrlData.publicUrl; // Substitui pela URL nova
            logDetails += ` e alterou o modelo 3D`;
        }

        // 3. Salva no banco (Vai enviar os links novos OU os antigos se não mudou)
        const { error } = await supabase.from('floor_plans').update({
            title: editTitle,
            image_url: finalImageUrl,
            file_name: finalFileName,
            ifc_url: finalIfcUrl
        }).eq('id', planToEdit.id);

        if (error) throw error;

        // Atualiza a tela imediatamente
        setFloorPlans(floorPlans.map(p => p.id === planToEdit.id ? { 
            ...p, 
            title: editTitle, 
            image_url: finalImageUrl, 
            file_name: finalFileName, 
            ifc_url: finalIfcUrl 
        } : p));
        
        await logAction(user.email, 'EDIÇÃO DE PLANTA', logDetails);
        
        // Reseta tudo e fecha modal
        setIsEditPlanModalOpen(false);
        setPlanToEdit(null);
        setEditFile(null);
        setEditIfcFile(null);
    } catch (error) {
       alert("Erro ao editar planta: " + error.message);
    } finally {
       setIsEditing(false);
    }
  };


  if (!project) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando projeto...</div>;

  const isOwner = user.id === project.user_id;
  const totalUsers = projectMembers.length + 1; 

  const textPrimary = isDarkMode ? '#ffffff' : '#1a1a2e';
  const textSecondary = isDarkMode ? '#8892b0' : '#666666';
  const cardBg = isDarkMode ? '#1e1e2f' : '#ffffff';
  const cardBorder = isDarkMode ? '1px solid #2a2a40' : '1px solid #eaeaea';
  const inputBg = isDarkMode ? '#232336' : '#f5f7f9';

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {activePlan ? (
        <div>
          <button onClick={() => setActivePlan(null)} style={{ marginBottom: '20px', background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
            ← Voltar ao Resumo
          </button>
          <MapViewer floorPlan={activePlan} />
        </div>
      ) : (
        <>
          <Link to="/home" style={{ color: textSecondary, textDecoration: 'none', fontSize: '14px', fontWeight: '500', display: 'inline-block', marginBottom: '15px' }}>← Voltar para Projetos</Link>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
            <div>
              <h1 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '32px', fontWeight: 'bold' }}>{project.name}</h1>
              <p style={{ margin: 0, color: textSecondary, fontSize: '15px' }}>Resumo e gerenciamento de escaneamentos.</p>
            </div>
            
            <button onClick={() => setShowUpload(!showUpload)} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)' }}>
              {showUpload ? 'Cancelar' : '+ Adicionar Planta'}
            </button>
          </div>

          {/* FORMULÁRIO DE NOVA PLANTA */}
          {showUpload && (
            <form onSubmit={handleUploadPlan} style={{ background: cardBg, padding: '20px', borderRadius: '12px', border: cardBorder, marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <input type="text" placeholder="Nome da Planta (Ex: Térreo)" value={title} onChange={(e)=>setTitle(e.target.value)} required style={{ padding: '12px 15px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '6px', flex: 1, outline: 'none' }} />
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 'bold', width: '80px' }}>Imagem 2D:</span>
                  <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files[0])} required style={{ color: textSecondary, fontSize: '14px' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: inputBg, borderRadius: '6px', flex: 1, padding: '10px 15px', gap: '10px' }}>
                  <BoxIcon style={{ color: '#00d2ff' }}/>
                  <span style={{ fontSize: '13px', color: textSecondary, fontWeight: 'bold' }}>Anexar Modelo BIM (.ifc) Opcional:</span>
                  <input type="file" accept=".ifc" onChange={(e)=>setIfcFile(e.target.files[0])} style={{ color: textPrimary, fontSize: '14px', outline: 'none' }} />
                </div>
                <button type="submit" disabled={uploading} style={{ background: textPrimary, color: cardBg, border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', minWidth: '160px', opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? 'Enviando...' : 'Salvar Planta'}
                </button>
              </div>
              {uploading && <p style={{ margin: 0, fontSize: '12px', color: '#00d2ff', fontWeight: 'bold', textAlign: 'right' }}>{uploadProgressText}</p>}
            </form>
          )}

          <div style={{ background: cardBg, borderRadius: '12px', border: cardBorder, padding: '20px', marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Plantas</span>
              <span style={{ fontSize: '24px', color: textPrimary, fontWeight: 'bold' }}>{floorPlans.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Ambientes Target</span>
              <span style={{ fontSize: '24px', color: textPrimary, fontWeight: 'bold' }}>{targetCount}</span>
            </div>
            <div style={{ width: '1px', height: '40px', backgroundColor: isDarkMode ? '#2a2a40' : '#eaeaea' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Acesso ao Projeto</span>
                <span style={{ fontSize: '14px', color: textPrimary, fontWeight: '500' }}>{totalUsers} {totalUsers === 1 ? 'pessoa' : 'pessoas'} com acesso</span>
              </div>
              <button onClick={() => setIsManageAccessOpen(true)} style={{ background: inputBg, border: 'none', color: textPrimary, padding: '8px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <UsersIcon /> Gerenciar Equipe
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: textPrimary, fontSize: '22px' }}>Plantas do Projeto</h2>
            <div style={{ display: 'flex', alignItems: 'center', background: isDarkMode ? inputBg : '#ffffff', border: isDarkMode ? 'none' : '1px solid #eaeaea', borderRadius: '8px', padding: '8px 15px', width: '250px' }}>
              <span style={{ color: textSecondary, marginRight: '8px', display: 'flex' }}><SearchIcon /></span>
              <input type="text" placeholder="Pesquisar planta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: textPrimary, outline: 'none', width: '100%', fontSize: '14px' }}/>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
              {filteredPlans.map(plan => (
                <div key={plan.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div 
                    onClick={() => setActivePlan(plan)}
                    style={{ width: '100%', height: '240px', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', border: cardBorder, backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f0f0', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <img src={plan.image_url} alt={plan.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                      <span style={{ background: 'white', color: '#1a1a2e', padding: '8px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px' }}>Visualizar Mapa</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, color: textPrimary, fontSize: '18px', fontWeight: '600' }}>{plan.title}</h3>
                      {plan.ifc_url && <span style={{ background: '#00d2ff20', color: '#00d2ff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>3D</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={(e) => openEditPlanModal(plan, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} title="Editar Planta" onMouseEnter={(e) => e.currentTarget.style.color = '#00d2ff'} onMouseLeave={(e) => e.currentTarget.style.color = textSecondary}><EditIcon /></button>
                      <button onClick={(e) => handleDeletePlan(plan.id, plan.title, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} title="Apagar" onMouseEnter={(e) => e.currentTarget.style.color = '#e63946'} onMouseLeave={(e) => e.currentTarget.style.color = textSecondary}><TrashIcon /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredPlans.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', background: cardBg, border: cardBorder, borderRadius: '12px' }}><p style={{ color: textSecondary, margin: 0 }}>Nenhuma planta encontrada.</p></div>}
          </div>
        </>
      )}

      {/* MODAL DE EDIÇÃO DE PLANTA */}
      {isEditPlanModalOpen && planToEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ background: cardBg, width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', border: cardBorder }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <div><h2 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '22px' }}>Editar Planta</h2><p style={{ margin: 0, color: textSecondary, fontSize: '14px' }}>Altere os dados da planta selecionada.</p></div>
                    <button onClick={() => setIsEditPlanModalOpen(false)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: 0 }}><CloseIcon /></button>
                </div>

                <form onSubmit={handleSaveEditedPlan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textPrimary, fontWeight: '600' }}>Nome da Planta</label>
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textPrimary, fontWeight: '600' }}>Substituir Imagem 2D (Opcional)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: inputBg, padding: '10px', borderRadius: '8px', border: cardBorder }}>
                            <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files[0])} style={{ color: textSecondary, fontSize: '14px', flex: 1 }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', color: textPrimary, fontWeight: '600' }}>
                          <BoxIcon style={{ color: '#00d2ff' }}/> Substituir Modelo BIM (Opcional)
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: inputBg, padding: '10px', borderRadius: '8px', border: cardBorder }}>
                            {planToEdit.ifc_url && <span style={{ fontSize: '12px', color: '#00d2ff' }}>✓ Modelo 3D já anexado. Suba outro para substituir.</span>}
                            {/* ATENÇÃO AQUI: Agora setEditIfcFile para não bugar a imagem! */}
                            <input type="file" accept=".ifc" onChange={(e) => setEditIfcFile(e.target.files[0])} style={{ color: textSecondary, fontSize: '14px' }} />
                        </div>
                    </div>

                    <button type="submit" disabled={isEditing} style={{ width: '100%', padding: '14px', background: textPrimary, color: cardBg, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isEditing ? 'not-allowed' : 'pointer', fontSize: '16px', marginTop: '10px', opacity: isEditing ? 0.7 : 1 }}>
                        {isEditing ? 'Salvando alterações...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* MODAL DE GERENCIAR EQUIPE */}
      {isManageAccessOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: cardBg, width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', border: cardBorder }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div><h2 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '22px' }}>Acesso ao Projeto</h2><p style={{ margin: 0, color: textSecondary, fontSize: '14px' }}>Gerencie quem pode visualizar as plantas.</p></div>
              <button onClick={() => setIsManageAccessOpen(false)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: 0 }}><CloseIcon /></button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              <button onClick={handleInviteMember} style={{ flex: 1, padding: '12px', background: inputBg, color: textPrimary, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><MailIcon /> Convidar Novo Membro</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: inputBg, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6f42c1', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' }}>D</div><div><span style={{ display: 'block', color: textPrimary, fontWeight: '600', fontSize: '14px' }}>Dono do Projeto</span><span style={{ color: textSecondary, fontSize: '12px' }}>Proprietário</span></div></div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6f42c1', background: 'rgba(111, 66, 193, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>Proprietário</span>
              </div>
              {projectMembers.map(member => (
                <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: cardBorder, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isDarkMode ? '#2a2a40' : '#e2e8f0', color: textPrimary, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' }}>{member.user_email.substring(0, 2).toUpperCase()}</div><span style={{ color: textPrimary, fontWeight: '500', fontSize: '14px' }}>{member.user_email}</span></div>
                  {isOwner && (<button onClick={() => handleRemoveMember(member.user_email)} style={{ background: 'transparent', border: 'none', color: textSecondary, cursor: 'pointer', padding: '5px' }} title="Remover Acesso" onMouseEnter={(e) => e.currentTarget.style.color = '#e63946'} onMouseLeave={(e) => e.currentTarget.style.color = textSecondary}><TrashIcon /></button>)}
                </div>
              ))}
              {projectMembers.length === 0 && <p style={{ color: textSecondary, fontSize: '13px', textAlign: 'center', margin: '10px 0' }}>Nenhum convidado adicionado ainda.</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}