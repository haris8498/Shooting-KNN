import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Settings, Activity, Target, Radio, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';

const RadarBg = () => (
  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', overflow:'hidden' }}>
    {[300,240,180,120,60].map((s,i) => (
      <div key={i} style={{ position:'absolute', width:s*2, height:s*2, border:'1px solid rgba(0,255,136,0.07)', borderRadius:'50%' }} />
    ))}
    {/* Sweep arm */}
    <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', overflow:'hidden' }}>
      <div className="animate-radar-sweep" style={{ position:'absolute', bottom:'50%', left:'50%', width:300, height:2, transformOrigin:'left center', background:'linear-gradient(90deg, transparent, rgba(0,255,136,0.6))', boxShadow:'0 0 15px rgba(0,255,136,0.4)' }} />
    </div>
    {/* Cross hairs */}
    <div style={{ position:'absolute', width:600, height:1, background:'rgba(0,255,136,0.06)' }} />
    <div style={{ position:'absolute', height:600, width:1, background:'rgba(0,255,136,0.06)' }} />
  </div>
);

const cards = [
  {
    to: '/play',
    Icon: Target,
    color: 'var(--clr-red)',
    label: 'INITIATE MISSION',
    sub: 'Deploy into the radar defense simulation',
    desc: 'Classify incoming aircraft in real-time using the live kNN model. Destroy enemies, protect friendlies.',
    tag: 'LIVE SIMULATION',
  },
  {
    to: '/config',
    Icon: Settings,
    color: 'var(--clr-cyan)',
    label: 'CALIBRATE AI',
    sub: 'Configure the kNN model parameters',
    desc: 'Adjust K-value, train/test split ratio, and distance metric. Retrain and observe accuracy shifts.',
    tag: 'MODEL CONFIG',
  },
  {
    to: '/dashboard',
    Icon: Activity,
    color: 'var(--clr-green)',
    label: 'ML ANALYTICS',
    sub: 'Live performance metrics dashboard',
    desc: 'Accuracy, Precision, Recall, F1-Score, and Confusion Matrix from the current trained model.',
    tag: 'DATA INTEL',
  },
];

const Home = () => (
  <div style={{ minHeight:'calc(100vh - 60px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', position:'relative', overflow:'hidden' }}>
    <RadarBg />

    {/* Hero */}
    <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7 }} style={{ textAlign:'center', marginBottom:56, position:'relative', zIndex:1 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:20 }}>
        <span className="status-dot" />
        <span className="font-terminal" style={{ fontSize:11, color:'var(--clr-text-dim)', letterSpacing:'0.2em' }}>TACTICAL AI SYSTEM v2.1 — ONLINE</span>
        <span className="status-dot" />
      </div>

      <div style={{ position:'relative', display:'inline-block', marginBottom:24 }}>
        <Shield style={{ width:80, height:80, color:'var(--clr-green)' }} className="text-glow-green" />
        <div style={{ position:'absolute', inset:0, background:'var(--clr-green)', borderRadius:'50%', opacity:.08, filter:'blur(20px)' }} />
      </div>

      <h1 className="font-military text-glow-green" style={{ fontSize:'clamp(28px,5vw,56px)', color:'var(--clr-green)', lineHeight:1.1, marginBottom:8 }}>
        AI PLANE DEFENSE
      </h1>
      <h2 className="font-military" style={{ fontSize:'clamp(14px,2.5vw,22px)', color:'var(--clr-cyan)', letterSpacing:'0.25em', marginBottom:20 }}>
        SYSTEM — kNN TACTICAL CLASSIFIER
      </h2>
      <p className="font-terminal" style={{ fontSize:13, color:'var(--clr-text-dim)', maxWidth:560, margin:'0 auto', lineHeight:1.7 }}>
        An interactive machine learning simulator. Defend your base by classifying incoming aircraft using real-time k-Nearest Neighbor predictions.
      </p>
    </motion.div>

    {/* Cards */}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, maxWidth:980, width:'100%', position:'relative', zIndex:1 }}>
      {cards.map(({ to, Icon, color, label, sub, desc, tag }, i) => (
        <motion.div key={to} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.12, duration:.5 }}>
          <Link to={to} style={{ textDecoration:'none', display:'block' }}>
            <div
              className="glass-panel hud-corners"
              style={{ padding:28, height:'100%', cursor:'pointer', transition:'all .25s ease', borderColor: `${color}30` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=`${color}60`; e.currentTarget.style.boxShadow=`0 0 25px ${color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=`${color}30`; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <Icon style={{ width:32, height:32, color }} />
                <span className="font-terminal" style={{ fontSize:9, color, letterSpacing:'0.15em', border:`1px solid ${color}40`, padding:'2px 8px', borderRadius:2 }}>{tag}</span>
              </div>
              <div className="font-military" style={{ fontSize:18, color, marginBottom:4 }}>{label}</div>
              <div className="font-terminal" style={{ fontSize:11, color:'var(--clr-text-dim)', marginBottom:12 }}>{sub}</div>
              <p style={{ fontSize:13, color:'rgba(160,255,200,.55)', lineHeight:1.65 }}>{desc}</p>
              <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:8, color, fontSize:12 }} className="font-military">
                <Crosshair style={{ width:12, height:12 }} />
                <span>ACCESS →</span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>

    {/* Bottom status bar */}
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.8 }} className="font-terminal" style={{ marginTop:48, display:'flex', gap:32, fontSize:10, color:'var(--clr-text-dim)', position:'relative', zIndex:1 }}>
      {['kNN ENGINE: READY','RADAR: ACTIVE','THREAT DATABASE: LOADED','ML ACCURACY: COMPUTED'].map(s => (
        <span key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="status-dot" style={{ width:5, height:5 }} />{s}
        </span>
      ))}
    </motion.div>
  </div>
);

export default Home;
