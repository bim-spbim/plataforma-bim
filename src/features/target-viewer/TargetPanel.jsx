import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

export default function TargetPanel({ target, onClose }) {
  const [visits, setVisits] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  
  // Estados do Formulário
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [photoFile, setPhotoFile] = useState(null); // Arquivo da foto 360/Preview
  const [pcFile, setPcFile] = useState(null);       // Arquivo da Nuvem de Pontos (Novo!)
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!target) return;
    const fetchVisits = async () => {
      const { data } = await supabase.from('visits').select('*').eq('target_id', target.id).order('visit_date', { ascending: false });
      if (data && data.length > 0) {
        setVisits(data);
        setActiveVisit(data[0]);
      } else {
        setVisits([]);
        setActiveVisit(null);
      }
    };
    fetchVisits();
  }, [target]);

  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (!photoFile || !title || !date) return alert("Preencha título, data e a foto de referência!");

    setUploading(true);
    try {
      // 1. Upload da Foto de Referência
      const photoExt = photoFile.name.split('.').pop();
      const safePhotoName = `visitas/foto_${Date.now()}_${Math.random().toString(36).substring(7)}.${photoExt}`;
      const { error: photoUploadError } = await supabase.storage.from('plantas').upload(safePhotoName, photoFile);
      if (photoUploadError) throw photoUploadError;
      const { data: photoUrlData } = supabase.storage.from('plantas').getPublicUrl(safePhotoName);

      // 2. Upload da Nuvem de Pontos (Se o usuário selecionou uma)
      let pcUrl = null;
      if (pcFile) {
        const pcExt = pcFile.name.split('.').pop();
        const safePcName = `nuvens/pc_${Date.now()}_${Math.random().toString(36).substring(7)}.${pcExt}`;
        const { error: pcUploadError } = await supabase.storage.from('plantas').upload(safePcName, pcFile);
        if (pcUploadError) throw pcUploadError;
        const { data: pcUrlData } = supabase.storage.from('plantas').getPublicUrl(safePcName);
        pcUrl = pcUrlData.publicUrl;
      }

      // 3. Salva no Banco de Dados
      const { data: newVisit, error: dbError } = await supabase.from('visits').insert([{
        target_id: target.id,
        title: title,
        visit_date: date,
        media_url: photoUrlData.publicUrl,
        point_cloud_url: pcUrl // Salva o link da nuvem de pontos se existir!
      }]).select();

      if (dbError) throw dbError;

      if (newVisit) {
        const updatedVisits = [newVisit[0], ...visits].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
        setVisits(updatedVisits);
        setActiveVisit(newVisit[0]);
        setShowForm(false);
        setTitle(''); setDate(''); setPhotoFile(null); setPcFile(null);
        document.getElementById('photoInput').value = '';
        if(document.getElementById('pcInput')) document.getElementById('pcInput').value = '';
      }
    } catch (error) {
      alert("Erro ao salvar visita: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!target) return null;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh', backgroundColor: '#fff', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box', borderLeft: '1px solid #ddd' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>{target.name}</h2>
          <span style={{ fontSize: '12px', color: '#666' }}>Histórico do ambiente</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#888' }}>&times;</button>
      </div>

      {/* VISUALIZADOR DA FOTO E BOTÃO DA NUVEM DE PONTOS */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ width: '100%', height: '240px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
          {activeVisit ? (
            <img src={activeVisit.media_url} alt={activeVisit.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <p style={{ color: '#666' }}>Nenhuma foto registrada ainda.</p>
          )}
        </div>
        
        {/* Slot da Nuvem de Pontos para a visita ativa */}
        {activeVisit?.point_cloud_url ? (
          <a href={activeVisit.point_cloud_url} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: '#6f42c1', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            🌌 Acessar Nuvem de Pontos (.las, .e57...)
          </a>
        ) : activeVisit && (
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f1f1f1', color: '#888', borderRadius: '4px', fontSize: '14px' }}>
            Nenhuma nuvem de pontos anexada nesta visita.
          </div>
        )}
      </div>

      {/* LINHA DO TEMPO */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Linha do Tempo</h3>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            {showForm ? 'Cancelar' : '+ Nova Visita'}
          </button>
        </div>

        {/* Formulário de Nova Visita */}
        {showForm && (
          <form onSubmit={handleAddVisit} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid #ddd' }}>
            <input type="text" placeholder="Título (Ex: Levantamento Inicial)" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '8px' }}/>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: '8px' }}/>
            
            <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '5px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>1. Foto de Referência (Obrigatório)</label>
              <input type="file" id="photoInput" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} required style={{ fontSize: '12px', width: '100%' }}/>
            </div>

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '5px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#6f42c1' }}>2. Nuvem de Pontos (Opcional)</label>
              <input 
                type="file" 
                id="pcInput" 
                accept=".las,.laz,.e57,.ply,.rcp,.txt" 
                onChange={(e) => setPcFile(e.target.files[0])} 
                style={{ fontSize: '12px', width: '100%' }}
              />
              <span style={{ fontSize: '10px', color: '#666' }}>Formatos suportados: .las, .laz, .e57, .ply, .rcp</span>
            </div>

            <button type="submit" disabled={uploading} style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', marginTop: '10px', fontWeight: 'bold' }}>
              {uploading ? 'Fazendo Upload...' : 'Salvar Visita'}
            </button>
          </form>
        )}
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {visits.map(visit => (
            <li 
              key={visit.id} 
              onClick={() => setActiveVisit(visit)}
              style={{ padding: '12px', borderLeft: activeVisit?.id === visit.id ? '4px solid #007bff' : '4px solid #ccc', backgroundColor: activeVisit?.id === visit.id ? '#e9f2ff' : '#f9f9f9', marginBottom: '10px', cursor: 'pointer', borderRadius: '0 8px 8px 0' }}
            >
              <strong style={{ display: 'block', fontSize: '14px', color: activeVisit?.id === visit.id ? '#007bff' : '#333' }}>📅 {new Date(visit.visit_date).toLocaleDateString('pt-BR')}</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>{visit.title}</p>
              {visit.point_cloud_url && <span style={{ fontSize: '10px', background: '#6f42c1', color: 'white', padding: '2px 5px', borderRadius: '3px', marginTop: '5px', display: 'inline-block' }}>Contém Nuvem</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}