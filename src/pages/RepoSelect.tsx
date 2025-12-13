import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Search, Globe, Lock, GitBranch, AlertTriangle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function RepoSelect() {
  const navigate = useNavigate();
  const setTargetRepo = useAppStore((state) => state.setTargetRepo);
  
  const [mode, setMode] = useState<'create' | 'select'>('create');
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);

  useEffect(() => {
    if (mode === 'select') loadRepos();
  }, [mode]);

  useEffect(() => {
      const delay = setTimeout(() => {
          if (mode === 'select' && search.length > 2) loadRepos(search);
          else if (mode === 'select' && search.length === 0) loadRepos();
      }, 500);
      return () => clearTimeout(delay);
  }, [search]);

  const loadRepos = async (query?: string) => {
    setLoading(true);
    try {
      const res: any = await invoke('list_repos', { page: 1, query: query || null });
      setRepos(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
        setTargetRepo({ name: repoName, private: isPrivate });
        navigate('/templates'); 
  };

  const handleSelectRepo = async (repo: any) => {
    setLoading(true);
    try {
        const isEmpty = await invoke('check_repo_status', { owner: repo.owner.login, repo: repo.name });
        if (!isEmpty && repo.default_branch !== 'main') {
            setSelectedRepo(repo);
            setShowBranchModal(true);
        } else {
            setTargetRepo(repo);
            navigate('/templates');
        }
    } catch (e) {
        setTargetRepo(repo);
        navigate('/templates');
    } finally {
        setLoading(false);
    }
  };

  const handleBranchDecision = (decision: 'main' | 'default' | 'cancel') => {
      if (decision === 'cancel') {
          setShowBranchModal(false);
          setSelectedRepo(null);
          return;
      }
      const branch = decision === 'default' ? selectedRepo.default_branch : 'main';
      setTargetRepo({ ...selectedRepo, _targetBranch: branch });
      setShowBranchModal(false);
      navigate('/templates');
  };

  return (
    <div className="container h-full flex flex-col p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Destination Repository</h1>
        
        <div className="flex justify-center gap-4 mb-8">
            <button 
                onClick={() => setMode('create')} 
                className={clsx("btn flex-1 max-w-[150px]", mode === 'create' ? "btn-primary" : "btn-secondary")}
            >
                Create New
            </button>
            <button 
                onClick={() => setMode('select')} 
                className={clsx("btn flex-1 max-w-[150px]", mode === 'select' ? "btn-primary" : "btn-secondary")}
            >
                Select Existing
            </button>
        </div>
        
        <div className="flex-1 flex justify-center">
        {mode === 'create' && (
            <div className="card w-full max-w-md h-fit space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted">Repository Name</label>
                    <input 
                        className="input w-full"
                        placeholder="e.g. my-awesome-project" 
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-4">
                     <label className={clsx("flex-1 cursor-pointer border rounded-md p-4 flex flex-col items-center gap-2 transition-colors", !isPrivate ? "bg-primary/20 border-primary" : "bg-surface border-border opacity-50")}>
                        <input type="radio" checked={!isPrivate} onChange={() => setIsPrivate(false)} className="hidden" />
                        <Globe size={24} />
                        <span className="font-medium">Public</span>
                     </label>
                     <label className={clsx("flex-1 cursor-pointer border rounded-md p-4 flex flex-col items-center gap-2 transition-colors", isPrivate ? "bg-primary/20 border-primary" : "bg-surface border-border opacity-50")}>
                        <input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} className="hidden" />
                        <Lock size={24} />
                        <span className="font-medium">Private</span>
                     </label>
                </div>

                <button onClick={handleCreate} disabled={!repoName} className="btn btn-primary w-full mt-4">
                    Next: Templates
                </button>
            </div>
        )}

        {mode === 'select' && (
            <div className="card w-full max-w-xl h-full flex flex-col p-0 overflow-hidden">
                <div className="p-4 border-b border-border bg-background/50 sticky top-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-muted" size={18} />
                        <input 
                            className="input w-full pl-10"
                            placeholder="Search your repositories..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading && <div className="text-center py-8 text-muted"><Loader2 className="animate-spin mx-auto mb-2"/>Loading...</div>}
                    {!loading && repos.length === 0 && <div className="text-center py-8 text-muted">No repositories found.</div>}
                    
                    {repos.map(r => (
                        <div key={r.id} onClick={() => handleSelectRepo(r)} 
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded-md cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                                {r.private ? <Lock size={16} className="text-yellow-500" /> : <Globe size={16} className="text-green-500" />}
                                <span className="font-medium group-hover:text-primary transition-colors">{r.full_name}</span>
                            </div>
                            <span className="text-xs text-muted">{r.default_branch}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
        </div>

        {showBranchModal && selectedRepo && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <div className="card max-w-md w-full animate-in fade-in zoom-in duration-200">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-yellow-500/20 p-3 rounded-full">
                            <AlertTriangle className="text-yellow-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Branch Mismatch</h3>
                            <p className="text-sm text-muted mt-1">
                                The repository <strong>{selectedRepo.full_name}</strong> is not empty and uses <strong>{selectedRepo.default_branch}</strong> as default.
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-3 mt-6">
                        <button onClick={() => handleBranchDecision('main')} className="w-full text-left p-3 rounded border border-border hover:bg-white/5 transition-colors flex items-center gap-3">
                            <GitBranch size={18} className="text-blue-500" />
                            <div>
                                <div className="font-medium">Push to 'main'</div>
                                <div className="text-xs text-muted">Create or update the 'main' branch.</div>
                            </div>
                        </button>
                        <button onClick={() => handleBranchDecision('default')} className="w-full text-left p-3 rounded border border-border hover:bg-white/5 transition-colors flex items-center gap-3">
                             <GitBranch size={18} className="text-green-500" />
                            <div>
                                <div className="font-medium">Push to '{selectedRepo.default_branch}'</div>
                                <div className="text-xs text-muted">Use the repository's default branch.</div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button onClick={() => handleBranchDecision('cancel')} className="btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
