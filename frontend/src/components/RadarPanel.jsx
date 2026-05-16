import React from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

const RadarPanel = ({ incomingPlane, predictionData }) => {
  const formatClassifierLabel = (classifier) => {
    if (!classifier) return 'Model';
    return classifier.toString().replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const classifierLabel = formatClassifierLabel(localStorage.getItem('selectedClassifier') || 'kNN');
  // This component is no longer used in the new Gameplay layout;
  // ML analysis is rendered inline in Gameplay.jsx left panel.
  // Kept for backward compatibility.
  if (!incomingPlane || !predictionData) {
    return (
      <div className="glass-panel" style={{ padding: 20, textAlign: 'center' }}>
        <div className="animate-radar-sweep" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(0,255,136,.2)', margin: '0 auto 12px', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '50%', left: '50%', width: 22, height: 1, background: 'var(--clr-green)', transformOrigin: 'left center' }} />
        </div>
        <p className="font-terminal" style={{ fontSize: 11, color: 'var(--clr-text-dim)' }}>AWAITING TARGET LOCK</p>
      </div>
    );
  }

  const { features } = incomingPlane;
  const isEnemy = predictionData.prediction === 'Enemy';
  const col = isEnemy ? 'var(--clr-red)' : 'var(--clr-cyan)';

  return (
    <div className="glass-panel" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, borderBottom: '1px solid var(--clr-border)', paddingBottom: 10 }}>
        <Radio style={{ width: 14, height: 14, color: 'var(--clr-green)' }} />
        <span className="font-military" style={{ fontSize: 13, color: 'var(--clr-green)' }}>RADAR ANALYSIS</span>
      </div>

      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
        className={`glass-panel-${isEnemy ? 'red' : 'cyan'}`}
        style={{ padding: '8px 12px', textAlign: 'center', marginBottom: 12, borderRadius: 4 }}>
        <div className="font-military" style={{ fontSize: 18, color: col }}>
          {isEnemy ? '⚠ ENEMY' : '✓ FRIENDLY'}
        </div>
        <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>
          CONFIDENCE: {(predictionData.confidence * 100).toFixed(1)}%
        </div>
      </motion.div>

      <div className="font-terminal" style={{ fontSize: 10 }}>
        {[
          ['ALT', features.Altitude, 15000],
          ['SPD', features.Speed, 1000],
          ['DST', features.Distance_From_Base, 100],
          ['HEAT', features.Heat_Signature, 1],
        ].map(([lbl, val, max]) => (
          <div key={lbl} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: 'var(--clr-text-dim)' }}>{lbl}</span>
              <span style={{ color: 'var(--clr-text)' }}>{typeof val === 'number' && val < 10 ? val.toFixed(2) : Math.round(val)}</span>
            </div>
            <div className="data-bar-track"><div className="data-bar-fill" style={{ width: `${Math.min(100, (val / max) * 100)}%` }} /></div>
          </div>
        ))}
      </div>

      {predictionData.neighbors?.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--clr-border)', paddingTop: 10 }}>
          <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)', marginBottom: 6 }}>{classifierLabel.toUpperCase()} NEIGHBORS</div>
          {predictionData.neighbors.map((n, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="font-terminal" style={{ fontSize: 10, color: n.class === 'Enemy' ? 'var(--clr-red)' : 'var(--clr-cyan)' }}>#{i + 1} {n.class}</span>
              <span className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)' }}>d={n.distance.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RadarPanel;
