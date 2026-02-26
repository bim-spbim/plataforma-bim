import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import TargetPanel from '../target-viewer/TargetPanel'; 
import { useAuth } from '../../contexts/AuthContext';
import { logAction } from '../../services/logger';

export default function MapViewer({ floorPlan }) {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null); 
  
  // NOVO ESTADO: Controla quem está sendo movido
  const [repositioningTarget, setRepositioningTarget] = useState(null);
  
  const imgRef = useRef(null);

  useEffect(() => {
    const fetchTargets = async () => {
      const { data } = await supabase.from('targets').select('*').eq('floor_plan_id', floorPlan.id);
      setTargets(data || []);
      setSelectedTarget(null); 
      setRepositioningTarget(null);
    };
    fetchTargets();
  }, [floorPlan.id]);

  const handleImageClick = async (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // SE ESTIVER NO MODO "MOVER PINO"
    if (repositioningTarget) {
      const { error } = await supabase.from('targets')
        .update({ coord_x: x, coord_y: y })
        .eq('id', repositioningTarget.id);

      if (!error) {
        const updatedTarget = { ...repositioningTarget, coord_x: x, coord_y: y };
        setTargets(targets.map(t => t.id === updatedTarget.id ? updatedTarget : t));
        setSelectedTarget(updatedTarget); // Reabre o painel lateral automaticamente
        await logAction(user.email, 'MOVEU AMBIENTE', `Moveu o pino do ambiente "${repositioningTarget.name}"`);
      }
      setRepositioningTarget(null); // Sai do modo de reposição
      return;
    }

    // SE ESTIVER CLICANDO NORMAL (Criar novo)
    const targetName = window.prompt("Nome deste ambiente (ex: Sala de Reunião):");
    if (targetName) {
      const { data } = await supabase.from('targets')
        .insert([{ project_id: floorPlan.project_id, floor_plan_id: floorPlan.id, name: targetName, coord_x: x, coord_y: y }])
        .select();
      if (data) {
        setTargets([...targets, data[0]]);
        await logAction(user.email, 'CRIAÇÃO DE AMBIENTE', `Mapeou o ambiente "${targetName}" na planta "${floorPlan.title}"`);
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

  // FUNÇÃO MÁGICA: Prepara o terreno para mover o pino
  const startRepositioning = (target) => {
    setSelectedTarget(null); // Esconde o painel para o usuário ver a planta toda
    setRepositioningTarget(target); // Ativa o modo Mover
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <h3 style={{ margin: '0 0 20px 0', color: '#8892b0', fontSize: '18px', alignSelf: 'flex-start' }}>
        Planta: <strong style={{ color: 'inherit' }}>{floorPlan.title}</strong>
      </h3>
      
      <div style={{ position: 'relative', display: 'inline-block', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', overflow: 'hidden', backgroundColor: '#fff' }}>
        
        {/* BANNER FLUTUANTE AVISANDO QUE ESTÁ MOVENDO */}
        {repositioningTarget && (
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#00d2ff', color: '#1a1a2e', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', zIndex: 10, boxShadow: '0 4px 15px rgba(0,210,255,0.4)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📍 Clique no novo local para reposicionar "{repositioningTarget.name}"
            <button onClick={(e) => { e.stopPropagation(); setRepositioningTarget(null); setSelectedTarget(repositioningTarget); }} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', color: 'inherit', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold' }}>X</button>
          </div>
        )}

        <img ref={imgRef} src={floorPlan.image_url} alt="Planta" onClick={handleImageClick} style={{ display: 'block', maxWidth: '100%', cursor: repositioningTarget ? 'crosshair' : 'crosshair', transition: 'opacity 0.2s', opacity: repositioningTarget ? 0.8 : 1 }} />

        {targets.map(target => (
          <div 
            key={target.id} 
            onClick={(e) => { e.stopPropagation(); if (!repositioningTarget) setSelectedTarget(target); }} 
            style={{ 
              position: 'absolute', left: `${target.coord_x}%`, top: `${target.coord_y}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer',
              width: '20px', height: '20px', backgroundColor: 'rgba(0, 210, 255, 0.4)', border: '3px solid rgba(255, 255, 255, 0.9)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', transition: 'transform 0.2s, background-color 0.2s, opacity 0.2s',
              opacity: repositioningTarget && repositioningTarget.id !== target.id ? 0.3 : 1 // Apaga os outros pinos enquanto move
            }} 
            title={target.name}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.4)'; e.currentTarget.style.backgroundColor = 'rgba(111, 66, 193, 0.7)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(0, 210, 255, 0.4)'; }}
          />
        ))}
      </div>

      {selectedTarget && (
        <TargetPanel 
          target={selectedTarget} 
          onClose={() => setSelectedTarget(null)} 
          onUpdateTarget={handleUpdateTarget} 
          onDeleteTarget={handleDeleteTarget} 
          onRepositionTarget={startRepositioning} // Passando a função mágica pro painel!
        />
      )}
    </div>
  );
}