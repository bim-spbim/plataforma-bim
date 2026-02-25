import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import TargetPanel from '../target-viewer/TargetPanel'; 

// Agora ele recebe floorPlan (A planta ativa)
export default function MapViewer({ floorPlan }) {
  const [targets, setTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null); 
  const imgRef = useRef(null);

  // Busca os targets específicos DESTA planta
  useEffect(() => {
    const fetchTargets = async () => {
      const { data } = await supabase
        .from('targets')
        .select('*')
        .eq('floor_plan_id', floorPlan.id); // Mudamos project_id para floor_plan_id
      setTargets(data || []);
      setSelectedTarget(null); // Fecha o painel ao trocar de planta
    };
    fetchTargets();
  }, [floorPlan.id]);

  const handleImageClick = async (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const targetName = window.prompt("Nome deste ambiente (ex: Sala de Reunião):");
    if (targetName) {
      const { data, error } = await supabase
        .from('targets')
        // Salvamos passando o id da planta e do projeto!
        .insert([{ project_id: floorPlan.project_id, floor_plan_id: floorPlan.id, name: targetName, coord_x: x, coord_y: y }])
        .select();

      if (data) setTargets([...targets, data[0]]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <h2>Visualizando: {floorPlan.title}</h2>
      
      <div style={{ position: 'relative', display: 'inline-block', border: '2px dashed #ccc' }}>
        <img ref={imgRef} src={floorPlan.image_url} alt="Planta" onClick={handleImageClick} style={{ display: 'block', maxWidth: '100%', cursor: 'crosshair' }} />

        {targets.map(target => (
          <div key={target.id} onClick={(e) => { e.stopPropagation(); setSelectedTarget(target); }} style={{ position: 'absolute', left: `${target.coord_x}%`, top: `${target.coord_y}%`, transform: 'translate(-50%, -100%)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', textShadow: '0px 0px 5px white' }}>📍</span>
            <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>{target.name}</span>
          </div>
        ))}
      </div>

      <TargetPanel target={selectedTarget} onClose={() => setSelectedTarget(null)} />
    </div>
  );
}