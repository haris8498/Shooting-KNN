import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Target, AlertTriangle, Shield, RotateCcw, Settings, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const AnimatedStat = ({ label, value, color = 'var(--clr-green)', icon: Icon }) => (
  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel hud-corners" style={{ padding: '18px 20px', textAlign: 'center' }}>
    {Icon && <Icon style={{ width: 20, height: 20, color, margin: '0 auto 8px', opacity: .7 }} />}
    <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)', marginBottom: 6, letterSpacing: '0.12em' }}>{label}</div>
    <motion.div
      className="font-military"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{ fontSize: 36, color, textShadow: `0 0 14px ${color}` }}
    >
      {value}
    </motion.div>
  </motion.div>
);

const MatchSummary = () => {
  const { state } = useLocation();
  if (!state) return <Navigate to="/" />;

  const formatClassifierLabel = (classifier) => {
    if (!classifier) return 'Model';
    return classifier.toString().replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  };
  const classifierLabel = formatClassifierLabel(localStorage.getItem('selectedClassifier') || 'kNN');

  const { score, correctEnemyKills, friendlyFireMistakes, missedEnemies, totalPlanes } = state;
  const accuracy = totalPlanes > 0
    ? ((correctEnemyKills + (totalPlanes - correctEnemyKills - friendlyFireMistakes - missedEnemies)) / totalPlanes * 100)
    : 0;

  const getAdvice = () => {
    const advice = [];
    if (friendlyFireMistakes > 2) advice.push({ text: 'High friendly-fire rate. Decrease K to make the model more locally sensitive, or try Manhattan distance.', type: 'warn' });
    if (missedEnemies > 2)        advice.push({ text: 'Enemies slipping through. Model may be underfitting — increase training data ratio to 80/20 or higher.', type: 'warn' });
    if (accuracy < 60)            advice.push({ text: 'Low overall accuracy. Try a higher K to smooth out noisy predictions. StandardScaler is active.', type: 'crit' });
    if (advice.length === 0)      advice.push({ text: `Excellent performance. ${classifierLabel} parameters are well-tuned for this operational environment.`, type: 'ok' });
    return advice;
  };

  const missionSuccess = score > 0 && missedEnemies < 3;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
          {missionSuccess
            ? <Shield style={{ width: 64, height: 64, color: 'var(--clr-green)' }} className="text-glow-green" />
            : <Target style={{ width: 64, height: 64, color: 'var(--clr-red)' }} className="text-glow-red" />
          }
          <div style={{ position: 'absolute', inset: 0, background: missionSuccess ? 'var(--clr-green)' : 'var(--clr-red)', borderRadius: '50%', opacity: .08, filter: 'blur(20px)' }} />
        </div>
        <h1 className="font-military" style={{ fontSize: 'clamp(22px,4vw,40px)', color: missionSuccess ? 'var(--clr-green)' : 'var(--clr-red)', textShadow: `0 0 20px ${missionSuccess ? 'rgba(0,255,136,.6)' : 'rgba(255,34,68,.6)'}`, marginBottom: 6 }}>
          {missionSuccess ? 'MISSION ACCOMPLISHED' : 'MISSION COMPROMISED'}
        </h1>
        <div className="font-terminal" style={{ fontSize: 11, color: 'var(--clr-text-dim)', letterSpacing: '0.2em' }}>POST-OPERATION ANALYTICS REPORT</div>
      </motion.div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'TOTAL SCORE',     value: score,                icon: Zap,           color: 'var(--clr-green)' },
          { label: 'ENEMIES KILLED',  value: correctEnemyKills,   icon: Target,        color: 'var(--clr-cyan)'  },
          { label: 'FRIENDLY FIRE',   value: friendlyFireMistakes, icon: AlertTriangle, color: 'var(--clr-red)'   },
          { label: 'MISSED ENEMIES',  value: missedEnemies,        icon: AlertTriangle, color: 'var(--clr-orange)'},
          { label: 'ACCURACY',        value: `${accuracy.toFixed(0)}%`, icon: Shield,   color: accuracy > 70 ? 'var(--clr-green)' : accuracy > 50 ? 'var(--clr-orange)' : 'var(--clr-red)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <AnimatedStat {...s} />
          </motion.div>
        ))}
      </div>

      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }} className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AlertTriangle style={{ width: 16, height: 16, color: 'var(--clr-orange)' }} />
          <span className="font-military" style={{ fontSize: 14, color: 'var(--clr-orange)' }}>AI TUNING RECOMMENDATIONS</span>
        </div>
        {getAdvice().map((a, i) => {
          const col = a.type === 'ok' ? 'var(--clr-green)' : a.type === 'crit' ? 'var(--clr-red)' : 'var(--clr-orange)';
          return (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < getAdvice().length - 1 ? '1px solid var(--clr-border)' : 'none' }}>
              <span style={{ color: col, fontSize: 14, flexShrink: 0 }}>▶</span>
              <p className="font-terminal" style={{ fontSize: 11, color: 'rgba(160,255,200,.7)', lineHeight: 1.7 }}>{a.text}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .7 }} style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
        <Link to="/play" className="btn-mil btn-mil-red" style={{ padding: '12px 28px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RotateCcw style={{ width: 14, height: 14 }} /> REDEPLOY
        </Link>
        <Link to="/config" className="btn-mil btn-mil-cyan" style={{ padding: '12px 28px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings style={{ width: 14, height: 14 }} /> RECALIBRATE AI
        </Link>
        <Link to="/dashboard" className="btn-mil" style={{ padding: '12px 28px', fontSize: 13 }}>
          VIEW ML DATA
        </Link>
      </motion.div>
    </div>
  );
};

export default MatchSummary;
