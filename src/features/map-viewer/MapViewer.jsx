import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import TargetPanel from '../target-viewer/TargetPanel'; 
import { useAuth } from '../../contexts/AuthContext';
import { logAction } from '../../services/logger';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- Ícones ---
const ZoomInIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ZoomOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ResetZoomIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>;
const MapPinIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;

export default function MapViewer({ floorPlan, isOwner, autoOpenIssue, setAutoOpenIssue }) {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null); 
  
  // ESTADOS DE INTERAÇÃO
  const [isAddMode, setIsAddMode] = useState(false); 
  const [repositioningTarget, setRepositioningTarget] = useState(null); 
  
  // ESTADOS DO REALINHAMENTO EM MASSA
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkTotal, setBulkTotal] = useState(0);

  const imgRef = useRef(null);

  useEffect(() => {
    const fetchTargets = async () => {
      const { data } = await supabase.from('targets').select('*').eq('floor_plan_id', floorPlan.id);
      setTargets(data || []);
      setSelectedTarget(null); 
      setRepositioningTarget(null);
      setIsAddMode(false);
      setBulkQueue([]);
    };
    fetchTargets();
  }, [floorPlan.id]);

  // O MAPA ESCUTA O GATILHO E ABRE O PINO AUTOMATICAMENTE
  useEffect(() => {
    if (autoOpenIssue && targets.length > 0) {
      const targetFound = targets.find(t => t.id === autoOpenIssue.target_id);
      if (targetFound) {
        setSelectedTarget(targetFound); // Abre o painel lateral do ambiente
      }
    }
  }, [autoOpenIssue, targets]);

  const handleImageClick = async (e) => {
    if (!isAddMode && !repositioningTarget) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // --- MODO: MOVER PINO (Individual ou em Massa) ---
    if (repositioningTarget) {
      const { error } = await supabase.from('targets').update({ coord_x: x, coord_y: y }).eq('id', repositioningTarget.id);

      if (!error) {
        const updatedTarget = { ...repositioningTarget, coord_x: x, coord_y: y };
        setTargets(prev => prev.map(t => t.id === updatedTarget.id ? updatedTarget : t));
        
        if (bulkQueue.length > 0) {
           const nextQueue = bulkQueue.slice(1);
           setBulkQueue(nextQueue);
           
           if (nextQueue.length > 0) {
              setRepositioningTarget(nextQueue[0]); 
           } else {
              setRepositioningTarget(null);
              alert("✅ Excelente! Todos os pinos foram realinhados na nova planta.");
           }
        } else {
           setSelectedTarget(updatedTarget); 
           setRepositioningTarget(null); 
           await logAction(user.email, 'MOVEU AMBIENTE', `Moveu o pino do ambiente "${repositioningTarget.name}"`);
        }
      }
      return;
    }

    // --- MODO: ADICIONAR PINO NOVO ---
    if (isAddMode) {
      const targetName = window.prompt("Nome deste novo ambiente (ex: Sala de Reunião):");
      if (targetName) {
        const { data } = await supabase.from('targets').insert([{ project_id: floorPlan.project_id, floor_plan_id: floorPlan.id, name: targetName, coord_x: x, coord_y: y }]).select();
        if (data) {
          setTargets([...targets, data[0]]);
          await logAction(user.email, 'CRIAÇÃO DE AMBIENTE', `Mapeou o ambiente "${targetName}" na planta "${floorPlan.title}"`);
        }
      }
    }
  };

  const handleUpdateTarget = (updatedTarget) => {
    setTargets(targets.map(t => t.id === updatedTarget.id ? updatedTarget : t));
    setSelectedTarget(updatedTarget);
  };

  const handleDeleteTarget = (targetId) => {
    setTargets(targets.filter(t => t.id !== targetId));
    setSelectedTarget(null);
  };

  const toggleAddMode = () => {
    setRepositioningTarget(null); setBulkQueue([]); setIsAddMode(!isAddMode);
  };

  const startRepositioning = (target) => {
    setSelectedTarget(null); setIsAddMode(false); setBulkQueue([]); setRepositioningTarget(target); 
  };

  const startBulkReposition = () => {
    if (targets.length === 0) return alert("Não há ambientes mapeados para realinhar.");
    if (!window.confirm("Deseja iniciar o processo de realinhamento? Você precisará clicar no novo local de cada pino existente.")) return;
    
    setSelectedTarget(null);
    setIsAddMode(false);
    setBulkTotal(targets.length);
    setBulkQueue([...targets]);
    setRepositioningTarget(targets[0]); 
  };

  const cancelRepositioning = (e) => {
    e.stopPropagation();
    setRepositioningTarget(null);
    setBulkQueue([]);
    if (bulkQueue.length === 0 && repositioningTarget) setSelectedTarget(repositioningTarget);
  };

  const getCursorStyle = () => {
    if (repositioningTarget || isAddMode) return 'crosshair';
    return 'grab'; 
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* BANNER FLUTUANTE DE REPOSICIONAMENTO */}
      {repositioningTarget && (
        <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: bulkQueue.length > 0 ? '#6f42c1' : '#00d2ff', color: bulkQueue.length > 0 ? 'white' : '#1a1a2e', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {bulkQueue.length > 0 ? (
            <span>📍 Realinhando [{bulkTotal - bulkQueue.length + 1}/{bulkTotal}]: Clique no novo local de <b>"{repositioningTarget.name}"</b></span>
          ) : (
            <span>📍 Clique na planta para reposicionar <b>"{repositioningTarget.name}"</b></span>
          )}
          
          <button onClick={cancelRepositioning} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', color: 'inherit', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold', marginLeft: '10px' }}>X</button>
        </div>
      )}

      {/* JANELA DE VISUALIZAÇÃO (A "PRANCHETA INFINITA") */}
      <div style={{ 
        width: '100%', 
        height: '70vh', 
        minHeight: '500px', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        position: 'relative', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        // O SEGREDO DO FUNDO BONITO ESTÁ AQUI
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        border: '1px solid #e2e8f0'
      }}>
        
        {/* BOTÕES FLUTUANTES (Top Left) */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={toggleAddMode}
            style={{ background: isAddMode ? '#10b981' : '#1a1a2e', color: 'white', border: isAddMode ? '2px solid white' : 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
          >
            <MapPinIcon /> {isAddMode ? 'Mapeamento Ativo (Concluir)' : '+ Mapear Ambiente'}
          </button>

          {/* BOTÃO DE REALINHAR MASSA (Aparece só pro dono) */}
          {isOwner && targets.length > 0 && !isAddMode && !repositioningTarget && (
            <button 
              onClick={startBulkReposition}
              style={{ background: 'rgba(255,255,255,0.9)', color: '#1a1a2e', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
            >
              <RefreshIcon /> Realinhar Pinos
            </button>
          )}
        </div>

        <TransformWrapper
          initialScale={1}
          minScale={0.5} // Permite afastar um pouco pra ver a planta toda
          maxScale={8} 
          centerOnInit={true}
          centerZoomedOut={true} 
          limitToBounds={false} // Libera pra você arrastar livremente pela prancheta infinita
          wheel={{ step: 0.1 }}
          doubleClick={{ disabled: true }} 
          panning={{ disabled: isAddMode || repositioningTarget !== null }} 
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* PAINEL DE CONTROLES DE ZOOM */}
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.9)', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <button onClick={() => zoomIn()} style={{ background: 'transparent', border: 'none', color: '#1a1a2e', cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Aproximar"><ZoomInIcon /></button>
                <div style={{ height: '1px', background: '#e2e8f0' }}></div>
                <button onClick={() => zoomOut()} style={{ background: 'transparent', border: 'none', color: '#1a1a2e', cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Afastar"><ZoomOutIcon /></button>
                <div style={{ height: '1px', background: '#e2e8f0' }}></div>
                <button onClick={() => resetTransform()} style={{ background: 'transparent', border: 'none', color: '#00d2ff', cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Centralizar e Resetar"><ResetZoomIcon /></button>
              </div>

              <TransformComponent wrapperStyle={{ width: '100%', height: '100%', cursor: getCursorStyle() }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  
                  {/* IMAGEM DA PLANTA */}
                  <img 
                    ref={imgRef} 
                    src={floorPlan.image_url} 
                    alt="Planta" 
                    onClick={handleImageClick} 
                    style={{ 
                      display: 'block', 
                      maxWidth: '100%',     
                      maxHeight: '80vh',    
                      width: 'auto',        
                      height: 'auto',       
                      transition: 'opacity 0.2s', 
                      opacity: repositioningTarget ? 0.6 : 1, 
                      pointerEvents: 'auto',
                      boxShadow: '0 0 30px rgba(0,0,0,0.05)'
                    }} 
                    draggable={false} 
                  />

                  {/* OS PINOS */}
                  {targets.map(target => (
                    <div 
                      key={target.id} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!repositioningTarget && !isAddMode) setSelectedTarget(target); 
                      }} 
                      style={{ 
                        position: 'absolute', 
                        left: `${target.coord_x}%`, 
                        top: `${target.coord_y}%`, 
                        transform: 'translate(-50%, -50%)', 
                        cursor: (repositioningTarget || isAddMode) ? 'crosshair' : 'pointer',
                        width: '24px', 
                        height: '24px', 
                        backgroundColor: (repositioningTarget && repositioningTarget.id === target.id) ? '#6f42c1' : 'rgba(0, 210, 255, 0.6)', 
                        border: '3px solid rgba(255, 255, 255, 0.9)', 
                        borderRadius: '50%', 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.5)', 
                        backdropFilter: 'blur(2px)', 
                        transition: 'transform 0.2s, background-color 0.2s, opacity 0.2s',
                        opacity: (repositioningTarget && repositioningTarget.id !== target.id) || isAddMode ? 0.3 : 1, 
                        pointerEvents: 'auto'
                      }} 
                      title={target.name}
                      onMouseEnter={(e) => { 
                        if (!isAddMode && !repositioningTarget) {
                          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.4)'; 
                          e.currentTarget.style.backgroundColor = 'rgba(111, 66, 193, 0.8)'; 
                        }
                      }}
                      onMouseLeave={(e) => { 
                        if (!isAddMode && !repositioningTarget) {
                          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'; 
                          e.currentTarget.style.backgroundColor = 'rgba(0, 210, 255, 0.6)'; 
                        }
                      }}
                    />
                  ))}

                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {selectedTarget && !isAddMode && !repositioningTarget && (
        <TargetPanel 
          target={selectedTarget} 
          onClose={() => setSelectedTarget(null)} 
          onUpdateTarget={handleUpdateTarget} 
          onDeleteTarget={handleDeleteTarget} 
          onRepositionTarget={startRepositioning} 
          onChangeTarget={setSelectedTarget}
          autoOpenIssue={autoOpenIssue}         // <-- ADICIONE AQUI
          setAutoOpenIssue={setAutoOpenIssue}   // <-- E AQUI
        />
      )}
        
      {/* PAINEL LATERAL DE INFORMAÇÕES DAQUELE PINO COM O NOVO onChangeTarget */}
      {selectedTarget && !isAddMode && !repositioningTarget && (
        <TargetPanel 
          target={selectedTarget} 
          onClose={() => setSelectedTarget(null)} 
          onUpdateTarget={handleUpdateTarget} 
          onDeleteTarget={handleDeleteTarget} 
          onRepositionTarget={startRepositioning} 
          onChangeTarget={setSelectedTarget} // <-- A MÁGICA DO TELETRANSPORTE ESTÁ AQUI!
        />
      )}
    </div>
  );
}