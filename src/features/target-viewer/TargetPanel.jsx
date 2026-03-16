import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Pannellum } from 'pannellum-react';
import { useAuth } from '../../contexts/AuthContext';
import { logAction } from '../../services/logger';
import IfcViewer from '../ifc-viewer/IfcViewer';
import Select from 'react-select'; 

// --- Ícones Minimalistas ---
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const MoveIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const CalendarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const CompareIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>;
const CloudDownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17l4 4 4-4"></path><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>;
const LinkIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const BoxIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const MapPinIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const FlagIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>;
const CheckCircleIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

export default function TargetPanel({ target, onClose, onUpdateTarget, onDeleteTarget, onRepositionTarget, onChangeTarget, autoOpenIssue, setAutoOpenIssue }) {
  const { user } = useAuth();
  
  const [visits, setVisits] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  
  const [is360Open, setIs360Open] = useState(false);
  const [active360Url, setActive360Url] = useState(null); 
  
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareVisit, setCompareVisit] = useState(null);
  const [compare360Url, setCompare360Url] = useState(null);

  const [isBimMode, setIsBimMode] = useState(false);
  const [projectIfcUrl, setProjectIfcUrl] = useState(null);
  const [planImage, setPlanImage] = useState(null);
  const [allPlanTargets, setAllPlanTargets] = useState([]);

  const [isSynced, setIsSynced] = useState(false);
  const [activeSide, setActiveSide] = useState('left');
  const leftViewerRef = useRef(null);
  const rightViewerRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]); 
  const [pcLink, setPcLink] = useState('');
  const [uploading, setUploading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPcLink, setEditPcLink] = useState('');
  const [existingPhotos, setExistingPhotos] = useState([]); 
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([]); 
  const [editPhotoFiles, setEditPhotoFiles] = useState([]); 
  const editFileInputRef = useRef(null);

  const [issues, setIssues] = useState([]);
  const [isMarkingIssue, setIsMarkingIssue] = useState(false);
  const [showResolvedIssues, setShowResolvedIssues] = useState(false); 
  const [newIssueCoords, setNewIssueCoords] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueAssignee, setIssueAssignee] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('spbim_theme') === 'dark');
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDarkMode(localStorage.getItem('spbim_theme') === 'dark'));
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  const themeColor = '#00d2ff';
  const textPrimary = isDarkMode ? '#ffffff' : '#1a1a2e';
  const textSecondary = isDarkMode ? '#a0a0a0' : '#666666';
  const panelBg = isDarkMode ? '#1e1e1e' : '#ffffff';
  const border = isDarkMode ? '1px solid #333333' : '1px solid #eaeaea';
  const inputBg = isDarkMode ? '#2a2a2a' : '#f5f7f9';
  const hoverBg = isDarkMode ? '#333333' : '#f0f4f8';

  // === ESTILOS DO REACT-SELECT PREMIUM, DARK E FLUTUANTE ===
  const transparentSelectStyles = {
    control: (provided) => ({ ...provided, backgroundColor: 'transparent', border: 'none', boxShadow: 'none', cursor: 'pointer', minHeight: 'auto' }),
    singleValue: (provided) => ({ ...provided, color: 'white', fontWeight: 'bold', fontSize: '14px' }),
    menuPortal: (base) => ({ ...base, zIndex: 999999 }), 
    menu: (provided) => ({ ...provided, backgroundColor: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', overflow: 'hidden' }),
    option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? '#00d2ff' : state.isFocused ? 'rgba(255,255,255,0.1)' : 'transparent', color: state.isSelected ? '#1a1a2e' : '#fff', cursor: 'pointer', fontSize: '13px', padding: '10px 15px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (provided) => ({ ...provided, color: '#aaa', padding: '0px 4px', '&:hover': { color: '#fff' } })
  };

  const modalSelectStyles = {
    control: (provided, state) => ({ ...provided, backgroundColor: inputBg, borderColor: state.isFocused ? '#00d2ff' : (isDarkMode ? '#333333' : '#eaeaea'), borderRadius: '8px', boxShadow: state.isFocused ? '0 0 0 1px #00d2ff' : 'none', '&:hover': { borderColor: '#00d2ff' }, cursor: 'pointer', minHeight: '38px' }),
    menuPortal: (base) => ({ ...base, zIndex: 999999 }),
    menu: (provided) => ({ ...provided, backgroundColor: panelBg, borderRadius: '8px', border: border, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }),
    option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? '#00d2ff' : state.isFocused ? (isDarkMode ? '#333333' : '#f0f4f8') : 'transparent', color: state.isSelected ? '#1a1a2e' : textPrimary, cursor: 'pointer', fontSize: '13px', fontWeight: state.isSelected ? 'bold' : 'normal', '&:active': { backgroundColor: '#00d2ff', color: '#1a1a2e' } }),
    singleValue: (provided) => ({ ...provided, color: textPrimary, fontSize: '13px', fontWeight: '500' }),
    placeholder: (provided) => ({ ...provided, color: textSecondary, fontSize: '13px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (provided) => ({ ...provided, color: textSecondary, '&:hover': { color: '#00d2ff' } })
  };

  useEffect(() => {
    if (!target) return;
    const fetchVisitsAndProject = async () => {
      const { data } = await supabase.from('visits').select('*, visit_photos(*)').eq('target_id', target.id).order('visit_date', { ascending: false });
      if (data && data.length > 0) { 
        setVisits(data); setActiveVisit(data[0]); setActive360Url(data[0].media_url); 
      } else { 
        setVisits([]); setActiveVisit(null); setActive360Url(null);
        if (is360Open) { alert(`O ambiente "${target.name}" ainda não possui capturas.`); setIs360Open(false); }
      }
      if (target.floor_plan_id) {
        const { data: planData } = await supabase.from('floor_plans').select('ifc_url, image_url').eq('id', target.floor_plan_id).single();
        if (planData) { if (planData.ifc_url) setProjectIfcUrl(planData.ifc_url); if (planData.image_url) setPlanImage(planData.image_url); }
        const { data: allTargetsData } = await supabase.from('targets').select('*').eq('floor_plan_id', target.floor_plan_id);
        if (allTargetsData) setAllPlanTargets(allTargetsData);
      }
      if (target.project_id) {
        const { data: members } = await supabase.from('project_members').select('user_email').eq('project_id', target.project_id);
        if (members) setProjectMembers(members.map(m => m.user_email));
      }
    };
    fetchVisitsAndProject();
  }, [target]);

  useEffect(() => {
    if (active360Url) {
      const fetchIssues = async () => {
        const { data } = await supabase.from('issues').select('*').eq('media_url', active360Url);
        setIssues(data || []);
      };
      fetchIssues();
    } else { setIssues([]); }
  }, [active360Url]);
    
  useEffect(() => {
    let animationFrameId;
    const syncViews = () => {
      if (isSynced && isCompareMode && leftViewerRef.current && rightViewerRef.current) {
        try {
          const leftViewer = leftViewerRef.current.getViewer();
          const rightViewer = rightViewerRef.current.getViewer();
          if (leftViewer && rightViewer) {
            if (activeSide === 'left') { rightViewer.setPitch(leftViewer.getPitch(), false); rightViewer.setYaw(leftViewer.getYaw(), false); rightViewer.setHfov(leftViewer.getHfov(), false); } 
            else if (activeSide === 'right') { leftViewer.setPitch(rightViewer.getPitch(), false); leftViewer.setYaw(rightViewer.getYaw(), false); leftViewer.setHfov(rightViewer.getHfov(), false); }
          }
        } catch (e) {}
      }
      animationFrameId = requestAnimationFrame(syncViews);
    };
    if (isSynced && isCompareMode) syncViews();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSynced, isCompareMode, activeSide]);

  const toggleCompareMode = () => {
    if (!isCompareMode) {
      setIsBimMode(false);
      const defaultCompare = visits.length > 1 ? visits.find(v => v.id !== activeVisit.id) || visits[0] : visits[0];
      setCompareVisit(defaultCompare); setCompare360Url(defaultCompare?.media_url); setIsCompareMode(true);
    } else {
      setIsCompareMode(false); setCompareVisit(null); setCompare360Url(null); setIsSynced(false);
    }
  };

  useEffect(() => {
    if (autoOpenIssue && visits.length > 0) {
      const issueVisit = visits.find(v => v.media_url === autoOpenIssue.media_url || (v.visit_photos && v.visit_photos.some(p => p.url === autoOpenIssue.media_url)));
      if (issueVisit) {
        setActiveVisit(issueVisit); setActive360Url(autoOpenIssue.media_url); setIs360Open(true); setSelectedIssue(autoOpenIssue);
        if (setAutoOpenIssue) setAutoOpenIssue(null); 
      }
    }
  }, [autoOpenIssue, visits, setAutoOpenIssue]);

  const toggleBimMode = () => {
    if (!isBimMode) { setIsCompareMode(false); setIsSynced(false); setIsBimMode(true); } 
    else { setIsBimMode(false); }
  };

  const handleEditTarget = async () => { /* Mantido */ };
  const handleDeleteTarget = async () => { /* Mantido */ };
  const removeNewPhotoFromCreation = (indexToRemove) => { setPhotoFiles(prev => prev.filter((_, index) => index !== indexToRemove)); };
  
  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (photoFiles.length === 0) return alert("Adicione pelo menos 1 foto 360º para a captura!");
    if (!title || !date) return alert("Preencha o título e a data!");
    setUploading(true);

    try {
      const coverFile = photoFiles[0];
      const safeCoverName = `visitas/capa_${Date.now()}_${Math.random().toString(36).substring(7)}.${coverFile.name.split('.').pop()}`;
      await supabase.storage.from('plantas').upload(safeCoverName, coverFile);
      const { data: coverUrlData } = supabase.storage.from('plantas').getPublicUrl(safeCoverName);

      const { data: newVisitData, error: dbError } = await supabase.from('visits').insert([{ 
        target_id: target.id, 
        floor_plan_id: target.floor_plan_id,
        title: title, 
        visit_date: date, 
        media_url: coverUrlData.publicUrl, 
        point_cloud_url: pcLink || null 
      }]).select();
      
      if (dbError) throw dbError;
      
      const newVisit = newVisitData[0];
      newVisit.visit_photos = []; 

      if (photoFiles.length > 1) {
        const extraPhotosToInsert = [];
        for (const file of photoFiles.slice(1)) {
          const safeName = `visitas/extra_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
          await supabase.storage.from('plantas').upload(safeName, file);
          const { data: urlData } = supabase.storage.from('plantas').getPublicUrl(safeName);
          extraPhotosToInsert.push({ visit_id: newVisit.id, url: urlData.publicUrl });
        }
        if (extraPhotosToInsert.length > 0) {
          const { data: insertedExtras } = await supabase.from('visit_photos').insert(extraPhotosToInsert).select();
          newVisit.visit_photos = insertedExtras || [];
        }
      }

      await logAction(user.email, 'UPLOAD DE VISITA', `Adicionou a visita "${title}" com ${photoFiles.length} foto(s)`);
      setVisits([newVisit, ...visits].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))); 
      setActiveVisit(newVisit); 
      setShowForm(false);
      setTitle(''); setDate(''); setPhotoFiles([]); setPcLink(''); 
    } catch (error) { 
      alert("Erro ao salvar: " + error.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const openEditModal = (visit, e) => {
    e.stopPropagation(); 
    setVisitToEdit(visit);
    setEditTitle(visit.title);
    setEditDate(visit.visit_date);
    setEditPcLink(visit.point_cloud_url || '');
    
    const dbPhotos = [];
    if (visit.media_url) {
      dbPhotos.push({ id: 'cover', url: visit.media_url, isNew: false });
    }
    if (visit.visit_photos && visit.visit_photos.length > 0) {
      visit.visit_photos.forEach(p => {
        dbPhotos.push({ id: p.id, url: p.url, isNew: false });
      });
    }
    
    setExistingPhotos(dbPhotos);
    setDeletedPhotoIds([]);
    setEditPhotoFiles([]);
    setIsEditModalOpen(true);
  };

  const removeExistingPhoto = (photo) => {
    setExistingPhotos(prev => prev.filter(p => p.id !== photo.id));
    if (photo.id !== 'cover') {
      setDeletedPhotoIds(prev => [...prev, photo.id]);
    }
  };

  const removeNewPhotoFromEdit = (indexToRemove) => {
    setEditPhotoFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const submitEditVisit = async (e) => {
    e.preventDefault();
    if (existingPhotos.length === 0 && editPhotoFiles.length === 0) {
      return alert("A captura precisa ter pelo menos 1 imagem 360º!");
    }
    setUploading(true);

    try {
      let finalMediaUrl = visitToEdit.media_url;

      // 1. Apaga as fotos deletadas do banco
      if (deletedPhotoIds.length > 0) {
        await supabase.from('visit_photos').delete().in('id', deletedPhotoIds);
      }

      const hasOriginalCover = existingPhotos.some(p => p.id === 'cover');
      let extrasToUpload = [...editPhotoFiles];

      // 2. Se a capa original foi deletada, elege uma nova
      if (!hasOriginalCover) {
        if (existingPhotos.length > 0) {
          finalMediaUrl = existingPhotos[0].url;
          await supabase.from('visit_photos').delete().eq('id', existingPhotos[0].id);
        } else if (editPhotoFiles.length > 0) {
          const coverFile = editPhotoFiles[0];
          const safeCoverName = `visitas/capa_${Date.now()}_${Math.random().toString(36).substring(7)}.${coverFile.name.split('.').pop()}`;
          const { error: coverUploadError } = await supabase.storage.from('plantas').upload(safeCoverName, coverFile);
          if (coverUploadError) throw coverUploadError;
          const { data: coverData } = supabase.storage.from('plantas').getPublicUrl(safeCoverName);
          finalMediaUrl = coverData.publicUrl;
          extrasToUpload = editPhotoFiles.slice(1);
        }
      }

      // 3. Sobescreve as novas fotos extras
      if (extrasToUpload.length > 0) {
        const extraPhotosToInsert = [];
        for (const file of extrasToUpload) {
          const safeName = `visitas/extra_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
          const { error: extraUploadError } = await supabase.storage.from('plantas').upload(safeName, file);
          if (extraUploadError) throw extraUploadError;
          const { data: urlData } = supabase.storage.from('plantas').getPublicUrl(safeName);
          extraPhotosToInsert.push({ visit_id: visitToEdit.id, url: urlData.publicUrl });
        }
        if (extraPhotosToInsert.length > 0) {
            const { error: insertExtraError } = await supabase.from('visit_photos').insert(extraPhotosToInsert);
            if (insertExtraError) throw insertExtraError;
        }
      }

      // 4. Atualiza os dados de texto
      const { error: updateError } = await supabase.from('visits').update({ 
        title: editTitle, visit_date: editDate, media_url: finalMediaUrl, point_cloud_url: editPcLink || null 
      }).eq('id', visitToEdit.id);
      
      if (updateError) throw updateError;

      // 5. Refaz a busca para garantir os dados 100% atualizados na interface
      const { data: refreshed, error: refreshError } = await supabase.from('visits').select('*, visit_photos(*)').eq('target_id', target.id).order('visit_date', { ascending: false });
      if (refreshError) throw refreshError;

      setVisits(refreshed);
      
      const updatedVisit = refreshed.find(v => v.id === visitToEdit.id);
      if (activeVisit?.id === visitToEdit.id) { 
        setActiveVisit(updatedVisit);
        setActive360Url(finalMediaUrl); 
      }
      if (compareVisit?.id === visitToEdit.id) {
        setCompareVisit(updatedVisit);
        setCompare360Url(finalMediaUrl);
      }

      await logAction(user.email, 'EDIÇÃO DE VISITA', `Editou a visita "${editTitle}"`);
      setIsEditModalOpen(false);
      
    } catch (error) { 
      console.error("Erro completo na edição:", error);
      alert("Erro ao salvar edição: " + error.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleDeleteVisit = async (visitId, visitTitle, e) => {
    e.stopPropagation();
    if (!window.confirm(`⚠️ Apagar a visita "${visitTitle}"?`)) return;
    const { error } = await supabase.from('visits').delete().eq('id', visitId);
    if (!error) {
      const updatedVisits = visits.filter(v => v.id !== visitId);
      setVisits(updatedVisits);
      if (activeVisit?.id === visitId) { 
        setActiveVisit(updatedVisits.length > 0 ? updatedVisits[0] : null); 
        setIs360Open(false); setIsCompareMode(false); setIsSynced(false); setIsBimMode(false); 
      }
      if (compareVisit?.id === visitId) { setIsCompareMode(false); setIsSynced(false); }
      await logAction(user.email, 'EXCLUSÃO DE VISITA', `Apagou a visita "${visitTitle}"`);
    }
  };

  const getBundlePhotos = (visit) => {
    if (!visit) return []; return [{ id: 'capa', url: visit.media_url }, ...(visit.visit_photos || [])];
  };

  const handleViewerPointerUp = (e) => {
    if (!isMarkingIssue) return;
    const viewer = leftViewerRef.current?.getViewer();
    if (viewer) {
      try {
        const [pitch, yaw] = viewer.mouseEventToCoords(e.nativeEvent);
        setNewIssueCoords({ pitch, yaw });
        setIsMarkingIssue(false); 
      } catch (err) { console.error("Erro", err); }
    }
  };

  const handleSaveIssue = async (e) => {
    e.preventDefault();
    if (!issueTitle) return alert("Dê um título ao problema!");
    setUploading(true);
    try {
      const { data, error } = await supabase.from('issues').insert([{
        project_id: target.project_id, target_id: target.id, media_url: active360Url, pitch: newIssueCoords.pitch, yaw: newIssueCoords.yaw,
        title: issueTitle, description: issueDesc, assigned_to: issueAssignee || null, created_by: user.email
      }]).select();
      if (error) throw error;
      setIssues([...issues, data[0]]);
      setNewIssueCoords(null); setIssueTitle(''); setIssueDesc(''); setIssueAssignee('');
    } catch (error) { alert("Erro ao salvar ocorrência: " + error.message); } finally { setUploading(false); }
  };

  const handleResolveIssue = async () => {
    try {
      const { error } = await supabase.from('issues').update({ status: 'resolved', resolved_by: user.email, resolved_at: new Date().toISOString() }).eq('id', selectedIssue.id);
      if (error) throw error;
      const updated = { ...selectedIssue, status: 'resolved', resolved_by: user.email, resolved_at: new Date().toISOString() };
      setIssues(issues.map(i => i.id === updated.id ? updated : i));
      setSelectedIssue(updated);
    } catch(e) { alert("Erro ao resolver: " + e.message); }
  };

  const handleDeleteIssue = async () => {
    if (!window.confirm("Apagar este apontamento definitivamente?")) return;
    try {
      const { error } = await supabase.from('issues').delete().eq('id', selectedIssue.id);
      if (error) throw error;
      setIssues(issues.filter(i => i.id !== selectedIssue.id));
      setSelectedIssue(null);
    } catch(e) { alert("Erro ao apagar: " + e.message); }
  };

  const visibleIssues = showResolvedIssues ? issues : issues.filter(i => i.status === 'open');

  const renderIssueHotspots = () => {
    return visibleIssues.map(issue => {
      return (
        <Pannellum.Hotspot 
          key={`hs-${issue.id}-${issue.status}`} 
          type="custom" pitch={Number(issue.pitch)} yaw={Number(issue.yaw)}     
          cssClass={`custom-hotspot custom-hotspot-${issue.status}`} 
          handleClick={(evt, args) => setSelectedIssue(args.issue)} handleClickArg={{ issue }}
          tooltip={(hotSpotDiv, args) => {
              if (!hotSpotDiv.hasAttribute('data-setup')) {
                  hotSpotDiv.setAttribute('data-setup', 'true');
                  hotSpotDiv.classList.add('custom-hotspot', `custom-hotspot-${args.issue.status}`);
                  hotSpotDiv.onclick = () => { args.onClickFn(args.issue) };
              }
          }}
          tooltipArg={{ issue, onClickFn: setSelectedIssue }}
        />
      );
    });
  };

  const renderMiniMap = () => {
    if (!planImage) return null;
    return (
      <div style={{ position: 'absolute', top: '75px', left: '20px', width: '220px', boxSizing: 'border-box', aspectRatio: '4/3', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', overflow: 'hidden', zIndex: 10002, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
        <img src={planImage} alt="Minimapa" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.9 }} />
        {allPlanTargets.map(t => {
            const isActive = t.id === target.id;
            return (
                <div key={`minimap-pin-${t.id}`} style={{ position: 'absolute', left: `${t.coord_x}%`, top: `${t.coord_y}%`, width: isActive ? '14px' : '10px', height: isActive ? '14px' : '10px', backgroundColor: isActive ? '#00d2ff' : '#aaaaaa', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: isActive ? '2px solid white' : '1px solid rgba(255,255,255,0.8)', boxShadow: isActive ? '0 0 10px rgba(0,210,255,0.8)' : '0 2px 5px rgba(0,0,0,0.5)', zIndex: isActive ? 10 : 5 }} title={t.name} />
            );
        })}
      </div>
    );
  };

  if (!target) return null;
  const isSplitScreenActive = isCompareMode || isBimMode;
  
  return (
    <>
      <style>{`
        .custom-hotspot { width: 28px !important; height: 28px !important; border: 3px solid white !important; border-radius: 50% !important; box-shadow: 0 0 15px rgba(0,0,0,0.5) !important; cursor: pointer !important; display: flex !important; justify-content: center !important; align-items: center !important; color: white !important; font-weight: bold !important; font-family: sans-serif !important; font-size: 14px !important; transition: transform 0.2s !important; }
        .custom-hotspot:hover { transform: scale(1.2) !important; }
        .custom-hotspot-open { background-color: #e63946 !important; }
        .custom-hotspot-open::after { content: "!" !important; }
        .custom-hotspot-resolved { background-color: #10b981 !important; }
        .custom-hotspot-resolved::after { content: "✓" !important; }
        /* Barra de rolagem padronizada */
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#444444' : '#c1c1c1'}; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#00d2ff' : '#888'}; }
      `}</style>
      
      {/* ===================================================================== */}
      {/* PAINEL LATERAL DIREITO DA PLANTA 2D                                   */}
      {/* ===================================================================== */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh', backgroundColor: panelBg, boxShadow: '-4px 0 30px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '30px', boxSizing: 'border-box', borderLeft: border, transition: 'background-color 0.3s' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: border, paddingBottom: '15px', marginBottom: '25px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: textPrimary, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {target.name}
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={handleEditTarget} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} title="Editar Nome" onMouseEnter={(e)=>e.currentTarget.style.color='#00d2ff'} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}><EditIcon /></button>
                <button onClick={() => onRepositionTarget(target)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} title="Mover Pino na Planta" onMouseEnter={(e)=>e.currentTarget.style.color='#6f42c1'} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}><MoveIcon /></button>
                <button onClick={handleDeleteTarget} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} title="Apagar Ambiente" onMouseEnter={(e)=>e.currentTarget.style.color='#e63946'} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}><TrashIcon /></button>
              </div>
            </h2>
            <span style={{ fontSize: '13px', color: textSecondary }}>Histórico de capturas do ambiente</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }} onMouseEnter={(e)=>e.currentTarget.style.color=textPrimary} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}><CloseIcon /></button>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <div onClick={() => { if (activeVisit) { setActive360Url(activeVisit.media_url); setIs360Open(true); } }} style={{ width: '100%', height: '220px', backgroundColor: inputBg, borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: activeVisit ? 'pointer' : 'default', position: 'relative', border: border }}>
            {activeVisit ? (
              <>
                <img src={activeVisit.media_url} alt="visita" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.3)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.95)', color: '#1a1a2e', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                    <EyeIcon /> Visualizador 360º
                  </div>
                </div>
              </>
            ) : <p style={{ color: textSecondary, fontSize: '14px' }}>Nenhuma captura registrada.</p>}
          </div>
        </div>

        <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: textPrimary, fontSize: '18px' }}>Linha do Tempo</h3>
            <button 
              onClick={() => setShowForm(!showForm)} 
              style={{ 
                padding: '8px 16px', 
                background: showForm ? 'transparent' : 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', 
                color: showForm ? textSecondary : '#fff', 
                border: showForm ? `1px solid #555` : '1px solid transparent', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: 'bold',
                boxSizing: 'border-box'
              }}
            >
              {showForm ? 'Cancelar' : '+ Nova Captura'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddVisit} style={{ background: inputBg, padding: '20px', borderRadius: '12px', border: border, marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Título (Ex: Pós-Gesso)" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '12px', border: 'none', borderRadius: '6px', background: panelBg, color: textPrimary, outline: 'none' }}/>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: '12px', border: 'none', borderRadius: '6px', background: panelBg, color: textSecondary, outline: 'none', colorScheme: isDarkMode ? 'dark' : 'light' }}/>
              
              <div style={{ background: panelBg, padding: '12px', borderRadius: '6px', border: border }}>
                <span style={{ fontSize: '13px', color: textPrimary, fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Imagens 360º</span>
                
                {photoFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '5px' }}>
                    {photoFiles.map((file, index) => (
                      <div key={`new-${index}`} style={{ position: 'relative', minWidth: '70px', width: '70px', height: '50px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${isDarkMode ? '#444' : '#ccc'}` }}>
                        <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeNewPhotoFromCreation(index)} style={{ position: 'absolute', top: '2px', right: '2px', background: '#e63946', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                        {index === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '9px', textAlign: 'center', fontWeight: 'bold', padding: '2px 0' }}>Capa</span>}
                      </div>
                    ))}
                  </div>
                )}
                
                <label style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: inputBg, padding: '10px', borderRadius: '6px', cursor: 'pointer', border: `1px dashed ${textSecondary}`, color: textSecondary, fontSize: '13px', fontWeight: 'bold' }}>
                  <PlusIcon /> Adicionar Fotos
                  <input type="file" multiple accept="image/*" onChange={(e) => { setPhotoFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }} style={{ display: 'none' }} />
                </label>
                <span style={{ fontSize: '11px', color: textSecondary, display: 'block', marginTop: '6px', textAlign: 'center' }}>{photoFiles.length} foto(s) na fila.</span>
              </div>

              <input type="url" placeholder="Link da Nuvem de Pontos" value={pcLink} onChange={(e) => setPcLink(e.target.value)} style={{ padding: '12px', border: 'none', borderRadius: '6px', background: panelBg, color: textPrimary, outline: 'none', fontSize: '13px' }}/>
              <button 
                type="submit" 
                disabled={uploading} 
                style={{ 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: 'bold', 
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)'
                }}
              >
                {uploading ? 'Salvando...' : 'Salvar Captura'}
              </button>
            </form>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visits.map(visit => {
              const isActive = activeVisit?.id === visit.id;
              return (
                <div 
                  key={visit.id} 
                  onClick={() => setActiveVisit(visit)} 
                  style={{ 
                    padding: '15px', 
                    border: isActive ? `1px solid #ffffff` : border,
                    backgroundColor: isActive ? (isDarkMode ? '#222222' : '#f0faff') : inputBg, 
                    borderRadius: '10px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 0 10px rgba(0, 210, 255, 0.1)' : 'none'
                  }} 
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = hoverBg)} 
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = inputBg)}
                >
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '15px', color: textPrimary, marginBottom: '4px' }}>{visit.title}</strong>
                    <span style={{ fontSize: '13px', color: isActive ? '#ffffff' : textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarIcon /> {new Date(visit.visit_date).toLocaleDateString('pt-BR')} • {getBundlePhotos(visit).length} foto(s)</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {visit.point_cloud_url && (<a href={visit.point_cloud_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#ffffff' : textSecondary, padding: 0, display: 'flex', transition: 'color 0.2s' }} title="Baixar Nuvem de Pontos" onMouseEnter={(e)=>e.currentTarget.style.color='#00d2ff'} onMouseLeave={(e)=>e.currentTarget.style.color= isActive ? '#ffffff' : textSecondary}><CloudDownloadIcon /></a>)}
                      <button onClick={(e) => openEditModal(visit, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#ffffff' : textSecondary, padding: 0, display: 'flex', transition: 'color 0.2s' }} title="Editar Visita" onMouseEnter={(e)=>e.currentTarget.style.color='#00d2ff'} onMouseLeave={(e)=>e.currentTarget.style.color= isActive ? '#ffffff' : textSecondary}><EditIcon /></button>
                      <button onClick={(e) => handleDeleteVisit(visit.id, visit.title, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#ffffff' : textSecondary, padding: 0, display: 'flex', transition: 'color 0.2s' }} title="Apagar Visita" onMouseEnter={(e)=>e.currentTarget.style.color='#e63946'} onMouseLeave={(e)=>e.currentTarget.style.color= isActive ? '#ffffff' : textSecondary}><TrashIcon /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL DE EDIÇÃO DE CAPTURA (VISITA)                                   */}
      {/* ===================================================================== */}
      {isEditModalOpen && visitToEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10005 }}>
          <div style={{ background: panelBg, width: '100%', maxWidth: '550px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.3)', border: border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', color: textPrimary, fontSize: '22px' }}>Editar Captura</h2>
                <p style={{ margin: 0, color: textSecondary, fontSize: '14px' }}>Atualize os dados e imagens desta visita.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', padding: 0 }}><CloseIcon /></button>
            </div>

            <form onSubmit={submitEditVisit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textPrimary, fontWeight: '600' }}>Título da Visita</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textPrimary, fontWeight: '600' }}>Data da Captura</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textSecondary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', colorScheme: isDarkMode ? 'dark' : 'light' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textPrimary, fontWeight: '600' }}>Imagens 360º</label>
                
                <div style={{ background: inputBg, padding: '15px', borderRadius: '8px', border: border }}>
                  
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                    {existingPhotos.map((photo, index) => (
                      <div key={photo.id} style={{ position: 'relative', minWidth: '80px', width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${isDarkMode ? '#444' : '#ccc'}` }}>
                        <img src={photo.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeExistingPhoto(photo)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(230, 57, 70, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                        {index === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', padding: '2px 0' }}>Capa</span>}
                      </div>
                    ))}

                    {editPhotoFiles.map((file, index) => (
                      <div key={`new-${index}`} style={{ position: 'relative', minWidth: '80px', width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: `2px solid #00d2ff` }}>
                        <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeNewPhotoFromEdit(index)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(230, 57, 70, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                        <span style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: '#00d2ff', color: '#1a1a2e', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', padding: '2px 0' }}>NOVA</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={() => editFileInputRef.current.click()}
                    style={{ width: '100%', padding: '10px', background: 'transparent', color: textPrimary, border: `1px dashed ${textSecondary}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00d2ff'; e.currentTarget.style.color = '#00d2ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = textSecondary; e.currentTarget.style.color = textPrimary; }}
                  >
                    <PlusIcon /> Adicionar mais fotos
                  </button>
                  <input type="file" ref={editFileInputRef} multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => { setEditPhotoFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }} />
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: textSecondary, textAlign: 'center' }}>Total na fila: {existingPhotos.length + editPhotoFiles.length} foto(s)</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: textPrimary, fontWeight: '600' }}>Link da Nuvem de Pontos (Opcional)</label>
                <input type="url" value={editPcLink} onChange={(e) => setEditPcLink(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <button 
                type="submit" 
                disabled={uploading} 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: 'linear-gradient(135deg, #6f42c1 0%, #00d2ff 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  cursor: uploading ? 'not-allowed' : 'pointer', 
                  fontSize: '16px', 
                  marginTop: '10px', 
                  opacity: uploading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(111, 66, 193, 0.2)'
                }}
              >
                {uploading ? 'Salvando alterações...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 360º E SISTEMA DE PROBLEMAS (ISSUES)                            */}
      {/* ===================================================================== */}
      {is360Open && activeVisit && active360Url && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: isSplitScreenActive ? '95vw' : '85vw', height: isSplitScreenActive ? '90vh' : '85vh', maxWidth: isSplitScreenActive ? '1600px' : '1300px', backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px', backgroundColor: '#111', color: 'white', zIndex: 10010, position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              
              {/* SELECT DE AMBIENTE PREMIUM */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <MapPinIcon style={{ color: '#00d2ff' }} />
                <div style={{ minWidth: '180px' }}>
                  <Select 
                    styles={transparentSelectStyles} isSearchable={false}
                    menuPortalTarget={document.body} menuPosition="fixed"
                    options={allPlanTargets.map(t => ({ value: t.id, label: t.name }))}
                    value={{ value: target.id, label: target.name }}
                    onChange={(sel) => { const newTarget = allPlanTargets.find(t => t.id === sel.value); if (newTarget && onChangeTarget) onChangeTarget(newTarget); }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                
                {/* === BOTÃO DE MOSTRAR RESOLVIDOS === */}
                <button 
                  onClick={() => setShowResolvedIssues(!showResolvedIssues)}
                  style={{ background: showResolvedIssues ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: showResolvedIssues ? '#10b981' : '#888', border: showResolvedIssues ? '1px solid #10b981' : 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', padding: '6px 10px', borderRadius: '8px' }}
                  title={showResolvedIssues ? "Ocultar Resolvidos" : "Mostrar Resolvidos"}
                >
                  <CheckCircleIcon /> <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: 'bold' }}>{showResolvedIssues ? 'Ocultar Resolvidos' : 'Ver Resolvidos'}</span>
                </button>

                {/* === BOTÃO DE APONTAR PROBLEMA === */}
                <button 
                  onClick={() => { setIsMarkingIssue(!isMarkingIssue); setNewIssueCoords(null); }}
                  style={{ background: isMarkingIssue ? '#e63946' : 'transparent', color: isMarkingIssue ? 'white' : '#e63946', border: '1px solid #e63946', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', padding: '6px 15px', borderRadius: '8px' }}
                  title="Apontar Problema na Obra"
                >
                  <FlagIcon /> <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: 'bold' }}>{isMarkingIssue ? 'Cancelar Apontamento' : 'Apontar Problema'}</span>
                </button>

                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>

                {isCompareMode && (<button onClick={() => setIsSynced(!isSynced)} style={{ background: isSynced ? 'rgba(0, 210, 255, 0.2)' : 'transparent', color: isSynced ? '#00d2ff' : '#888', border: isSynced ? '1px solid #00d2ff' : 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', padding: '6px 10px', borderRadius: '8px' }} title={isSynced ? "Desativar Sincronização" : "Sincronizar Visão"}><LinkIcon /> <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: 'bold' }}>Sincronizar</span></button>)}
                <button onClick={toggleBimMode} style={{ background: 'transparent', color: isBimMode ? '#00d2ff' : '#888', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }} onMouseEnter={(e)=>e.currentTarget.style.color='white'} onMouseLeave={(e)=>e.currentTarget.style.color= isBimMode ? '#00d2ff' : '#888'} title={isBimMode ? "Fechar Modelo BIM" : "BIM vs 360"}><BoxIcon /></button>
                <button onClick={toggleCompareMode} style={{ background: 'transparent', color: isCompareMode ? '#00d2ff' : '#888', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }} onMouseEnter={(e)=>e.currentTarget.style.color='white'} onMouseLeave={(e)=>e.currentTarget.style.color= isCompareMode ? '#00d2ff' : '#888'} title={isCompareMode ? "Sair da Comparação" : "Comparar Visitas"}><CompareIcon /></button>
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
                <button onClick={() => { setIs360Open(false); setIsCompareMode(false); setIsBimMode(false); setIsSynced(false); setIsMarkingIssue(false); setNewIssueCoords(null); setShowResolvedIssues(false); }} style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', padding: 0 }}><CloseIcon /></button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flex: 1, width: '100%', height: 'calc(100% - 60px)' }}>
              
              <div 
                style={{ flex: 1, position: 'relative', borderRight: isSplitScreenActive ? '2px solid rgba(255,255,255,0.1)' : 'none', cursor: isMarkingIssue ? 'crosshair' : 'default' }} 
                onMouseEnter={() => setActiveSide('left')} 
                onPointerUp={handleViewerPointerUp}
              >
                
                {isMarkingIssue && (
                  <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#e63946', color: 'white', padding: '10px 20px', borderRadius: '30px', zIndex: 10003, fontWeight: 'bold', boxShadow: '0 4px 15px rgba(230, 57, 70, 0.4)', pointerEvents: 'none' }}>
                    📍 Clique no local exato do problema na imagem.
                  </div>
                )}

                {/* SELECT DE DATA DA ESQUERDA PREMIUM */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10002, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '8px 15px', borderRadius: '8px', color: 'white', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                  <CalendarIcon />
                  <div style={{ minWidth: '220px' }}>
                    <Select 
                      styles={transparentSelectStyles} isSearchable={false}
                      menuPortalTarget={document.body} menuPosition="fixed"
                      options={visits.map(v => ({ value: v.id, label: `${new Date(v.visit_date).toLocaleDateString('pt-BR')} - ${v.title}` }))}
                      value={{ value: activeVisit.id, label: `${new Date(activeVisit.visit_date).toLocaleDateString('pt-BR')} - ${activeVisit.title}` }}
                      onChange={(sel) => { const v = visits.find(v => v.id === sel.value); setActiveVisit(v); setActive360Url(v.media_url); }}
                    />
                  </div>
                </div>

                {renderMiniMap()}

                <Pannellum 
                  ref={leftViewerRef} 
                  id="viewer-left-360" 
                  key={`left-${active360Url}-comp-${isCompareMode}`} 
                  width="100%" 
                  height="100%" 
                  image={active360Url} 
                  pitch={0} 
                  yaw={180} 
                  hfov={100} 
                  autoLoad 
                  showZoomCtrl={false} 
                  showFullscreenCtrl={false}
                >
                   {renderIssueHotspots()}
                </Pannellum>
                
                <div className="custom-scroll" style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '12px', overflowX: 'auto', maxWidth: '85%', zIndex: 10002 }}>
                  {getBundlePhotos(activeVisit).map((photo, index) => (
                    <div key={photo.id} onClick={() => setActive360Url(photo.url)} style={{ cursor: 'pointer', border: active360Url === photo.url ? `2px solid ${themeColor}` : '2px solid transparent', borderRadius: '6px', overflow: 'hidden', opacity: active360Url === photo.url ? 1 : 0.6, minWidth: '70px', height: '50px', position: 'relative' }}>
                      <img src={photo.url} alt="Cena" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>Cena {index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* === LADO DIREITO (MODO COMPARAÇÃO DE IMAGEM) === */}
              {isCompareMode && compareVisit && compare360Url && (
                <div style={{ flex: 1, position: 'relative' }} onMouseEnter={() => setActiveSide('right')} onTouchStart={() => setActiveSide('right')}>
                  
                  {/* SELECT DE DATA DA DIREITA PREMIUM */}
                  <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10002, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '8px 15px', borderRadius: '8px', color: 'white', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                    <CalendarIcon />
                    <div style={{ minWidth: '220px' }}>
                      <Select 
                        styles={transparentSelectStyles} isSearchable={false}
                        menuPortalTarget={document.body} menuPosition="fixed"
                        options={visits.map(v => ({ value: v.id, label: `${new Date(v.visit_date).toLocaleDateString('pt-BR')} - ${v.title}` }))}
                        value={{ value: compareVisit.id, label: `${new Date(compareVisit.visit_date).toLocaleDateString('pt-BR')} - ${compareVisit.title}` }}
                        onChange={(sel) => { const v = visits.find(v => v.id === sel.value); setCompareVisit(v); setCompare360Url(v.media_url); }}
                      />
                    </div>
                  </div>
                  
                  {renderMiniMap()}

                  <Pannellum 
                    ref={rightViewerRef} 
                    id="viewer-right-360" 
                    key={`right-${compare360Url}`} 
                    width="100%" 
                    height="100%" 
                    image={compare360Url} 
                    pitch={0} 
                    yaw={180} 
                    hfov={100} 
                    autoLoad 
                    showZoomCtrl={false} 
                    showFullscreenCtrl={false}
                  />
                  
                  {/* O CARROSSEL COM AS FOTOS DAQUELA VISITA ESPECÍFICA */}
                  <div className="custom-scroll" style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '12px', overflowX: 'auto', maxWidth: '85%', zIndex: 10002, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {getBundlePhotos(compareVisit).map((photo, index) => (
                      <div 
                        key={`comp-${photo.id}`} 
                        onClick={() => setCompare360Url(photo.url)} 
                        style={{ cursor: 'pointer', border: compare360Url === photo.url ? `2px solid ${themeColor}` : '2px solid transparent', borderRadius: '6px', overflow: 'hidden', opacity: compare360Url === photo.url ? 1 : 0.6, transition: 'all 0.2s', minWidth: '70px', height: '50px', position: 'relative' }} 
                        onMouseEnter={(e)=>e.currentTarget.style.opacity=1} 
                        onMouseLeave={(e)=>e.currentTarget.style.opacity = compare360Url === photo.url ? 1 : 0.6}
                      >
                        <img src={photo.url} alt="Cena" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>Cena {index + 1}</div>
                      </div>
                    ))}
                  </div>

                </div>
              )}
              
              {isBimMode && (<div style={{ flex: 1, backgroundColor: '#111' }}>{projectIfcUrl && <IfcViewer ifcUrl={projectIfcUrl} targetCoords={{ x: target.coord_x, y: target.coord_y, z: target.coord_z }} />}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE CRIAR PROBLEMA (ISSUE)                                       */}
      {/* ===================================================================== */}
      {newIssueCoords && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10005 }}>
          <div style={{ background: panelBg, width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.3)', border: border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: '#e63946', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FlagIcon /> Novo Apontamento</h2>
              <button onClick={() => setNewIssueCoords(null)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer' }}><CloseIcon /></button>
            </div>
            <form onSubmit={handleSaveIssue} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>O que aconteceu? *</label>
                <input type="text" placeholder="Ex: Infiltração na janela" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} required style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Descrição (Opcional)</label>
                <textarea placeholder="Detalhes adicionais..." value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} style={{ width: '100%', padding: '12px', border: 'none', background: inputBg, color: textPrimary, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: textPrimary, fontWeight: '600' }}>Responsável (Opcional)</label>
                {/* SELECT DE RESPONSÁVEL PREMIUM */}
                <Select 
                  styles={modalSelectStyles} isSearchable={false} placeholder="Ninguém atribuído"
                  menuPortalTarget={document.body} menuPosition="fixed"
                  options={[{ value: '', label: 'Ninguém atribuído' }, ...projectMembers.map(email => ({ value: email, label: email }))]}
                  value={{ value: issueAssignee, label: issueAssignee || 'Ninguém atribuído' }}
                  onChange={(sel) => setIssueAssignee(sel.value)}
                />
              </div>
              <button type="submit" disabled={uploading} style={{ width: '100%', padding: '14px', background: '#e63946', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                {uploading ? 'Salvando...' : 'Salvar Problema'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE VISUALIZAR/RESOLVER PROBLEMA                                 */}
      {/* ===================================================================== */}
      {selectedIssue && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10005 }}>
          <div style={{ background: panelBg, width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.3)', border: border }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ display: 'inline-block', background: selectedIssue.status === 'open' ? '#e6394620' : '#10b98120', color: selectedIssue.status === 'open' ? '#e63946' : '#10b981', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}>
                  {selectedIssue.status === 'open' ? 'EM ABERTO' : 'RESOLVIDO'}
                </span>
                <h2 style={{ margin: '0', color: textPrimary, fontSize: '20px' }}>{selectedIssue.title}</h2>
              </div>
              <button onClick={() => setSelectedIssue(null)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer' }}><CloseIcon /></button>
            </div>

            {selectedIssue.description && <p style={{ color: textSecondary, fontSize: '14px', lineHeight: '1.5', margin: '0 0 20px 0', padding: '15px', background: inputBg, borderRadius: '8px' }}>{selectedIssue.description}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px', fontSize: '13px', color: textSecondary }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: border, paddingBottom: '8px' }}>
                <strong>Criado por:</strong> <span style={{ color: textPrimary }}>{selectedIssue.created_by}</span>
              </div>
              {selectedIssue.assigned_to && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: border, paddingBottom: '8px' }}>
                  <strong>Responsável:</strong> <span style={{ color: '#00d2ff', fontWeight: 'bold' }}>{selectedIssue.assigned_to}</span>
                </div>
              )}
              {selectedIssue.status === 'resolved' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                  <strong>Resolvido por:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selectedIssue.resolved_by}</span>
                </div>
              )}
            </div>

            {selectedIssue.status === 'open' && (
              <button onClick={handleResolveIssue} style={{ width: '100%', padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircleIcon /> Marcar como Resolvido
              </button>
            )}

            {(user.email === selectedIssue.created_by || user.id === target.project_id) && (
               <button onClick={handleDeleteIssue} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#e63946', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                 Apagar Registro
               </button>
            )}

          </div>
        </div>
      )}

    </>
  );
}