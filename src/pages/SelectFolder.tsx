import { open } from '@tauri-apps/plugin-dialog';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { FolderUp, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function SelectFolder() {
  const navigate = useNavigate();
  const setPath = useAppStore((state) => state.setPath);
  const { t } = useTranslation();

  const handleSelect = async () => {
    try {
        const selected = await open({
          directory: true,
          multiple: false,
        });
        
        if (selected) {
          setPath(selected as string);
          navigate('/auth');
        }
    } catch (e) {
        console.error("Dialog failed:", e);
        alert("Failed to open dialog: " + e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 relative">
      <LanguageSwitcher />
      <div className="space-y-4">
        <div className="flex justify-center">
            <div className="bg-primary/20 p-6 rounded-full">
                <Github size={64} className="text-primary" />
            </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {t('selectFolder.title')}
        </h1>
        <p className="text-muted text-lg max-w-md mx-auto">
          {t('selectFolder.subtitle')}
        </p>
      </div>

      <div className="card w-full max-w-md space-y-6">
        <div className="flex flex-col items-center py-8 border-2 border-dashed border-border rounded-lg bg-background/50">
            <FolderUp size={48} className="text-muted mb-4" />
            <p className="text-sm text-muted mb-6">{t('selectFolder.ctaBoxTitle')}</p>
            <button onClick={handleSelect} className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-blue-500/20">
              {t('selectFolder.browseBtn')}
            </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-xs text-muted">
          {t('selectFolder.footer')}
      </div>
    </div>
  );
}