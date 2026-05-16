import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mlService, backendService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Volume2, VolumeX, Radio, Shield, Target, AlertTriangle, Activity, Zap } from 'lucide-react';
import useSound from '../hooks/useSound';

const formatClassifierLabel = (classifier) => {
  if (!classifier) return 'Model';
  return classifier.toString().replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
};

const MAX_PLANES = 10;

const Pip = ({ label, value, color = 'var(--clr-green)', max = 100 }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fillClass = color === 'var(--clr-red)' ? 'data-bar-fill-red' : color === 'var(--clr-cyan)' ? 'data-bar-fill-cyan' : 'data-bar-fill';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>{label}</span>
        <span className="font-terminal" style={{ fontSize: 10, color }}>{typeof value === 'number' ? (value < 10 ? value.toFixed(2) : Math.round(value)) : value}</span>
      </div>
      <div className="data-bar-track"><div className={fillClass} style={{ width: `${pct}%` }} /></div>
    </div>
  );
};

const StatCard = ({ label, value, color = 'green', icon: Icon }) => {
  const cls = color === 'red' ? 'stat-card-red' : color === 'cyan' ? 'stat-card-cyan' : 'stat-card';
  const col = color === 'red' ? 'var(--clr-red)' : color === 'cyan' ? 'var(--clr-cyan)' : 'var(--clr-green)';
  return (
    <div className={cls} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <div>
        <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)', marginBottom: 2 }}>{label}</div>
        <div className="font-military" style={{ fontSize: 22, color: col, lineHeight: 1 }}>{value}</div>
      </div>
      {Icon && <Icon style={{ width: 18, height: 18, color: col, opacity: 0.5 }} />}
    </div>
  );
};

