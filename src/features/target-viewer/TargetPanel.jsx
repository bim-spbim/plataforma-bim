import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Pannellum } from 'pannellum-react';
import { useAuth } from '../../contexts/AuthContext';
import { logAction } from '../../services/logger';

// --- Ícones Minimalistas ---
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const MoveIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const CalendarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const DownloadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;

export default function TargetPanel({ target, onClose, onUpdateTarget, onDeleteTarget, onRepositionTarget }) {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  const [is360Open, setIs360Open] = useState(false);
  const [active360Url, setActive360Url] = useState(null); 
  const [showForm, setShowForm] = useState(false);
  
  // Estados para Nova Visita
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]); 
  const [pcLink, setPcLink] = useState('');
  const [uploading, setUploading] = useState(false);

  // --- NOVOS ESTADOS PARA EDIÇÃO ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPhotoFiles, setEditPhotoFiles] = useState([]);
  const [editPcLink, setEditPcLink] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('spbim_theme') === 'dark');
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDarkMode(localStorage.getItem('spbim_theme') === 'dark'));
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  // --- NOVA COR DO TEMA (Azul Escuro) ---
  const themeColor = '#1a3a5f';

  useEffect(() => {
    if (!target) return;
    const fetchVisits = async () => {
      const { data } = await supabase.from('visits').select('*, visit_photos(*)').eq('target_id', target.id).order('visit_date', { ascending: false });
      if (data && data.length > 0) { setVisits(data); setActiveVisit(data[0]); } 
      else { setVisits([]); setActiveVisit(null); }
    };
    fetchVisits();
  }, [target]);

  const handleEditTarget = async () => {
    const newName = window.prompt("Novo nome para este ambiente:", target.name);
    if (!newName || newName === target.name) return;
    const { error } = await supabase.from('targets').update({ name: newName }).eq('id', target.id);
    if (!error) {
      onUpdateTarget({ ...target, name: newName });
      await logAction(user.email, 'EDIÇÃO DE AMBIENTE', `Renomeou ambiente para "${newName}"`);
    }
  };

  const handleDeleteTarget = async () => {
    if (!window.confirm(`⚠️ Apagar o ambiente "${target.name}" e TODAS as suas visitas?`)) return;
    const { error } = await supabase.from('targets').delete().eq('id', target.id);
    if (!error) {
      onDeleteTarget(target.id);
      await logAction(user.email, 'EXCLUSÃO DE AMBIENTE', `Apagou o ambiente "${target.name}"`);
    }
  };

  // --- PREPARA O MODAL DE EDIÇÃO DA VISITA ---
  const openEditModal = (visit, e) => {
    e.stopPropagation(); 
    setVisitToEdit(visit);
    setEditTitle(visit.title);
    setEditDate(visit.visit_date);
    setEditPcLink(visit.point_cloud_url || '');
    setEditPhotoFiles([]);
    setIsEditModalOpen(true);
  };

  // --- SALVA A VISITA EDITADA ---
  const submitEditVisit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalMediaUrl = visitToEdit.media_url;

      if (editPhotoFiles.length > 0) {
        const coverFile = editPhotoFiles[0];
        const safeCoverName = `visitas/capa_${Date.now()}_${Math.random().toString(36).substring(7)}.${coverFile.name.split('.').pop()}`;
        await supabase.storage.from('plantas').upload(safeCoverName, coverFile);
        const { data: coverUrlData } = supabase.storage.from('plantas').getPublicUrl(safeCoverName);
        finalMediaUrl = coverUrlData.publicUrl;

        if (editPhotoFiles.length > 1) {
          // Limpa as extras antigas
          await supabase.from('visit_photos').delete().eq('visit_id', visitToEdit.id);
          const extraPhotosToInsert = [];
          for (const file of editPhotoFiles.slice(1)) {
            const safeName = `visitas/extra_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
            await supabase.storage.from('plantas').upload(safeName, file);
            const { data: urlData } = supabase.storage.from('plantas').getPublicUrl(safeName);
            extraPhotosToInsert.push({ visit_id: visitToEdit.id, url: urlData.publicUrl });
          }
          if (extraPhotosToInsert.length > 0) {
            await supabase.from('visit_photos').insert(extraPhotosToInsert);
          }
        }
      }

      const { error } = await supabase.from('visits').update({ title: editTitle, visit_date: editDate, media_url: finalMediaUrl, point_cloud_url: editPcLink || null }).eq('id', visitToEdit.id);
      if (error) throw error;

      // Recarrega as visitas
      const { data: refreshed } = await supabase.from('visits').select('*, visit_photos(*)').eq('target_id', target.id).order('visit_date', { ascending: false });
      setVisits(refreshed);
      if (activeVisit?.id === visitToEdit.id) { 
        setActiveVisit(refreshed.find(v => v.id === visitToEdit.id));
        if (editPhotoFiles.length > 0) setActive360Url(finalMediaUrl); // Atualiza o 360 se ele estiver aberto e a foto mudou
      }

      await logAction(user.email, 'EDIÇÃO DE VISITA', `Editou a visita "${editTitle}"`);
      setIsEditModalOpen(false);
    } catch (error) { alert("Erro ao salvar: " + error.message); } finally { setUploading(false); }
  };

  const handleDeleteVisit = async (visitId, visitTitle, e) => {
    e.stopPropagation();
    if (!window.confirm(`⚠️ Apagar a visita "${visitTitle}"?`)) return;
    const { error } = await supabase.from('visits').delete().eq('id', visitId);
    if (!error) {
      const updatedVisits = visits.filter(v => v.id !== visitId);
      setVisits(updatedVisits);
      if (activeVisit?.id === visitId) { setActiveVisit(updatedVisits.length > 0 ? updatedVisits[0] : null); setIs360Open(false); }
      await logAction(user.email, 'EXCLUSÃO DE VISITA', `Apagou a visita "${visitTitle}"`);
    }
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (photoFiles.length === 0 || !title || !date) return alert("Preencha tudo!");
    setUploading(true);
    try {
      const coverFile = photoFiles[0];
      const safeCoverName = `visitas/capa_${Date.now()}_${Math.random().toString(36).substring(7)}.${coverFile.name.split('.').pop()}`;
      await supabase.storage.from('plantas').upload(safeCoverName, coverFile);
      const { data: coverUrlData } = supabase.storage.from('plantas').getPublicUrl(safeCoverName);

      const { data: newVisitData, error: dbError } = await supabase.from('visits').insert([{ target_id: target.id, title: title, visit_date: date, media_url: coverUrlData.publicUrl, point_cloud_url: pcLink || null }]).select();
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
      setActiveVisit(newVisit); setShowForm(false);
      setTitle(''); setDate(''); setPhotoFiles([]); setPcLink(''); document.getElementById('photoInput').value = '';
    } catch (error) { alert("Erro ao salvar: " + error.message); } finally { setUploading(false); }
  };

  const getBundlePhotos = (visit) => {
    if (!visit) return [];
    return [{ id: 'capa', url: visit.media_url }, ...(visit.visit_photos || [])];
  };

  if (!target) return null;

  const textPrimary = isDarkMode ? '#ffffff' : '#1a1a2e';
  const textSecondary = isDarkMode ? '#8892b0' : '#666666';
  const panelBg = isDarkMode ? '#1e1e2f' : '#ffffff';
  const border = isDarkMode ? '1px solid #2a2a40' : '1px solid #eaeaea';
  const inputBg = isDarkMode ? '#232336' : '#f5f7f9';
  const hoverBg = isDarkMode ? '#2a2a40' : '#f0f4f8';

  return (
    <>
      <div style={{ position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh', backgroundColor: panelBg, boxShadow: '-4px 0 30px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '30px', boxSizing: 'border-box', borderLeft: border, transition: 'background-color 0.3s' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: border, paddingBottom: '15px', marginBottom: '25px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: textPrimary, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {target.name}
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={handleEditTarget} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} title="Editar Nome" onMouseEnter={(e)=>e.currentTarget.style.color=themeColor} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}><EditIcon /></button>
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

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: textPrimary, fontSize: '18px' }}>Linha do Tempo</h3>
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: showForm ? 'transparent' : themeColor, color: showForm ? textSecondary : '#fff', border: showForm ? `1px solid ${textSecondary}` : 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>{showForm ? 'Cancelar' : '+ Nova Captura'}</button>
          </div>

          {showForm && (
            <form onSubmit={handleAddVisit} style={{ background: inputBg, padding: '20px', borderRadius: '12px', border: border, marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Título (Ex: Pós-Gesso)" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '12px', border: 'none', borderRadius: '6px', background: panelBg, color: textPrimary, outline: 'none' }}/>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: '12px', border: 'none', borderRadius: '6px', background: panelBg, color: textSecondary, outline: 'none' }}/>
              <input type="file" id="photoInput" multiple accept="image/*" onChange={(e) => setPhotoFiles(Array.from(e.target.files))} required style={{ color: textSecondary, fontSize: '13px' }}/>
              <input type="url" placeholder="Link da Nuvem de Pontos" value={pcLink} onChange={(e) => setPcLink(e.target.value)} style={{ padding: '12px', border: 'none', borderRadius: '6px', background: panelBg, color: textPrimary, outline: 'none', fontSize: '13px' }}/>
              <button type="submit" disabled={uploading} style={{ padding: '12px', background: themeColor, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{uploading ? 'Salvando...' : 'Salvar Captura'}</button>
            </form>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visits.map(visit => {
              const isActive = activeVisit?.id === visit.id;
              return (
                <div key={visit.id} onClick={() => setActiveVisit(visit)} style={{ padding: '15px', border: isActive ? `2px solid ${themeColor}` : border, backgroundColor: isActive ? (isDarkMode ? '#1a2235' : '#f0faff') : inputBg, borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', transition: 'all 0.2s' }} onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = hoverBg)} onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = inputBg)}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '15px', color: isActive ? themeColor : textPrimary, marginBottom: '4px' }}>
                      {visit.title}
                    </strong>
                    <span style={{ fontSize: '13px', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarIcon /> {new Date(visit.visit_date).toLocaleDateString('pt-BR')} • {getBundlePhotos(visit).length} foto(s)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={(e) => openEditModal(visit, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} onMouseEnter={(e)=>e.currentTarget.style.color=themeColor} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}><EditIcon /></button>
                      <button onClick={(e) => handleDeleteVisit(visit.id, visit.title, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: 0 }} onMouseEnter={(e)=>e.currentTarget.style.color='#e63946'} onMouseLeave={(e)=>e.currentTarget.style.color=textSecondary}><TrashIcon /></button>
                    </div>
                    {visit.point_cloud_url && (
                      <a href={visit.point_cloud_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ padding: '4px 10px', border: `1px solid #6f42c1`, color: '#6f42c1', textDecoration: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#6f42c1'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6f42c1'; }}>
                        <DownloadIcon /> Nuvem
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DA VISITA */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10003, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: panelBg, padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: border, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <h3 style={{ color: textPrimary, margin: '0 0 20px 0', fontSize: '20px' }}>Editar Visita</h3>
                <form onSubmit={submitEditVisit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <label style={{ color: textSecondary, fontSize: '12px', marginBottom: '-10px', fontWeight: 'bold' }}>Título da Visita</label>
                    <input type="text" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} required style={{ padding: '12px', background: inputBg, color: textPrimary, border: 'none', borderRadius: '6px', outline: 'none' }}/>

                    <label style={{ color: textSecondary, fontSize: '12px', marginBottom: '-10px', fontWeight: 'bold' }}>Data</label>
                    <input type="date" value={editDate} onChange={(e)=>setEditDate(e.target.value)} required style={{ padding: '12px', background: inputBg, color: textPrimary, border: 'none', borderRadius: '6px', outline: 'none' }}/>

                    <label style={{ color: textSecondary, fontSize: '12px', marginBottom: '-10px', fontWeight: 'bold' }}>Substituir Imagens (Opcional)</label>
                    <input type="file" multiple accept="image/*" onChange={(e)=>setEditPhotoFiles(Array.from(e.target.files))} style={{ color: textSecondary, fontSize: '12px' }}/>

                    <label style={{ color: textSecondary, fontSize: '12px', marginBottom: '-10px', fontWeight: 'bold' }}>Link da Nuvem de Pontos</label>
                    <input type="url" value={editPcLink} onChange={(e)=>setEditPcLink(e.target.value)} style={{ padding: '12px', background: inputBg, color: textPrimary, border: 'none', borderRadius: '6px', outline: 'none' }}/>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button type="button" onClick={()=>setIsEditModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: textSecondary, border: border, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                        <button type="submit" disabled={uploading} style={{ flex: 1, padding: '12px', background: themeColor, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {uploading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* MODAL 360º NOVO FORMATO */}
      {is360Open && activeVisit && active360Url && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          <div style={{ width: '85vw', height: '85vh', maxWidth: '1300px', backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* NOVO HEADER DO 360 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px 25px', backgroundColor: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', color: 'white', position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 10001, boxSizing: 'border-box' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <EyeIcon /> {target.name}
                </h3>
                
                {/* SELETOR DE DATA DA VISITA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#ccc' }}>
                  <CalendarIcon />
                  <select 
                    value={activeVisit.id} 
                    onChange={(e) => {
                      const selectedVisit = visits.find(v => v.id === e.target.value);
                      setActiveVisit(selectedVisit);
                      setActive360Url(selectedVisit.media_url); // Troca pra capa da nova visita
                    }}
                    style={{ 
                      background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', 
                      borderRadius: '4px', padding: '4px 8px', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    {visits.map(v => (
                      <option key={v.id} value={v.id} style={{ color: 'black' }}>
                        {new Date(v.visit_date).toLocaleDateString('pt-BR')} - {v.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BOTÃO FECHAR "X" MINIMALISTA */}
              <button 
                onClick={() => setIs360Open(false)} 
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 0.2s' }} 
                onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} 
                onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                title="Fechar Visualizador"
              >
                <CloseIcon />
              </button>
            </div>
            
            <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
              {/* PANNELLUM COM ZOOM MANUAL DESATIVADO (showZoomCtrl={false}) */}
              <Pannellum key={active360Url} width="100%" height="100%" image={active360Url} pitch={0} yaw={180} hfov={100} autoLoad showZoomCtrl={false} showFullscreenCtrl={false}/>
              
              <div style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '15px', borderRadius: '16px', overflowX: 'auto', maxWidth: '80%', zIndex: 10002, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {getBundlePhotos(activeVisit).map((photo, index) => (
                  <div key={photo.id} onClick={() => setActive360Url(photo.url)} style={{ cursor: 'pointer', border: active360Url === photo.url ? `3px solid ${themeColor}` : '3px solid transparent', borderRadius: '8px', overflow: 'hidden', opacity: active360Url === photo.url ? 1 : 0.6, transition: 'all 0.2s', minWidth: '90px', height: '65px', position: 'relative' }} onMouseEnter={(e)=>e.currentTarget.style.opacity=1} onMouseLeave={(e)=>e.currentTarget.style.opacity = active360Url === photo.url ? 1 : 0.6}>
                    <img src={photo.url} alt="Bundle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '11px', textAlign: 'center', padding: '4px 0', fontWeight: 'bold' }}>Cena {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}