import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

export default function WizardPreview({ html, isLoading }) {
    const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
    const iframeRef = useRef(null);

    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            doc.open();
            doc.write(html || '<div style="color: white; font-family: sans-serif; text-align: center; padding-top: 50px;">Generando previsualización...</div>');
            doc.close();
        }
    }, [html]);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800">
                <span className="text-sm font-semibold text-slate-300">Vista Previa en Vivo</span>
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('desktop')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Vista Escritorio"
                    >
                        <Monitor size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('mobile')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Vista Móvil"
                    >
                        <Smartphone size={18} />
                    </button>
                </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 overflow-auto bg-slate-900 p-4 flex justify-center items-start relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                <div
                    className={`transition-all duration-300 bg-white shadow-2xl overflow-hidden ${viewMode === 'mobile'
                            ? 'w-[375px] h-[667px] rounded-3xl border-[8px] border-slate-800'
                            : 'w-full h-full rounded-md'
                        }`}
                >
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full border-none bg-white"
                        title="Landing Preview"
                    />
                </div>
            </div>
        </div>
    );
}