const Gameplay = () => {
  const navigate = useNavigate();
  const sound = useSound();
  // Use a ref for sound so spawnPlane never needs to re-create
  const soundRef = useRef(sound);
  useEffect(() => { soundRef.current = sound; });

  const [score, setScore]           = useState(0);
  const [planes, setPlanes]         = useState([]);
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [gameOver, setGameOver]     = useState(false);
  const [baseHealth, setBaseHealth] = useState(100);
  const [explosions, setExplosions] = useState([]);

  const statsRef       = useRef({ correctEnemyKills: 0, friendlyFireMistakes: 0, missedEnemies: 0, totalPlanes: 0 });
  const baseHealthRef  = useRef(100);
  const selectedRef    = useRef(null);
  const gameOverRef    = useRef(false);
  const fieldRef       = useRef(null);
  const scoreRef       = useRef(0);

  // Keep scoreRef in sync for endGame
  useEffect(() => { scoreRef.current = score; }, [score]);

  // spawnPlane — stable, uses refs only, never re-creates
  const spawnPlane = useCallback(async () => {
    if (gameOverRef.current) return;
    setPlanes(prev => { if (prev.length >= MAX_PLANES) return prev; return prev; }); // gate check handled below
    try {
      const planeData = await mlService.getRandomPlane();
      if (!planeData) return;
      const fw = fieldRef.current?.clientWidth || 700;
      const newPlane = {
        id: Date.now() + Math.random(),
        isEnemy: planeData.isEnemy,
        features: planeData.features,
        x: 40 + Math.random() * (fw - 80),
        y: 0,
        speed: 0.5 + Math.random() * 1.0,
      };
      setPlanes(prev => {
        if (prev.length >= MAX_PLANES) return prev; // hard cap
        return [...prev, newPlane];
      });
      statsRef.current.totalPlanes++;
      if (planeData.isEnemy) soundRef.current.playEnemyAlert();
    } catch (err) { console.error('spawn error', err); }
  }, []); // EMPTY deps — only uses refs/stable functions

  const addExplosion = useCallback((x, y) => {
    const id = Date.now();
    setExplosions(prev => [...prev, { id, x, y }]);
    setTimeout(() => setExplosions(prev => prev.filter(e => e.id !== id)), 700);
  }, []);

  // Main game loop — spawnPlane is now stable so this only re-runs when gameOver changes
  useEffect(() => {
    if (gameOver) return;
    const fh = fieldRef.current?.clientHeight || 520;

    const interval = setInterval(() => {
      setPlanes(prev =>
        prev.map(p => ({
          ...p,
          y: p.y + p.speed,
          features: { ...p.features, Distance_From_Base: Math.max(0, 100 - ((p.y + p.speed) / fh) * 100) },
        })).filter(p => {
          if (p.y > fh) {
            if (p.isEnemy) {
              baseHealthRef.current = Math.max(0, baseHealthRef.current - 20);
              setBaseHealth(baseHealthRef.current);
              statsRef.current.missedEnemies++;
              if (baseHealthRef.current <= 0) {
                gameOverRef.current = true;
                setGameOver(true);
              }
            } else {
              setScore(s => s + 5);
            }
            if (selectedRef.current?.id === p.id) {
              setSelectedPlane(null); selectedRef.current = null; setPredictionData(null);
            }
            return false;
          }
          return true;
        })
      );
    }, 50);

    // Spawn: first plane after 1s, then every 3s
    const firstSpawn = setTimeout(spawnPlane, 1000);
    const spawner = setInterval(spawnPlane, 3500);

    return () => { clearInterval(interval); clearInterval(spawner); clearTimeout(firstSpawn); };
  }, [gameOver, spawnPlane]);

  // End game
  useEffect(() => {
    if (!gameOver) return;
    const matchData = { score: scoreRef.current, ...statsRef.current };
    backendService.saveMatch(matchData).catch(console.error);
    const t = setTimeout(() => navigate('/summary', { state: matchData }), 2500);
    return () => clearTimeout(t);
  }, [gameOver, navigate]);

  const handleSelectPlane = useCallback(async (plane) => {
    setSelectedPlane(plane); selectedRef.current = plane;
    soundRef.current.playLock();
    try {
      const result = await mlService.predict(plane.features);
      setPredictionData(result);
      soundRef.current.playRadarPing();
    } catch (err) { console.error(err); }
  }, []);

  const handleFire = useCallback(() => {
    if (!selectedPlane || gameOver) return;
    addExplosion(selectedPlane.x, selectedPlane.y);
    soundRef.current.playMissileFire();
    setTimeout(() => soundRef.current.playExplosion(), 150);
    if (selectedPlane.isEnemy) {
      setScore(s => s + 10);
      statsRef.current.correctEnemyKills++;
    } else {
      setScore(s => s - 20);
      statsRef.current.friendlyFireMistakes++;
    }
    setPlanes(prev => prev.filter(p => p.id !== selectedPlane.id));
    setSelectedPlane(null); selectedRef.current = null; setPredictionData(null);
  }, [selectedPlane, gameOver, addExplosion]);

  const hp = baseHealth;
  const hpColor = hp > 60 ? 'var(--clr-green)' : hp > 30 ? 'var(--clr-orange)' : 'var(--clr-red)';
  const f = selectedPlane?.features;
  const isEnemy = predictionData?.prediction === 'Enemy';
  const classifierLabel = formatClassifierLabel(localStorage.getItem('selectedClassifier') || 'kNN');

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--clr-bg)', overflow: 'hidden' }}>

      {/* TOP HUD */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', borderLeft: 'none', borderRight: 'none', borderTop: 'none', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield style={{ width: 18, height: 18, color: 'var(--clr-green)' }} />
          <span className="font-military text-glow-green" style={{ fontSize: 13, color: 'var(--clr-green)' }}>AI PLANE DEFENSE — TACTICAL OPS</span>
          <span className="status-dot" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>BASE INT</span>
          <div style={{ width: 120, height: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(0,255,136,.15)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${hp}%`, background: `linear-gradient(90deg,${hpColor},${hpColor}aa)`, boxShadow: `0 0 8px ${hpColor}`, transition: 'width .5s ease, background .5s ease' }} />
          </div>
          <span className="font-military" style={{ fontSize: 13, color: hpColor, minWidth: 36 }}>{hp}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>SCORE</span>
          <span className="font-military text-glow-green" style={{ fontSize: 18, color: 'var(--clr-green)' }}>{score}</span>
          <button onClick={sound.toggleMute} className="btn-mil" style={{ padding: '4px 10px', marginLeft: 8 }}>
            {sound.muted ? <VolumeX style={{ width: 14, height: 14 }} /> : <Volume2 style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT PANEL */}
        <div className="glass-panel" style={{ width: 255, display: 'flex', flexDirection: 'column', borderTop: 'none', borderBottom: 'none', borderLeft: 'none', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio style={{ width: 13, height: 13, color: 'var(--clr-green)' }} />
            <span className="font-military" style={{ fontSize: 11, color: 'var(--clr-green)' }}>RADAR ANALYSIS</span>
          </div>
          <div className="panel-scroll" style={{ flex: 1, padding: '10px 14px' }}>
            {(!selectedPlane || !predictionData) ? (
              <div style={{ textAlign: 'center', paddingTop: 32 }}>
                <div className="animate-radar-sweep" style={{ width: 46, height: 46, borderRadius: '50%', border: '1px solid rgba(0,255,136,.2)', margin: '0 auto 14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: '50%', left: '50%', width: 21, height: 1, background: 'var(--clr-green)', transformOrigin: 'left center', opacity: .6 }} />
                </div>
                <p className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', lineHeight: 1.9 }}>
                  {selectedPlane ? `QUERYING ${classifierLabel}…` : 'AWAITING TARGET LOCK'}<br /><span className="animate-blink">█</span>
                </p>
              </div>
            ) : (
              <div className="animate-fade-up">
                <div className={`glass-panel-${isEnemy ? 'red' : 'cyan'}`} style={{ padding: '8px 12px', textAlign: 'center', marginBottom: 12, borderRadius: 3, animation: `glow-pulse-${isEnemy ? 'red' : 'cyan'} 1.5s ease-in-out infinite` }}>
                  <div className="font-military" style={{ fontSize: 18, color: isEnemy ? 'var(--clr-red)' : 'var(--clr-cyan)' }}>{isEnemy ? '⚠ ENEMY' : '✓ FRIENDLY'}</div>
                  <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', marginTop: 2 }}>CONF: {(predictionData.confidence * 100).toFixed(1)}%</div>
                  <div style={{ marginTop: 6 }}><div className="data-bar-track"><div className={isEnemy ? 'data-bar-fill-red' : 'data-bar-fill-cyan'} style={{ width: `${predictionData.confidence * 100}%` }} /></div></div>
                </div>
                <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--clr-border)' }}>
                  <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)', marginBottom: 6 }}>SENSOR READINGS</div>
                  {f && <>
                    <Pip label="ALTITUDE"   value={f.Altitude}             max={15000} />
                    <Pip label="SPEED"      value={f.Speed}                max={1000} />
                    <Pip label="DISTANCE"   value={f.Distance_From_Base}   max={100} />
                    <Pip label="HEAT SIG"   value={f.Heat_Signature}       max={1} />
                    <Pip label="RADAR SIG"  value={f.Radar_Signal}         max={1} />
                    <Pip label="SIZE"       value={f.Plane_Size}           max={100} />
                    <Pip label="DIRECTION"  value={f.Direction_Angle}      max={360} color="var(--clr-cyan)" />
                  </>}
                </div>
                <div>
                  <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)', marginBottom: 6 }}>{classifierLabel.toUpperCase()} NEIGHBORS</div>
                  {predictionData.neighbors?.map((n, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.class === 'Enemy' ? 'var(--clr-red)' : 'var(--clr-cyan)', flexShrink: 0 }} />
                      <span className="font-terminal" style={{ fontSize: 10, color: n.class === 'Enemy' ? 'var(--clr-red)' : 'var(--clr-cyan)', flex: 1 }}>#{i + 1} {n.class}</span>
                      <span className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)' }}>d={n.distance.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER RADAR FIELD */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div ref={fieldRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at center, rgba(0,255,136,.035) 0%, transparent 70%)' }}>
            {/* Grid circles */}
            {[80, 60, 40, 20].map((pct, i) => (
              <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: `${pct}%`, paddingBottom: `${pct}%`, border: '1px solid rgba(0,255,136,0.05)', borderRadius: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
            ))}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(0,255,136,0.04)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,255,136,0.04)', pointerEvents: 'none' }} />
            <div className="moving-scan" />

            {/* Planes */}
            <AnimatePresence>
              {planes.map(p => {
                const isSel = selectedPlane?.id === p.id;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 2.5 }}
                    onClick={() => !gameOver && handleSelectPlane(p)}
                    style={{
                      position: 'absolute',
                      width: 16, height: 16,
                      top: p.y, left: p.x,
                      marginLeft: -8, marginTop: -8,
                      cursor: 'crosshair', zIndex: 20,
                    }}
                  >
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', outline: isSel ? `2px solid ${p.isEnemy ? 'var(--clr-red)' : 'var(--clr-cyan)'}` : 'none' }} className={p.isEnemy ? 'plane-enemy' : 'plane-friendly'} />
                    {isSel && <div style={{ position: 'absolute', inset: -6, border: `1px solid ${p.isEnemy ? 'var(--clr-red)' : 'var(--clr-cyan)'}`, borderRadius: '50%' }} className="animate-ping-expand" />}
                    <div className="font-terminal" style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: p.isEnemy ? 'var(--clr-red)' : 'var(--clr-cyan)', whiteSpace: 'nowrap', opacity: .8 }}>
                      {isSel ? (p.isEnemy ? '⚠LOCK' : '✓LOCK') : '◈'}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Explosions */}
            <AnimatePresence>
              {explosions.map(e => (
                <motion.div key={e.id} initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: .55 }}
                  style={{ position: 'absolute', left: e.x, top: e.y, width: 28, height: 28, marginLeft: -14, marginTop: -14, borderRadius: '50%', background: 'radial-gradient(circle,#ffcc00,#ff4400,transparent)', boxShadow: '0 0 30px #ff4400', pointerEvents: 'none', zIndex: 30 }}
                />
              ))}
            </AnimatePresence>

            {/* Game Over */}
            {gameOver && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                <div className="font-military text-glow-red" style={{ fontSize: 38, color: 'var(--clr-red)', letterSpacing: '0.2em', marginBottom: 10 }}>SYSTEM COMPROMISED</div>
                <div className="font-terminal" style={{ color: 'var(--clr-text-dim)', fontSize: 13 }}>Uploading mission log…</div>
              </motion.div>
            )}

            {/* Base zone */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 38, background: 'rgba(0,255,136,.03)', borderTop: '1px solid rgba(0,255,136,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, pointerEvents: 'none', zIndex: 10 }}>
              <Shield style={{ width: 14, height: 14, color: 'var(--clr-green)', opacity: .5 }} />
              <span className="font-military" style={{ fontSize: 10, color: 'rgba(0,255,136,.45)', letterSpacing: '0.2em' }}>■ BASE PERIMETER</span>
            </div>
          </div>

          {/* Fire strip */}
          <div className="glass-panel" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, borderLeft: 'none', borderRight: 'none', borderBottom: 'none', flexShrink: 0 }}>
            <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', textAlign: 'right', lineHeight: 1.7 }}>CLICK BLIP → SCAN<br />THEN FIRE MISSILE</div>
            <button onClick={handleFire} disabled={!selectedPlane || gameOver} className="fire-btn" style={{ padding: '12px 36px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Crosshair style={{ width: 18, height: 18 }} /> FIRE MISSILE
            </button>
            <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', lineHeight: 1.7 }}>ENEMY +10 PTS<br />FRIENDLY -20 PTS</div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="glass-panel" style={{ width: 225, display: 'flex', flexDirection: 'column', borderTop: 'none', borderBottom: 'none', borderRight: 'none', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity style={{ width: 13, height: 13, color: 'var(--clr-green)' }} />
            <span className="font-military" style={{ fontSize: 11, color: 'var(--clr-green)' }}>OPS STATISTICS</span>
          </div>
          <div className="panel-scroll" style={{ flex: 1, padding: '10px 14px' }}>
            <StatCard label="TOTAL SCORE"       value={score}                                icon={Zap}           color="green" />
            <StatCard label="ENEMIES KILLED"    value={statsRef.current.correctEnemyKills}   icon={Target}        color="cyan"  />
            <StatCard label="FRIENDLY FIRE"     value={statsRef.current.friendlyFireMistakes} icon={AlertTriangle} color="red"   />
            <StatCard label="MISSED ENEMIES"    value={statsRef.current.missedEnemies}        icon={AlertTriangle} color="red"   />
            <StatCard label="TOTAL CONTACTS"    value={statsRef.current.totalPlanes}          icon={Radio}         color="green" />
            <div style={{ margin: '12px 0', borderTop: '1px solid var(--clr-border)' }} />
            <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)', marginBottom: 8 }}>SIGNAL LEGEND</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--clr-red)', boxShadow: '0 0 5px var(--clr-red)' }} />
              <span className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>ENEMY AIRCRAFT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--clr-cyan)', boxShadow: '0 0 5px var(--clr-cyan)' }} />
              <span className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>FRIENDLY AIRCRAFT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gameplay;
