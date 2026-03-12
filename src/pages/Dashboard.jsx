import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import MapViewer from '../features/map-viewer/MapViewer';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../services/logger'; 
import emailjs from '@emailjs/browser';
import Navbar from '../components/Navbar';

// --- Ícones Minimalistas (SVGs) ---
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const MailIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const FilterIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const UsersIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const BoxIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const PinIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const UserBadgeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CalendarCheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const CameraIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const FlagIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>;
const CalendarPlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const RefreshCcwIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>;
const ChevronLeftIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

export default function Dashboard() {
  const { id } = useParams();
  const { user } = useAuth(); 
  
  const [project, setProject] = useState(null);
  const [floorPlans, setFloorPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null); 
  const [projectIssues, setProjectIssues] = useState([]);
  const [autoOpenIssue, setAutoOpenIssue] = useState(null); 

  // === ESTADOS DOS FILTROS ===
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilterStatus, setPlanFilterStatus] = useState(''); 
  const [issueFilterType, setIssueFilterType] = useState(''); 
  const [issueFilterValue, setIssueFilterValue] = useState('');

  // === ESTADOS DA AGENDA DE CAPTURAS ===
  const [captureRequests, setCaptureRequests] = useState([]);
  const [projectTargets, setProjectTargets] = useState([]);
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDate, setReqDate] = useState('');
  const [reqAssignee, setReqAssignee] = useState('');
  const [reqTargets, setReqTargets] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(null);

  const [showUpload, setShowUpload] = useState(false);
  const [targetCount, setTargetCount] = useState(0);
  const [projectMembers, setProjectMembers] = useState([]);
  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);

  // --- Estados da Nova Planta ---
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [ifcFile, setIfcFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  
  // --- Estados da Edição de Planta ---
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editIfcFile, setEditIfcFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false); 

  // --- Estados de Edição da Ficha Cadastral ---
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectClient, setEditProjectClient] = useState('');
  const [editProjectAddress, setEditProjectAddress] = useState('');
  const [editProjectStatus, setEditProjectStatus] = useState('Em andamento');
  const [editProjectStartDate, setEditProjectStartDate] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [isProjectEditing, setIsProjectEditing] = useState(false);

  // === ESTADOS DA MÁQUINA DO TEMPO (4D) ===
  const [allVisits, setAllVisits] = useState([]);
  const [sliderDate, setSliderDate] = useState(Date.now());
  const [minDate, setMinDate] = useState(Date.now());
  const [maxDate, setMaxDate] = useState(Date.now());

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
      
      if (plansData) {
        setFloorPlans(plansData);
        
        const planIds = plansData.map(p => p.id);
        if (planIds.length > 0) {
            const { data: vData } = await supabase
                .from('visits')
                .select('id, target_id, visit_date, floor_plan_id, visit_photos(id)')
                .in('floor_plan_id', planIds);
            setAllVisits(vData || []);
        }
      }

      const { count: tCount } = await supabase.from('targets').select('*', { count: 'exact', head: true }).eq('project_id', id);
      setTargetCount(tCount || 0);

      const { data: issuesData } = await supabase
        .from('issues')
        .select('*, targets(name, floor_plan_id)')
        .eq('project_id', id)
        .order('status', { ascending: true }) 
        .order('created_at', { ascending: false });
        
      if (issuesData) setProjectIssues(issuesData);

      const { data: agendaData } = await supabase
        .from('capture_requests')
        .select('*')
        .eq('project_id', id)
        .order('scheduled_date', { ascending: true });
      if (agendaData) setCaptureRequests(agendaData);

      const { data: allProjTargets } = await supabase
        .from('targets')
        .select('id, name, floor_plan_id')
        .eq('project_id', id);
      if (allProjTargets) setProjectTargets(allProjTargets);

      const { data: membersData } = await supabase.from('project_members').select('*').eq('project_id', id);
      if (membersData) setProjectMembers(membersData);
    };
    loadProjectData();
  }, [id]);

  const handleTogglePlanStatus = async (newStatus) => {
    if (newStatus === 'Concluído') {
      const { data: planTargets } = await supabase.from('targets').select('id').eq('floor_plan_id', activePlan.id);
      if (planTargets && planTargets.length > 0) {
        const targetIds = planTargets.map(t => t.id);
        const { data: openIssues } = await supabase.from('issues').select('id').in('target_id', targetIds).eq('status', 'open');
        if (openIssues && openIssues.length > 0) {
          return alert(`❌ Não é possível concluir a planta!\n\nExistem ${openIssues.length} apontamento(s) em aberto nos ambientes deste andar. Resolva-os na foto 360 primeiro.`);
        }
      }
    }
    try {
      const { error } = await supabase.from('floor_plans').update({ status: newStatus }).eq('id', activePlan.id);
      if (error) throw error;
      const updatedPlan = { ...activePlan, status: newStatus };
      setActivePlan(updatedPlan);
      const updatedPlansList = floorPlans.map(p => p.id === activePlan.id ? updatedPlan : p);
      setFloorPlans(updatedPlansList);
      await logAction(user.email, 'MUDANÇA DE STATUS', `Marcou a planta "${activePlan.title}" como ${newStatus}`);

      if (updatedPlansList.length > 0) {
        const allCompleted = updatedPlansList.every(p => p.status === 'Concluído');
        if (allCompleted && project.status !== 'Concluído') {
          await supabase.from('projects').update({ status: 'Concluído' }).eq('id', project.id);
          setProject({ ...project, status: 'Concluído' });
          alert("🎉 Excelente! Todas as plantas foram concluídas.\n\nO status da obra inteira foi alterado para CONCLUÍDO automaticamente!");
        } 
        else if (!allCompleted && project.status === 'Concluído') {
          await supabase.from('projects').update({ status: 'Em andamento' }).eq('id', project.id);
          setProject({ ...project, status: 'Em andamento' });
          alert("⚠️ A planta foi reaberta. O status da obra voltou para EM ANDAMENTO.");
        }
      }
    } catch (err) { alert("Erro ao atualizar status: " + err.message); }
  };

  const handleOpenIssue = (issue) => {
    const plan = floorPlans.find(p => p.id === issue.targets?.floor_plan_id);
    if (plan) {
      setActivePlan(plan); 
      setAutoOpenIssue(issue); 
    }
  };

