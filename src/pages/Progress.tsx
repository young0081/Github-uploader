import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home, ExternalLink, RefreshCw, Terminal } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Progress() {
  const [logs, setLogs] = useState<string[]>([]);
  const { currentPath, targetRepo } = useAppStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'running' | 'success' | 'error'>('running');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    runProcess();
  }, []);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [logs]);

  const log = (msg: string) => setLogs(prev => [...prev, msg]);

  const runProcess = async () => {
    setLogs([]);
    try {
        setStatus('running');
        log(t('progress.log.start'));
        log(t('progress.log.target', { path: currentPath }));
        
        log(t('progress.log.init'));
        await invoke('init_repo', { path: currentPath });
        
        log(t('progress.log.stage'));
        await invoke('stage_all', { path: currentPath });
        
        log(t('progress.log.commit'));
        await invoke('commit_all', { path: currentPath, message: "Initial commit via GitHub Uploader" });
        
        let remoteUrl = "";
        let branch = "main";

        if (targetRepo) {
            branch = targetRepo._targetBranch || "main";
            if (!targetRepo.html_url && !targetRepo.clone_url) {
                log(t('progress.log.createRepo', { name: targetRepo.name }));
                const repo: any = await invoke('create_repo', {
                    name: targetRepo.name,
                    private: targetRepo.private,
                    description: targetRepo.description
                });
                remoteUrl = repo.clone_url;
                log(t('progress.log.repoCreated', { url: repo.html_url }));
            } else {
                remoteUrl = targetRepo.clone_url || (targetRepo.html_url + ".git");
                log(t('progress.log.useExisting', { name: targetRepo.full_name }));
            }
        }

        log(t('progress.log.addRemote', { url: remoteUrl }));
        await invoke('add_remote', { path: currentPath, url: remoteUrl });
        
        log(t('progress.log.push', { branch }));
        await invoke('push', { path: currentPath, branch });
        
        log(t('progress.log.success'));
        setStatus('success');
        
    } catch (e: any) {
        log(t('progress.log.error', { error: e.toString() }));
        setStatus('error');
    }
  };

  return (
    <div className="container h-full flex flex-col p-6 space-y-6 relative">
      <LanguageSwitcher />
      <div className="flex items-center justify-center gap-4">
          {status === 'running' && <Loader2 size={32} className="animate-spin text-primary" />}
          {status === 'success' && <CheckCircle size={32} className="text-green-500" />}
          {status === 'error' && <XCircle size={32} className="text-red-500" />}
          
          <h1 className="text-2xl font-bold">
              {status === 'running' ? t('progress.titleRunning') : status === 'success' ? t('progress.titleSuccess') : t('progress.titleError')}
          </h1>
      </div>

      <div className="card flex-1 p-0 flex flex-col overflow-hidden bg-[#0d1117] border-border shadow-2xl">
          <div className="p-2 border-b border-border/50 bg-white/5 flex items-center gap-2 text-xs text-muted font-mono">
              <Terminal size={14} /> {t('progress.consoleOutput')}
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2">
            {logs.map((l, i) => (
                <div key={i} className={clsx("break-words", 
                    l.includes("❌") ? "text-red-400" : 
                    l.includes("✨") ? "text-green-400 font-bold" : 
                    l.includes("🚀") ? "text-blue-400 font-bold" : "text-gray-400"
                )}>
                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {l}
                </div>
            ))}
          </div>
      </div>
      
      <div className="flex justify-center gap-4">
          {status === 'success' && (
              <button 
                className="btn btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2" 
                onClick={() => window.open(targetRepo?.html_url || "https://github.com", '_blank')}
              >
                  <ExternalLink size={18} /> {t('progress.openGithub')}
              </button>
          )}
          {status === 'error' && (
              <button className="btn btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2" onClick={runProcess}>
                  <RefreshCw size={18} /> {t('common.retry')}
              </button>
          )}
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => navigate('/')}>
              <Home size={18} /> {t('progress.backHome')}
          </button>
      </div>
    </div>
  );
}
