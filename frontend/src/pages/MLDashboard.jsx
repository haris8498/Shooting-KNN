import React, { useState, useEffect } from 'react';
import { mlService } from '../services/api';
import { Activity, AlertTriangle, Radio } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const MetricCard = ({ label, value, color }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel hud-corners" style={{ padding: '16px 20px', textAlign: 'center' }}>
    <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', marginBottom: 6, letterSpacing: '0.1em' }}>{label}</div>
    <div className="font-military" style={{ fontSize: 32, color, textShadow: `0 0 12px ${color}` }}>{value}%</div>
  </motion.div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel font-terminal" style={{ padding: '8px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--clr-text)' }}>{payload[0].payload.name}</div>
      <div style={{ color: payload[0].fill }}>{payload[0].value.toFixed(2)}%</div>
    </div>
  );
};

const MLDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mlService.getMetrics().then(setMetrics).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div className="animate-radar-sweep" style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(0,255,136,.2)', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '50%', left: '50%', width: 28, height: 1, background: 'var(--clr-green)', transformOrigin: 'left center' }} />
      </div>
      <span className="font-terminal" style={{ color: 'var(--clr-text-dim)', fontSize: 12 }}>LOADING ML METRICS<span className="animate-blink">…</span></span>
    </div>
  );

  if (!metrics) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="glass-panel-red" style={{ padding: 24, borderRadius: 4, textAlign: 'center' }}>
        <AlertTriangle style={{ width: 32, height: 32, color: 'var(--clr-red)', margin: '0 auto 12px' }} />
        <div className="font-military" style={{ color: 'var(--clr-red)', marginBottom: 8 }}>CONNECTION FAILURE</div>
        <div className="font-terminal" style={{ fontSize: 11, color: 'var(--clr-text-dim)' }}>ML service offline — start FastAPI server</div>
      </div>
    </div>
  );

  const chartData = [
    { name: 'Accuracy',  value: metrics.accuracy  * 100, color: '#00ff88' },
    { name: 'Precision', value: metrics.precision  * 100, color: '#00d4ff' },
    { name: 'Recall',    value: metrics.recall     * 100, color: '#ffd700' },
    { name: 'F1 Score',  value: metrics.f1_score   * 100, color: '#ff8800' },
  ];

  const [[tn, fp], [fn, tp]] = metrics.confusion_matrix;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Activity style={{ width: 22, height: 22, color: 'var(--clr-green)' }} />
        <div>
          <h1 className="font-military text-glow-green" style={{ fontSize: 24, color: 'var(--clr-green)', marginBottom: 2 }}>ML ANALYTICS TERMINAL</h1>
          <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>kNN PERFORMANCE INTELLIGENCE — LIVE</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="status-dot" />
          <span className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>MODEL ACTIVE</span>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        {chartData.map((m, i) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <MetricCard label={m.name.toUpperCase()} value={m.value.toFixed(1)} color={m.color} />
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Bar chart */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 }} className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Radio style={{ width: 14, height: 14, color: 'var(--clr-green)' }} />
            <span className="font-military" style={{ fontSize: 13, color: 'var(--clr-green)' }}>PERFORMANCE METRICS</span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} stroke="rgba(0,255,136,.2)" tick={{ fill: '#4a9a6a', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                <YAxis dataKey="name" type="category" stroke="rgba(0,255,136,.2)" tick={{ fill: '#4a9a6a', fontSize: 10, fontFamily: 'Share Tech Mono' }} width={70} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,255,136,.04)' }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Confusion matrix */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .25 }} className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Activity style={{ width: 14, height: 14, color: 'var(--clr-green)' }} />
            <span className="font-military" style={{ fontSize: 13, color: 'var(--clr-green)' }}>THREAT CLASSIFICATION MATRIX</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 8 }}>
            <div />
            <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', textAlign: 'center', padding: '4px 0' }}>PRED: FRIENDLY</div>
            <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', textAlign: 'center', padding: '4px 0' }}>PRED: ENEMY</div>

            <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>ACTUAL: FRIENDLY</div>
            <div className="glass-panel glow-green" style={{ padding: '18px 8px', textAlign: 'center', borderRadius: 4 }}>
              <div className="font-military" style={{ fontSize: 28, color: 'var(--clr-green)' }}>{tn}</div>
              <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)' }}>TRUE NEG</div>
            </div>
            <div className="glass-panel-red glow-red" style={{ padding: '18px 8px', textAlign: 'center', borderRadius: 4 }}>
              <div className="font-military" style={{ fontSize: 28, color: 'var(--clr-red)' }}>{fp}</div>
              <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)' }}>FALSE POS</div>
            </div>

            <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>ACTUAL: ENEMY</div>
            <div className="glass-panel-red glow-red" style={{ padding: '18px 8px', textAlign: 'center', borderRadius: 4 }}>
              <div className="font-military" style={{ fontSize: 28, color: 'var(--clr-red)' }}>{fn}</div>
              <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)' }}>FALSE NEG</div>
            </div>
            <div className="glass-panel glow-green" style={{ padding: '18px 8px', textAlign: 'center', borderRadius: 4 }}>
              <div className="font-military" style={{ fontSize: 28, color: 'var(--clr-green)' }}>{tp}</div>
              <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)' }}>TRUE POS</div>
            </div>
          </div>

          {(fp > 0 || fn > 0) && (
            <div className="glass-panel-red" style={{ marginTop: 16, padding: '10px 14px', borderRadius: 4, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle style={{ width: 14, height: 14, color: 'var(--clr-orange)', flexShrink: 0, marginTop: 1 }} />
              <p className="font-terminal" style={{ fontSize: 10, color: '#ff8844', lineHeight: 1.6 }}>
                Classification errors detected. Tune K-value or distance metric in Config panel to reduce false positives (friendly fire) and false negatives (missed enemies).
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MLDashboard;
