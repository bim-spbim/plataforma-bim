import React, { useEffect, useRef, useState } from 'react';
import { IfcViewerAPI } from 'web-ifc-viewer';
import { Color } from 'three';

export default function IfcViewer({ ifcUrl }) {
    const containerRef = useRef(null);
    const viewerInstance = useRef(null);
    const [loading, setLoading] = useState(true);
    const [loadingText, setLoadingText] = useState("Iniciando motor BIM...");

    useEffect(() => {
        if (!containerRef.current || !ifcUrl) return;
        if (viewerInstance.current) return; 

        // Inicia o motor gráfico (Three.js)
        const viewer = new IfcViewerAPI({ 
            container: containerRef.current, 
            backgroundColor: new Color(0x111111) 
        });
        viewerInstance.current = viewer;

        // Aponta para a sua pasta public (Raiz do site)
        viewer.IFC.setWasmPath('/');

        async function loadBIM() {
            try {
                setLoading(true);
                setLoadingText("Construindo geometria 3D (Isso pode levar alguns segundos)...");
                
                // Joga o arquivo IFC direto pro motor ler
                await viewer.IFC.loadIfcUrl(ifcUrl);
                console.log("✅ Arquivo IFC carregado e renderizado!");
                
                if (viewer.shadowDropper) {
                    viewer.shadowDropper.renderShadows = true;
                }
            } catch (error) {
                console.error("🚨 ERRO CAPTURADO:", error);
                setLoadingText("⚠️ Falha ao ler o arquivo IFC.");
            } finally {
                setLoading(false);
            }
        }

        loadBIM();

        return () => {
            if (viewerInstance.current) {
                viewerInstance.current.dispose();
                viewerInstance.current = null;
            }
        };
    }, [ifcUrl]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.85)', color: '#00d2ff', fontWeight: 'bold', zIndex: 10, flexDirection: 'column', gap: '15px' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid rgba(0,210,255,0.2)', borderTopColor: '#00d2ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    <span style={{ fontSize: '14px' }}>{loadingText}</span>
                </div>
            )}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}