import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import ModelConfig from './pages/ModelConfig';
import MLDashboard from './pages/MLDashboard';
import Gameplay from './pages/Gameplay';
import MatchSummary from './pages/MatchSummary';
import { Shield, Settings, Activity, Target } from 'lucide-react';

function NavBar() {
  const location = useLocation();
  const [classifier, setClassifier] = useState(() => localStorage.getItem('selectedClassifier') || 'KNN');

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('selectedClassifier') || 'knn';
      const displayName = stored.toUpperCase().replace('_', ' ');
      setClassifier(displayName);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (location.pathname === '/play') return null;

  return (
    <nav className="nav-military sticky top-0 z-50">
      <div style={{ maxWidth:'1600px', margin:'0 auto', padding:'10px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'12px', textDecoration:'none' }}>
          <div style={{ position:'relative' }}>
            <Shield style={{ width:22, height:22, color:'var(--clr-green)' }} />
            <div style={{ position:'absolute', inset:0, background:'var(--clr-green)', borderRadius:'50%', opacity:.2, animation:'ping-expand 2s ease-out infinite' }} />
          </div>
          <div>
            <div className="font-military text-glow-green" style={{ fontSize:14, color:'var(--clr-green)', lineHeight:1.1 }}>AI DEFENSE SYSTEM</div>
            <div className="font-terminal" style={{ fontSize:10, color:'var(--clr-text-dim)' }}>TACTICAL COMMAND</div>
          </div>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div className="font-terminal" style={{ display:'flex', alignItems:'center', gap:'8px', marginRight:'16px', fontSize:11, color:'var(--clr-text-dim)' }}>
            <span className="status-dot" />
            <span>SYS ONLINE</span>
          </div>
          <Link to="/" className="btn-mil">Home</Link>
          <Link to="/config" className="btn-mil" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Settings style={{ width:12, height:12 }} /> Config
          </Link>
          <Link to="/dashboard" className="btn-mil" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Activity style={{ width:12, height:12 }} /> ML Data
          </Link>
          <Link to="/play" className="btn-mil btn-mil-red" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Target style={{ width:12, height:12 }} /> Deploy
          </Link>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isPlay = location.pathname === '/play';

  return (
    <div className="military-bg" style={{ minHeight:'100vh', height: isPlay ? '100vh' : 'auto', overflow: isPlay ? 'hidden' : 'auto', display:'flex', flexDirection:'column', position:'relative' }}>
      <NavBar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow: isPlay ? 'hidden' : 'visible', position:'relative', zIndex:1 }}>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/config"    element={<ModelConfig />} />
          <Route path="/dashboard" element={<MLDashboard />} />
          <Route path="/play"      element={<Gameplay />} />
          <Route path="/summary"   element={<MatchSummary />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
