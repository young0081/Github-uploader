import { create } from 'zustand';

interface User {
  login: string;
  avatar_url: string;
  name?: string;
}

interface Repository {
  name: string;
  private: boolean;
  description?: string;
  html_url?: string;
  clone_url?: string;
  _targetBranch?: string;
  default_branch?: string;
  id?: number;
  full_name?: string;
  owner?: any;
}

interface AppState {
  currentPath: string;
  user: User | null;
  targetRepo: Repository | null;
  setPath: (path: string) => void;
  setUser: (user: User | null) => void;
  setTargetRepo: (repo: Repository | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPath: '',
  user: null,
  targetRepo: null,
  setPath: (path) => set({ currentPath: path }),
  setUser: (user) => set({ user }),
  setTargetRepo: (repo) => set({ targetRepo: repo }),
}));