useEffect(() => {
    // Se tiver planta ativa, filtra só as visitas dela. Se não, usa TODAS da obra!
    const relevantVisits = activePlan ? allVisits.filter(v => v.floor_plan_id === activePlan.id) : allVisits;
    
    let start = project?.start_date ? new Date(project.start_date + 'T12:00:00Z').getTime() : Date.now();
    
    if (relevantVisits.length > 0) {
        const firstVisit = Math.min(...relevantVisits.map(v => new Date(v.visit_date + 'T12:00:00Z').getTime()));
        if (!project?.start_date || firstVisit < start) start = firstVisit;
    }

    let end = Date.now(); 
    if (relevantVisits.length > 0) {
        const latestVisit = Math.max(...relevantVisits.map(v => new Date(v.visit_date + 'T12:00:00Z').getTime()));
        if (latestVisit > end) end = latestVisit;
    }

    if (start >= end) start = end - 86400000; 
    
    setMinDate(start); 
    setMaxDate(end); 
    setSliderDate(end); 
  }, [activePlan, allVisits, project]);

  const timelineStats = useMemo(() => {
    // Mesma lógica de filtro: local ou global
    const relevantVisits = activePlan ? allVisits.filter(v => v.floor_plan_id === activePlan.id) : allVisits;
    
    const validVisits = relevantVisits.filter(v => new Date(v.visit_date + 'T12:00:00Z').getTime() <= sliderDate);
    const uniqueTargets = new Set(validVisits.map(v => v.target_id)).size;
    const totalScenes = validVisits.reduce((acc, v) => acc + 1 + (v.visit_photos ? v.visit_photos.length : 0), 0);
    
    return { visitsCount: validVisits.length, targetsMapped: uniqueTargets, scenesCount: totalScenes };
  }, [allVisits, sliderDate, activePlan]);


  const filteredPlans = useMemo(() => {
    return floorPlans.filter(plan => {
      const matchSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !planFilterStatus ? true : plan.status === planFilterStatus;
      return matchSearch && matchStatus;
    });
  }, [floorPlans, searchQuery, planFilterStatus]);

  const filteredIssues = useMemo(() => {
    return projectIssues.filter(issue => {
      if (!issueFilterType || !issueFilterValue) return true;
      if (issueFilterType === 'status') return issue.status === issueFilterValue;
      if (issueFilterType === 'assigned_to') return issue.assigned_to === issueFilterValue;
      if (issueFilterType === 'floor_plan') return issue.targets?.floor_plan_id === issueFilterValue;
      return true;
    });
  }, [projectIssues, issueFilterType, issueFilterValue]);

  const uniqueIssueAssignees = [...new Set(projectIssues.map(i => i.assigned_to).filter(Boolean))];
  const uniqueIssuePlans = [...new Set(projectIssues.map(i => i.targets?.floor_plan_id).filter(Boolean))];

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
    } else { alert("Erro ao remover usuário."); }
  };

  const handleUploadPlan = async (e) => { 
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    setUploadProgressText("Fazendo upload da imagem da planta...");
    try {
      const fileExt = file.name.split('.').pop();
      const safeFileName = `planta_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('plantas').upload(safeFileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('plantas').getPublicUrl(safeFileName);
      
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
      const { data: newPlan, error: dbError } = await supabase.from('floor_plans').insert([{ project_id: id, title: title, file_name: file.name, image_url: urlData.publicUrl, ifc_url: finalIfcUrl }]).select();
      if (dbError) throw dbError;
      if (newPlan) {
        setFloorPlans([newPlan[0], ...floorPlans]);
        await logAction(user.email, 'UPLOAD DE PLANTA', `Adicionou a planta "${title}"`);
        setTitle(''); setFile(null); setIfcFile(null); setShowUpload(false);
      }
    } catch (error) { alert("Erro ao enviar: " + error.message); } finally { setUploading(false); setUploadProgressText(''); }
  };

  const openEditPlanModal = (plan, e) => { 
    if (e) e.stopPropagation();
    setPlanToEdit(plan); setEditTitle(plan.title); setEditFile(null); setEditIfcFile(null); setIsEditPlanModalOpen(true);
  };

  const handleSaveEditedPlan = async (e) => { 
    e.preventDefault();
    if (!editTitle) return alert("O título é obrigatório.");
    setIsEditing(true);
    try {
        let finalImageUrl = planToEdit.image_url; let finalFileName = planToEdit.file_name; let finalIfcUrl = planToEdit.ifc_url; let logDetails = `Editou a planta "${editTitle}"`;
        if (editFile) {
            const fileExt = editFile.name.split('.').pop(); const safeFileName = `planta_edit_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('plantas').upload(safeFileName, editFile);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('plantas').getPublicUrl(safeFileName);
            finalImageUrl = urlData.publicUrl; finalFileName = editFile.name; logDetails += ` e alterou a imagem`;
        }
        if (editIfcFile) {
            const ifcExt = editIfcFile.name.split('.').pop(); const safeIfcName = `bim_edit_${Date.now()}_${Math.random().toString(36).substring(7)}.${ifcExt}`;
            const { error: ifcUploadError } = await supabase.storage.from('modelos-bim').upload(safeIfcName, editIfcFile);
            if (ifcUploadError) throw ifcUploadError;
            const { data: ifcUrlData } = supabase.storage.from('modelos-bim').getPublicUrl(safeIfcName);
            finalIfcUrl = ifcUrlData.publicUrl; logDetails += ` e alterou o modelo 3D`;
        }
        const { error } = await supabase.from('floor_plans').update({ title: editTitle, image_url: finalImageUrl, file_name: finalFileName, ifc_url: finalIfcUrl }).eq('id', planToEdit.id);
        if (error) throw error;
        
        const updatedPlan = { ...planToEdit, title: editTitle, image_url: finalImageUrl, file_name: finalFileName, ifc_url: finalIfcUrl };
        setFloorPlans(floorPlans.map(p => p.id === planToEdit.id ? updatedPlan : p));
        if (activePlan?.id === planToEdit.id) setActivePlan(updatedPlan);

        await logAction(user.email, 'EDIÇÃO DE PLANTA', logDetails);
        setIsEditPlanModalOpen(false); setPlanToEdit(null); setEditFile(null); setEditIfcFile(null);
    } catch (error) { alert("Erro ao editar planta: " + error.message); } finally { setIsEditing(false); }
  };

  const handleDeletePlan = async (planId, planTitle, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`⚠️ Apagar a planta "${planTitle}" e TODOS os seus ambientes mapeados?`)) return;
    const { error } = await supabase.from('floor_plans').delete().eq('id', planId);
    if (!error) {
      setFloorPlans(floorPlans.filter(p => p.id !== planId));
      if (activePlan?.id === planId) setActivePlan(null); 
      await logAction(user.email, 'EXCLUSÃO DE PLANTA', `Apagou a planta "${planTitle}" do projeto`);
    }
  };

  const openEditProjectModal = () => {
    setEditProjectName(project.name || '');
    setEditProjectClient(project.client_name || '');
    setEditProjectAddress(project.address || '');
    setEditProjectStatus(project.status || 'Em andamento');
    setEditProjectStartDate(project.start_date || '');
    setEditProjectDescription(project.description || '');
    setIsEditProjectModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!editProjectName) return alert("O título da obra é obrigatório.");
    setIsProjectEditing(true);

    try {
      const { error } = await supabase.from('projects').update({
        name: editProjectName, client_name: editProjectClient, address: editProjectAddress, status: editProjectStatus, start_date: editProjectStartDate || null, description: editProjectDescription
      }).eq('id', project.id);

      if (error) throw error;
      setProject({ ...project, name: editProjectName, client_name: editProjectClient, address: editProjectAddress, status: editProjectStatus, start_date: editProjectStartDate || null, description: editProjectDescription });
      await logAction(user.email, 'EDIÇÃO DE FICHA CADASTRAL', `Editou os dados cadastrais da obra "${editProjectName}"`);
      setIsEditProjectModalOpen(false);
    } catch (error) { alert("Erro ao salvar dados do projeto: " + error.message); } finally { setIsProjectEditing(false); }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reqTitle || !reqDate || !reqAssignee || reqTargets.length === 0) return alert("Preencha todos os campos e selecione ao menos um ambiente!");
    
    try {
      const { data, error } = await supabase.from('capture_requests').insert([{
        project_id: id, title: reqTitle, scheduled_date: reqDate, assigned_to: reqAssignee, requested_by: user.email, target_ids: reqTargets
      }]).select();

      if (error) throw error;
      setCaptureRequests([...captureRequests, data[0]].sort((a,b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)));
      setIsAgendaModalOpen(false);
      setReqTitle(''); setReqDate(''); setReqAssignee(''); setReqTargets([]);
      await logAction(user.email, 'NOVO AGENDAMENTO', `Agendou captura "${reqTitle}" para ${reqDate}`);
    } catch (err) { alert("Erro ao agendar: " + err.message); }
  };

  const handleUpdateAgendaStatus = async (reqId, newStatus, extraData = {}) => {
    try {
      const { error } = await supabase.from('capture_requests').update({ status: newStatus, ...extraData }).eq('id', reqId);
      if (error) throw error;
      setCaptureRequests(captureRequests.map(r => r.id === reqId ? { ...r, status: newStatus, ...extraData } : r));
    } catch (err) { alert("Erro ao atualizar agenda: " + err.message); }
  };

  const handleProposeReschedule = (req) => {
    const newDate = window.prompt("Sugerir nova data (YYYY-MM-DD):", req.scheduled_date);
    if (newDate && newDate !== req.scheduled_date) {
      handleUpdateAgendaStatus(req.id, 'reschedule_requested', { reschedule_date: newDate });
    }
  };

  const handleAcceptReschedule = (req) => {
    if (window.confirm(`Aceitar a remarcação para ${new Date(req.reschedule_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}?`)) {
      handleUpdateAgendaStatus(req.id, 'confirmed', { scheduled_date: req.reschedule_date, reschedule_date: null });
    }
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null); 
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr });
    }
    return days;
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const filteredRequests = selectedAgendaDate 
    ? captureRequests.filter(r => r.scheduled_date === selectedAgendaDate)
    : captureRequests;


  if (!project) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando projeto...</div>;

  const isOwner = user.id === project.user_id;
  const totalUsers = projectMembers.length + 1; 

  const textPrimary = isDarkMode ? '#ffffff' : '#1a1a2e';
  const textSecondary = isDarkMode ? '#8892b0' : '#666666';
  const cardBg = isDarkMode ? '#1e1e2f' : '#ffffff';
  const cardBorder = isDarkMode ? '1px solid #2a2a40' : '1px solid #eaeaea';
  const inputBg = isDarkMode ? '#232336' : '#f5f7f9';

  return (
    <>
      <Navbar />

      <div style={{ padding: '30px 40px', maxWidth: '100%', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        
        {/* ======================================================================= */}
        {/* VISUALIZAÇÃO DE DENTRO DA PLANTA (ATIVA)                                */}
        {/* ======================================================================= */}
        {activePlan ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <button onClick={() => setActivePlan(null)} style={{ marginBottom: '20px', background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', width: 'fit-content' }}>
              ← Voltar ao Resumo do Projeto
            </button>
            
            <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                  {/* --- COLUNA ESQUERDA DA PLANTA --- */}
                  <div style={{ flex: '1 1 500px', maxWidth: '550px', display: 'flex', flexDirection: 'column', gap: '25px' }}>     
                                   
                    {/* CARD DA PLANTA */}
                    <div style={{ background: cardBg, borderRadius: '16px', border: cardBorder, padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #6f42c1 0%, #00d2ff 100%)' }}></div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <h2 style={{ margin: 0, color: textPrimary, fontSize: '24px', fontWeight: 'bold' }}>{activePlan.title}</h2>
                        {activePlan.ifc_url && <span style={{ background: '#00d2ff20', color: '#00d2ff', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>BIM 3D</span>}
                      </div>
                      
                      <p style={{ margin: '0 0 20px 0', color: textSecondary, fontSize: '13px' }}>Gerencie os mapeamentos e vistorias deste andar.</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderTop: cardBorder, paddingTop: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Status do Andar:</span>
                              <select 
                                  value={activePlan.status || 'Em andamento'} 
                                  onChange={(e) => handleTogglePlanStatus(e.target.value)}
                                  disabled={!isOwner}
                                  style={{ 
                                      padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: isOwner ? 'pointer' : 'default', outline: 'none',
                                      background: (activePlan.status === 'Concluído') ? '#10b98120' : '#00d2ff20', color: (activePlan.status === 'Concluído') ? '#10b981' : '#00d2ff', appearance: isOwner ? 'auto' : 'none'
                                  }}
                              >
                                  <option value="Em andamento">Em andamento</option>
                                  <option value="Concluído">Concluído</option>
                              </select>
                          </div>
                          
                          {isOwner && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button onClick={(e) => openEditPlanModal(activePlan, e)} style={{ flex: 1, padding: '10px', background: inputBg, color: textPrimary, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: 'background 0.2s', fontSize: '12px' }} onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#3a3a50' : '#e2e8f0'} onMouseLeave={(e) => e.currentTarget.style.background = inputBg}>
                                <EditIcon /> Editar
                              </button>
                              <button onClick={(e) => handleDeletePlan(activePlan.id, activePlan.title, e)} style={{ flex: 1, padding: '10px', background: '#e6394615', color: '#e63946', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: 'background 0.2s', fontSize: '12px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e6394630'} onMouseLeave={(e) => e.currentTarget.style.background = '#e6394615'}>
                                <TrashIcon /> Apagar
                              </button>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* TIMELINE */}
                    <div style={{ background: isDarkMode ? 'linear-gradient(180deg, #111 0%, #1a1a2e 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f4f7f6 100%)', borderRadius: '16px', padding: '25px', boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', border: isDarkMode ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid rgba(0, 210, 255, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ClockIcon style={{ color: '#00d2ff', width: '20px', height: '20px' }} />
                            <h2 style={{ margin: 0, color: textPrimary, fontSize: '18px' }}>Evolução</h2>
                          </div>
                          <div style={{ background: isDarkMode ? 'rgba(0, 210, 255, 0.1)' : '#e0f7fa', padding: '4px 10px', borderRadius: '20px', color: isDarkMode ? '#00d2ff' : '#00838f', fontWeight: 'bold', fontSize: '12px' }}>
                            {new Date(sliderDate).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        <div style={{ margin: '20px 0 30px 0', position: 'relative' }}>
                          <input 
                            type="range" min={minDate} max={maxDate} step={86400000} value={sliderDate} onChange={(e) => setSliderDate(Number(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer', accentColor: '#00d2ff', height: '4px', outline: 'none' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: textSecondary, fontSize: '11px', fontWeight: 'bold' }}>
                            <span>Início: {new Date(minDate).toLocaleDateString('pt-BR')}</span>
                            <span>Hoje</span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div style={{ background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : inputBg, padding: '15px', borderRadius: '10px', border: cardBorder, textAlign: 'center' }}>
                            <span style={{ display: 'block', color: textSecondary, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Ambientes</span>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: textPrimary, fontSize: '20px', fontWeight: 'bold' }}><PinIcon /> {timelineStats.targetsMapped}</div>
                          </div>
                          <div style={{ background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : inputBg, padding: '15px', borderRadius: '10px', border: cardBorder, textAlign: 'center' }}>
                            <span style={{ display: 'block', color: textSecondary, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Cenas 360</span>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#00d2ff', fontSize: '20px', fontWeight: 'bold' }}><CameraIcon /> {timelineStats.scenesCount}</div>
                          </div>
                          <div style={{ gridColumn: '1 / -1', background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : inputBg, padding: '15px', borderRadius: '10px', border: cardBorder, textAlign: 'center' }}>
                            <span style={{ display: 'block', color: textSecondary, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Visitas Registradas</span>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}><CalendarCheckIcon /> {timelineStats.visitsCount}</div>
                          </div>
                        </div>
                    </div>

                </div>

                  {/* --- COLUNA DIREITA DA PLANTA (O MAPA EM SI) --- */}
                  <div style={{ flex: '1.2 1 450px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>

                    <MapViewer floorPlan={activePlan} isOwner={isOwner} autoOpenIssue={autoOpenIssue} setAutoOpenIssue={setAutoOpenIssue} />
                </div>
            </div>
          </div>
        ) : (
          
          /* ======================================================================= */
          /* NOVO LAYOUT DO DASHBOARD GLOBAL (3 COLUNAS)                             */
          /* ======================================================================= */
          <>
            <Link to="/home" style={{ color: textSecondary, textDecoration: 'none', fontSize: '14px', fontWeight: '500', display: 'inline-block', marginBottom: '15px' }}>← Voltar para Projetos</Link>
            
            <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              
              {/* ======================= COLUNA 1: ESQUERDA (GESTÃO E ISSUES) ======================= */}
              <div style={{ flex: '1 1 400px', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* CARD DA FICHA DO PROJETO */}
                <div style={{ background: cardBg, borderRadius: '16px', border: cardBorder, padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #6f42c1 0%, #00d2ff 100%)' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <h1 style={{ margin: 0, color: textPrimary, fontSize: '24px', fontWeight: 'bold', lineHeight: '1.2' }}>{project.name}</h1>
                    {isOwner && (
                      <button onClick={openEditProjectModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, padding: '5px' }} title="Editar Ficha" onMouseEnter={(e) => e.currentTarget.style.color = '#00d2ff'} onMouseLeave={(e) => e.currentTarget.style.color = textSecondary}>
                        <EditIcon />
                      </button>
                    )}
                  </div>
                  
                  <span style={{ display: 'inline-block', background: project.status === 'Concluído' ? '#10b98120' : (project.status === 'Pausado' ? '#e6394620' : '#00d2ff20'), color: project.status === 'Concluído' ? '#10b981' : (project.status === 'Pausado' ? '#e63946' : '#00d2ff'), padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px', marginBottom: '15px' }}>
                    {project.status || 'Em andamento'}
                  </span>

                  <p style={{ margin: '0 0 20px 0', color: textSecondary, fontSize: '13px', lineHeight: '1.5' }}>
                    {project.description || 'Nenhuma descrição fornecida.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderTop: cardBorder, paddingTop: '20px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Cliente / Construtora</span>
                      <span style={{ fontSize: '14px', color: textPrimary, fontWeight: '600' }}>{project.client_name || 'Não informado'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Endereço da Obra</span>
                      <span style={{ fontSize: '14px', color: textPrimary, fontWeight: '500' }}>{project.address || 'Não informado'}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Data de Início</span>
                      <span style={{ fontSize: '14px', color: textPrimary, fontWeight: '500' }}>{project.start_date ? new Date(project.start_date + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'Não informada'}</span>
                    </div>
                  </div>
                </div>

                {/* CARD DE EQUIPE */}
                <div style={{ background: cardBg, borderRadius: '16px', border: cardBorder, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: inputBg, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6f42c1' }}><UsersIcon /></div>
                    <div style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: '11px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Acesso ao Projeto</span>
                      <span style={{ fontSize: '14px', color: textPrimary, fontWeight: '600' }}>{totalUsers} pessoas na obra</span>
                    </div>
                  </div>
                  {isOwner && (
                    <button onClick={() => setIsManageAccessOpen(true)} style={{ width: '100%', marginTop: '15px', padding: '10px', background: inputBg, border: 'none', borderRadius: '8px', color: textPrimary, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#2a2a40' : '#e2e8f0'} onMouseLeave={(e) => e.currentTarget.style.background = inputBg}>
                      Gerenciar Equipe
                    </button>
                  )}
                </div>

                {/* TABELA DE APONTAMENTOS (ISSUES) - COM FILTROS E SCROLL */}
                <div style={{ background: cardBg, borderRadius: '16px', border: cardBorder, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: textPrimary, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><FlagIcon /> Apontamentos</h3>
                  
                  {/* Controles de Filtro */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <select 
                      value={issueFilterType} 
                      onChange={(e) => { setIssueFilterType(e.target.value); setIssueFilterValue(''); }}
                      style={{ padding: '8px', borderRadius: '6px', border: cardBorder, background: inputBg, color: textPrimary, fontSize: '12px', outline: 'none', cursor: 'pointer', flex: 1 }}
                    >
                      <option value="">Filtrar por...</option>
                      <option value="status">Status</option>
                      <option value="assigned_to">Responsável</option>
                      <option value="floor_plan">Planta</option>
                    </select>

                    {issueFilterType === 'status' && (
                      <select value={issueFilterValue} onChange={(e) => setIssueFilterValue(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: cardBorder, background: inputBg, color: textPrimary, fontSize: '12px', outline: 'none', cursor: 'pointer', flex: 1 }}>
                        <option value="">Todos</option>
                        <option value="open">Em Aberto</option>
                        <option value="resolved">Resolvido</option>
                      </select>
                    )}
                    {issueFilterType === 'assigned_to' && (
                      <select value={issueFilterValue} onChange={(e) => setIssueFilterValue(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: cardBorder, background: inputBg, color: textPrimary, fontSize: '12px', outline: 'none', cursor: 'pointer', flex: 1 }}>
                        <option value="">Todos</option>
                        {uniqueIssueAssignees.map(email => <option key={email} value={email}>{email.split('@')[0]}</option>)}
                      </select>
                    )}
                    {issueFilterType === 'floor_plan' && (
                      <select value={issueFilterValue} onChange={(e) => setIssueFilterValue(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: cardBorder, background: inputBg, color: textPrimary, fontSize: '12px', outline: 'none', cursor: 'pointer', flex: 1 }}>
                        <option value="">Todas</option>
                        {uniqueIssuePlans.map(pid => {
                          const pTitle = floorPlans.find(p => p.id === pid)?.title || 'Desconhecida';
                          return <option key={pid} value={pid}>{pTitle}</option>;
                        })}
                      </select>
                    )}
                  </div>
                  
                  {/* Tabela com Scroll */}
                  {filteredIssues.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '13px', color: textSecondary, textAlign: 'center', padding: '20px 0' }}>Nenhum problema encontrado.</p>
                  ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: cardBorder, borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: isDarkMode ? '#232336' : '#f5f7f9', zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: '10px', borderBottom: cardBorder, color: textSecondary, fontWeight: 'bold' }}>Status</th>
                            <th style={{ padding: '10px', borderBottom: cardBorder, color: textSecondary, fontWeight: 'bold' }}>Problema</th>
                            <th style={{ padding: '10px', borderBottom: cardBorder, color: textSecondary, fontWeight: 'bold' }}>Resp.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIssues.map(issue => (
                            <tr 
                              key={issue.id} 
                              onClick={() => handleOpenIssue(issue)}
                              style={{ borderBottom: cardBorder, cursor: 'pointer', transition: 'background 0.2s', color: textPrimary }}
                              onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#2a2a40' : '#f0f4f8'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              title={`Ver na Planta: ${floorPlans.find(p => p.id === issue.targets?.floor_plan_id)?.title || 'N/A'}`}
                            >
                              <td style={{ padding: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '10px', height: '10px', borderRadius: '50%', background: issue.status === 'open' ? '#e63946' : '#10b981' }} title={issue.status === 'open' ? 'Aberto' : 'Resolvido'}></div>
                              </td>
                              <td style={{ padding: '10px', fontWeight: '600' }}>
                                {issue.title}
                                <span style={{ display: 'block', fontSize: '10px', color: textSecondary, fontWeight: 'normal', marginTop: '2px' }}>
                                  {issue.targets?.name || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '10px', color: issue.assigned_to ? textPrimary : textSecondary }}>
                                {issue.assigned_to ? issue.assigned_to.split('@')[0] : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* ======================= COLUNA 2: CENTRAL (PLANTAS) ======================= */}
              <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* BARRA DE CONTROLE DE PLANTAS (FILTROS) */}
                <div style={{ background: cardBg, borderRadius: '16px', border: cardBorder, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 'bold', textTransform: 'uppercase' }}>Plantas Ativas</span>
                    <span style={{ fontSize: '24px', color: textPrimary, fontWeight: 'bold' }}>{floorPlans.length}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', background: inputBg, border: cardBorder, borderRadius: '8px', padding: '8px 15px', flex: 1, minWidth: '300px' }}>
                    <span style={{ color: textSecondary, marginRight: '8px', display: 'flex' }}><SearchIcon /></span>
                    <input type="text" placeholder="Buscar planta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: textPrimary, outline: 'none', width: '100%', fontSize: '13px' }}/>
                    
                    {/* NOVO SELECT PARA FILTRO DE STATUS DA PLANTA */}
                    <div style={{ borderLeft: `1px solid ${isDarkMode ? '#444' : '#ccc'}`, paddingLeft: '10px', marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
                      <select 
                        value={planFilterStatus} 
                        onChange={(e) => setPlanFilterStatus(e.target.value)} 
                        style={{ background: 'transparent', border: 'none', color: textSecondary, fontSize: '12px', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        <option value="">Todas as Plantas</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluído">Concluídas</option>
                      </select>
                    </div>
                  </div>

                  {isOwner && (
                    <button onClick={() => setShowUpload(!showUpload)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)', transition: 'transform 0.2s', fontSize: '13px' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      {showUpload ? 'Cancelar' : '+ Adicionar Planta'}
                    </button>
                  )}
                </div>

                {/* FORMULÁRIO DE NOVA PLANTA */}
                {showUpload && (
                  <form onSubmit={handleUploadPlan} style={{ background: cardBg, padding: '20px', borderRadius: '12px', border: cardBorder, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="text" placeholder="Nome da Planta (Ex: Térreo)" value={title} onChange={(e)=>setTitle(e.target.value)} required style={{ padding: '12px 15px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '6px', flex: 1, outline: 'none', minWidth: '200px' }} />
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: '250px' }}>
                        <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 'bold', width: '80px' }}>Imagem 2D:</span>
                        <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files[0])} required style={{ color: textSecondary, fontSize: '14px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: inputBg, borderRadius: '6px', flex: 1, padding: '10px 15px', gap: '10px', minWidth: '250px' }}>
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

                {/* TIMELINE GLOBAL DO PROJETO */}
                <div style={{ background: isDarkMode ? 'linear-gradient(180deg, #111 0%, #1a1a2e 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f4f7f6 100%)', borderRadius: '16px', padding: '25px', boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)', border: isDarkMode ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid rgba(0, 210, 255, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ClockIcon style={{ color: '#00d2ff', width: '20px', height: '20px' }} />
                        <h2 style={{ margin: 0, color: textPrimary, fontSize: '18px' }}>Evolução Global da Obra</h2>
                      </div>
                      <div style={{ background: isDarkMode ? 'rgba(0, 210, 255, 0.1)' : '#e0f7fa', padding: '4px 10px', borderRadius: '20px', color: isDarkMode ? '#00d2ff' : '#00838f', fontWeight: 'bold', fontSize: '12px' }}>
                        {new Date(sliderDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div style={{ margin: '20px 0 30px 0', position: 'relative' }}>
                      <input 
                        type="range" min={minDate} max={maxDate} step={86400000} value={sliderDate} onChange={(e) => setSliderDate(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#00d2ff', height: '4px', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: textSecondary, fontSize: '11px', fontWeight: 'bold' }}>
                        <span>Início: {new Date(minDate).toLocaleDateString('pt-BR')}</span>
                        <span>Hoje</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : inputBg, padding: '15px', borderRadius: '10px', border: cardBorder, textAlign: 'center' }}>
                        <span style={{ display: 'block', color: textSecondary, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Ambientes Totais</span>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: textPrimary, fontSize: '20px', fontWeight: 'bold' }}><PinIcon /> {timelineStats.targetsMapped}</div>
                      </div>
                      <div style={{ background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : inputBg, padding: '15px', borderRadius: '10px', border: cardBorder, textAlign: 'center' }}>
                        <span style={{ display: 'block', color: textSecondary, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Cenas Totais</span>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#00d2ff', fontSize: '20px', fontWeight: 'bold' }}><CameraIcon /> {timelineStats.scenesCount}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1', background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : inputBg, padding: '15px', borderRadius: '10px', border: cardBorder, textAlign: 'center' }}>
                        <span style={{ display: 'block', color: textSecondary, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Total de Visitas Registradas na Obra</span>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}><CalendarCheckIcon /> {timelineStats.visitsCount}</div>
                      </div>
                    </div>
                </div>
                
                {/* GRID DE PLANTAS COM SCROLL */}
                <div style={{ maxHeight: '700px', overflowY: 'auto', paddingRight: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {filteredPlans.map(plan => (
                      <div key={plan.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div 
                          onClick={() => setActivePlan(plan)}
                          style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', border: cardBorder, backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f0f0', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <img src={plan.image_url} alt={plan.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                            <span style={{ background: 'white', color: '#1a1a2e', padding: '8px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '13px' }}>Entrar na Planta</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 5px' }}>
                          <div>
                            <h3 style={{ margin: '0 0 6px 0', color: textPrimary, fontSize: '16px', fontWeight: '600', lineHeight: '1.2' }}>{plan.title}</h3>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {plan.status === 'Concluído' && <span style={{ background: '#10b98120', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>✓ Concluída</span>}
                              {plan.ifc_url && <span style={{ background: '#00d2ff20', color: '#00d2ff', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>BIM 3D</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredPlans.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', background: cardBg, border: cardBorder, borderRadius: '16px' }}><p style={{ color: textSecondary, margin: 0 }}>Nenhuma planta encontrada com esses filtros.</p></div>}
                </div>
              </div>

              {/* ======================= COLUNA 3: DIREITA (AGENDA) ======================= */}
              <div style={{ flex: '1 1 350px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* HEADER DA AGENDA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: cardBg, padding: '15px 20px', borderRadius: '12px', border: cardBorder, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <h2 style={{ margin: 0, color: textPrimary, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarPlusIcon /> Agenda de Vistorias
                  </h2>
                  {isOwner && (
                    <button onClick={() => setIsAgendaModalOpen(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                      + Agendar
                    </button>
                  )}
                </div>

                {/* CALENDÁRIO */}
                <div style={{ background: cardBg, borderRadius: '16px', border: cardBorder, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <button onClick={prevMonth} style={{ background: inputBg, border: 'none', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: textPrimary, display: 'flex' }}><ChevronLeftIcon /></button>
                    <strong style={{ color: textPrimary, fontSize: '15px', textTransform: 'capitalize' }}>{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
                    <button onClick={nextMonth} style={{ background: inputBg, border: 'none', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: textPrimary, display: 'flex' }}><ChevronRightIcon /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold', color: textSecondary }}>
                    <div>DOM</div><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SÁB</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                    {calendarDays.map((item, index) => {
                      if (!item) return <div key={`empty-${index}`} style={{ padding: '10px' }}></div>;
                      const isSelected = selectedAgendaDate === item.dateStr;
                      const reqsToday = captureRequests.filter(r => r.scheduled_date === item.dateStr);
                      return (
                        <div 
                          key={item.dateStr} onClick={() => setSelectedAgendaDate(isSelected ? null : item.dateStr)}
                          style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '4px', cursor: 'pointer', background: isSelected ? '#00d2ff20' : (reqsToday.length > 0 ? inputBg : 'transparent'), border: isSelected ? '1px solid #00d2ff' : '1px solid transparent', borderRadius: '8px', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = inputBg; }} onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = reqsToday.length > 0 ? inputBg : 'transparent'; }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: isSelected || reqsToday.length > 0 ? 'bold' : 'normal', color: isSelected ? '#00d2ff' : textPrimary }}>{item.day}</span>
                          {reqsToday.length > 0 && (
                            <div style={{ display: 'flex', gap: '2px', marginTop: 'auto', flexWrap: 'wrap', justifyContent: 'center' }}>
                              {reqsToday.map(r => {
                                let dotColor = '#e63946'; if (r.status === 'reschedule_requested') dotColor = '#f59e0b'; if (r.status === 'confirmed') dotColor = '#00d2ff'; if (r.status === 'completed') dotColor = '#10b981'; 
                                return <div key={r.id} style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: dotColor }}></div>;
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: cardBorder, display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '10px', color: textSecondary, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e63946' }}></div> Pendente</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d2ff' }}></div> Confirmado</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></div> Remarcar</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div> Concluído</div>
                  </div>
                </div>

                {/* LISTA DE AGENDAMENTOS COM SCROLL */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {selectedAgendaDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#00d2ff15', padding: '10px 15px', borderRadius: '8px', border: '1px solid #00d2ff40', position: 'sticky', top: 0, zIndex: 1 }}>
                      <span style={{ color: '#00d2ff', fontWeight: 'bold', fontSize: '12px' }}>Data: {new Date(selectedAgendaDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}</span>
                      <button onClick={() => setSelectedAgendaDate(null)} style={{ background: 'transparent', border: 'none', color: textPrimary, fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Limpar</button>
                    </div>
                  )}

                  {filteredRequests.length === 0 ? (
                    <div style={{ background: cardBg, padding: '30px', borderRadius: '12px', border: cardBorder, textAlign: 'center', color: textSecondary, fontSize: '13px' }}>
                      Nenhuma captura na agenda.
                    </div>
                  ) : (
                    filteredRequests.map(req => (
                      <div key={req.id} style={{ background: cardBg, borderRadius: '12px', border: cardBorder, padding: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                          <span style={{ background: req.status === 'completed' ? '#10b98120' : req.status === 'confirmed' ? '#00d2ff20' : req.status === 'reschedule_requested' ? '#f59e0b20' : '#e6394620', color: req.status === 'completed' ? '#10b981' : req.status === 'confirmed' ? '#00d2ff' : req.status === 'reschedule_requested' ? '#f59e0b' : '#e63946', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}>
                            {req.status === 'pending' && 'Pendente'}
                            {req.status === 'confirmed' && 'Confirmado'}
                            {req.status === 'reschedule_requested' && 'Remarcação'}
                            {req.status === 'completed' && 'Finalizado'}
                          </span>
                          <span style={{ fontSize: '11px', color: textSecondary, fontWeight: 'bold' }}>{new Date(req.scheduled_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}</span>
                        </div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: textPrimary }}>{req.title}</h3>
                        <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: textSecondary }}>Resp: <strong>{req.assigned_to.split('@')[0]}</strong></p>
                        
                        <div style={{ background: inputBg, padding: '8px', borderRadius: '6px', marginBottom: '12px' }}>
                          <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: textSecondary, marginBottom: '4px' }}>LOCAIS ({req.target_ids.length}):</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {req.target_ids.map(tid => {
                               const t = projectTargets.find(pt => pt.id === tid);
                               return <span key={tid} style={{ background: cardBg, border: cardBorder, padding: '2px 4px', borderRadius: '4px', fontSize: '10px', color: textPrimary }}>{t ? t.name : 'Apagado'}</span>
                            })}
                          </div>
                        </div>

                        {req.status !== 'completed' && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                            {(user.email === req.assigned_to || isOwner) && req.status === 'pending' && (
                              <button onClick={() => handleUpdateAgendaStatus(req.id, 'confirmed')} style={{ flex: 1, padding: '6px', background: '#00d2ff', color: '#1a1a2e', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Confirmar</button>
                            )}
                            <button onClick={() => handleProposeReschedule(req)} style={{ flex: 1, padding: '6px', background: 'transparent', color: textPrimary, border: `1px solid ${isDarkMode ? '#444' : '#ccc'}`, borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Remarcar</button>

                            {req.status === 'reschedule_requested' && (
                              <div style={{ width: '100%', background: '#f59e0b20', padding: '8px', borderRadius: '6px', border: '1px solid #f59e0b40', marginTop: '4px' }}>
                                <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>Sugerido: {new Date(req.reschedule_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}</p>
                                <button onClick={() => handleAcceptReschedule(req)} style={{ width: '100%', padding: '6px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Aceitar Data</button>
                              </div>
                            )}

                            {(user.email === req.assigned_to || isOwner) && req.status === 'confirmed' && (
                              <button onClick={() => handleUpdateAgendaStatus(req.id, 'completed')} style={{ width: '100%', padding: '6px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Finalizar</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}

        {/* MODAL DE EDITAR PROJETO */}
        {isEditProjectModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
              <div style={{ background: cardBg, width: '100%', maxWidth: '600px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', border: cardBorder, maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <div>
                        <h2 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '22px' }}>Editar Ficha Cadastral</h2>
                        <p style={{ margin: 0, color: textSecondary, fontSize: '14px' }}>Atualize as informações da obra.</p>
                      </div>
                      <button onClick={() => setIsEditProjectModalOpen(false)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: 0 }}><CloseIcon /></button>
                  </div>

                  <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                      <button type="submit" disabled={isProjectEditing} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isProjectEditing ? 'not-allowed' : 'pointer', fontSize: '16px', marginTop: '10px', opacity: isProjectEditing ? 0.7 : 1 }}>
                          {isProjectEditing ? 'Salvando...' : 'Salvar Ficha Cadastral'}
                      </button>
                  </form>
              </div>
          </div>
        )}

        {/* MODAL DE EDITAR PLANTA */}
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

        {/* MODAL DE MEMBROS */}
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

        {/* MODAL DE CRIAR AGENDAMENTO */}
        {isAgendaModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ background: cardBg, width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', border: cardBorder, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h2 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '22px' }}>Nova Solicitação</h2>
                  <p style={{ margin: 0, color: textSecondary, fontSize: '14px' }}>Agende uma visita para capturar fotos 360º.</p>
                </div>
                <button onClick={() => { setIsAgendaModalOpen(false); setReqTargets([]); }} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: 0 }}><CloseIcon /></button>
              </div>

              <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Motivo / Título *</label>
                  <input type="text" placeholder="Ex: Vistoria de Instalações Elétricas" value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Data Desejada *</label>
                    <input type="date" value={reqDate} onChange={(e) => setReqDate(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textSecondary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Responsável *</label>
                    <select value={reqAssignee} onChange={(e) => setReqAssignee(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}>
                      <option value="">Selecione...</option>
                      <option value={project?.user_email || user.email}>Dono do Projeto</option>
                      {projectMembers.map(m => <option key={m.user_email} value={m.user_email}>{m.user_email.split('@')[0]}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Ambientes a serem capturados *</label>
                  <div style={{ background: inputBg, padding: '15px', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', border: cardBorder }}>
                    {floorPlans.map(plan => {
                      const targetsInPlan = projectTargets.filter(t => t.floor_plan_id === plan.id);
                      if (targetsInPlan.length === 0) return null;
                      return (
                        <div key={plan.id} style={{ marginBottom: '10px' }}>
                          <strong style={{ display: 'block', fontSize: '12px', color: textSecondary, textTransform: 'uppercase', marginBottom: '5px' }}>{plan.title}</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {targetsInPlan.map(t => (
                              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: textPrimary, cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={reqTargets.includes(t.id)} 
                                  onChange={(e) => {
                                    if (e.target.checked) setReqTargets([...reqTargets, t.id]);
                                    else setReqTargets(reqTargets.filter(id => id !== t.id));
                                  }} 
                                />
                                {t.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {projectTargets.length === 0 && <p style={{ fontSize: '12px', color: textSecondary }}>Nenhum ambiente mapeado nas plantas ainda.</p>}
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}>
                  Agendar Captura
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}