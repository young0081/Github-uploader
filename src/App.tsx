import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SelectFolder from './pages/SelectFolder';
import Auth from './pages/Auth';
import RepoSelect from './pages/RepoSelect';
import Templates from './pages/Templates';
import Progress from './pages/Progress';
import './App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SelectFolder />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/repo" element={<RepoSelect />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;