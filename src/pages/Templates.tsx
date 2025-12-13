import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Eye, CheckSquare, Square } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Templates() {
  const navigate = useNavigate();
  const { currentPath } = useAppStore();
  const { t } = useTranslation();
  
  const [templates, setTemplates] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{name: string, diff: any} | null>(null);
  
  useEffect(() => {
    invoke('get_templates').then((res: any) => setTemplates(res));
  }, []);

  const toggleTemplate = (t: string) => {
    const newSet = new Set(selected);
    if (newSet.has(t)) newSet.delete(t);
    else newSet.add(t);
    setSelected(newSet);
    loadPreview(t);
  };

  const loadPreview = async (name: string) => {
      let filename = name;
      if (name.startsWith("gitignore")) filename = ".gitignore";
      if (name.startsWith("LICENSE")) filename = "LICENSE";
      
      const diff: any = await invoke('preview_template', { path: currentPath, filename, templateName: name });
      setPreview({ name, diff });
  };

  const handleNext = async () => {
      for (const t of selected) {
          let filename = t;
          if (t.startsWith("gitignore")) filename = ".gitignore";
          if (t.startsWith("LICENSE")) filename = "LICENSE";
          await invoke('write_template_file', { path: currentPath, filename, templateName: t });
      }
      navigate('/progress');
  };

  return (
    <div className="container h-full flex flex-col p-6 relative">
      <LanguageSwitcher />
      <h1 className="text-2xl font-bold mb-6 text-center">{t('templates.title')}</h1>
      
      <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="w-1/3 card p-0 flex flex-col">
              <div className="p-4 border-b border-border font-medium bg-background/50">
                  {t('templates.availableFiles')}
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                  {templates.map(t => (
                      <div key={t} 
                        onClick={() => toggleTemplate(t)}
                        className={clsx("flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors", 
                            selected.has(t) ? "bg-primary/10 border border-primary/50" : "hover:bg-white/5 border border-transparent")}
                      >
                          {selected.has(t) ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} className="text-muted" />}
                          <span className={clsx("flex-1", selected.has(t) && "text-primary font-medium")}>{t}</span>
                          <button onClick={(e) => { e.stopPropagation(); loadPreview(t); }} className="text-muted hover:text-white p-1">
                              <Eye size={16} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="flex-1 card p-0 flex flex-col h-full">
              <div className="p-4 border-b border-border font-medium bg-background/50 flex justify-between items-center">
                  <span>{preview ? t('templates.preview', { name: preview.name }) : "None"}</span>
                  {preview && (
                      <span className={clsx("text-xs px-2 py-1 rounded", 
                        preview.diff.status === 'new' ? "bg-green-500/20 text-green-500" : 
                        preview.diff.status === 'modified' ? "bg-yellow-500/20 text-yellow-500" : "bg-gray-500/20 text-gray-400"
                      )}>
                          {preview.diff.status === 'new' ? t('templates.statusNew') : t('templates.statusModified')}
                      </span>
                  )}
              </div>
              <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300">
                  {preview ? (
                      <pre className="whitespace-pre-wrap break-all">
                          {preview.diff.diff_content || "(No content to show)"}
                      </pre>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted gap-2">
                          <FileText size={48} className="opacity-20" />
                          <p>{t('templates.noContent')}</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
      
      <div className="mt-6 flex justify-end">
          <button onClick={handleNext} className="btn btn-primary px-8 flex items-center gap-2">
              {t('templates.startUpload')} <ArrowRight size={18} />
          </button>
      </div>
    </div>
  );
}
