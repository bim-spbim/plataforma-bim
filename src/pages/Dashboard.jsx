import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import MapViewer from '../features/map-viewer/MapViewer';

export default function Dashboard() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [floorPlans, setFloorPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null); // Planta que está sendo visualizada

  // Form de upload
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      const { data: projData } = await supabase.from('projects').select('*').eq('id', id).single();
      if (projData) setProject(projData);

      const { data: plansData } = await supabase.from('floor_plans').select('*').eq('project_id', id);
      if (plansData) {
        setFloorPlans(plansData);
        if (plansData.length > 0) setActivePlan(plansData[0]); // Seleciona a primeira planta por padrão
      }
    };
    loadProject();
  }, [id]);

const handleUploadPlan = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    // 1. TRAVAMENTO DE ARQUIVO DUPLICADO
    const isDuplicate = floorPlans.some(plan => plan.file_name === file.name);
    if (isDuplicate) {
      alert(`⚠️ Parado aí! Você já enviou uma planta com o exato arquivo "${file.name}". Por favor, renomeie ou escolha outro.`);
      return; // Esse 'return' faz o código morrer aqui e não envia nada!
    }

    setUploading(true);
    try {
      // 2. CORREÇÃO DE NOMES COM ESPAÇOS/CARACTERES (Ex: INOVAÇÃO BIM.jpg)
      const fileExt = file.name.split('.').pop();
      // Criamos um nome 100% seguro para o link (ex: 1678123_abc12.jpg)
      const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Faz o upload com o nome seguro
      const { error: uploadError } = await supabase.storage.from('plantas').upload(safeFileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('plantas').getPublicUrl(safeFileName);

      // Salva no banco de dados
      const { data: newPlan, error: dbError } = await supabase.from('floor_plans').insert([{
        project_id: id,
        title: title,
        file_name: file.name, // Mantemos o nome original aqui para a trava de duplicata funcionar!
        image_url: urlData.publicUrl
      }]).select();

      if (dbError) throw dbError;

      if (newPlan) {
        setFloorPlans([...floorPlans, newPlan[0]]);
        setActivePlan(newPlan[0]);
        setTitle('');
        setFile(null);
        document.getElementById('fileInput').value = ''; // Limpa o botão de arquivo visualmente
      }
    } catch (error) {
      alert("Erro ao enviar planta: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!project) return <p>Carregando projeto...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/home">← Voltar</Link>
      <h2>Projeto: {project.name}</h2>

      {/* ÁREA DE MÚLTIPLAS PLANTAS */}
      <div style={{ background: '#f9f9f9', padding: '15px', border: '1px solid #ddd', marginBottom: '20px' }}>
        <h3>Gerenciar Plantas</h3>
        
        {/* Lista de abas (Seletor de plantas) */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', overflowX: 'auto' }}>
          {floorPlans.map(plan => (
            <button 
              key={plan.id} 
              onClick={() => setActivePlan(plan)}
              style={{ padding: '8px 15px', background: activePlan?.id === plan.id ? '#007bff' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              {plan.title}
            </button>
          ))}
        </div>

        {/* Form para adicionar mais plantas */}
        <form onSubmit={handleUploadPlan} style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Título (Ex: Térreo, Elétrica)" value={title} onChange={(e)=>setTitle(e.target.value)} required />
          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files[0])} required />
          <button type="submit" disabled={uploading} style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px 10px' }}>
            {uploading ? 'Enviando...' : '+ Adicionar Planta'}
          </button>
        </form>
      </div>

      {/* Exibe o MapViewer apenas se houver uma planta ativa */}
      {activePlan ? (
        <MapViewer floorPlan={activePlan} />
      ) : (
        <p>Nenhuma planta adicionada a este projeto ainda.</p>
      )}
    </div>
  );
}