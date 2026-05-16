import React, { useState, useEffect, useRef } from 'react';
import { mlService } from '../services/api';
import { Activity, AlertTriangle, Radio, BarChart3, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid } from 'recharts';
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

const formatClassifierLabel = (classifier) => {
  if (!classifier) return 'MODEL';
  return classifier
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const MLDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [comparisons, setComparisons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const comparisonCacheRef = useRef(null);

  useEffect(() => {
    mlService.getMetrics().then(setMetrics).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleLoadComparison = async () => {
    // Use cached comparison data if available
    if (comparisonCacheRef.current) {
      setComparisons(comparisonCacheRef.current);
      setShowComparison(true);
      return;
    }

    setComparisonLoading(true);
    try {
      const data = await mlService.compareClassifiers();
      comparisonCacheRef.current = data.comparisons;
      setComparisons(data.comparisons);
      setShowComparison(true);
    } catch (err) {
      console.error('Failed to load comparisons:', err);
    } finally {
      setComparisonLoading(false);
    }
  };

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

  // Build comparison chart data
  const comparisonChartData = comparisons ? [
    {
      metric: 'Accuracy',
      knn: (comparisons.knn?.accuracy || 0) * 100,
      naive_bayes: (comparisons.naive_bayes?.accuracy || 0) * 100,
      svm: (comparisons.svm?.accuracy || 0) * 100,
    },
    {
      metric: 'Precision',
      knn: (comparisons.knn?.precision || 0) * 100,
      naive_bayes: (comparisons.naive_bayes?.precision || 0) * 100,
      svm: (comparisons.svm?.precision || 0) * 100,
    },
    {
      metric: 'Recall',
      knn: (comparisons.knn?.recall || 0) * 100,
      naive_bayes: (comparisons.naive_bayes?.recall || 0) * 100,
      svm: (comparisons.svm?.recall || 0) * 100,
    },
    {
      metric: 'F1 Score',
      knn: (comparisons.knn?.f1_score || 0) * 100,
      naive_bayes: (comparisons.naive_bayes?.f1_score || 0) * 100,
      svm: (comparisons.svm?.f1_score || 0) * 100,
    },
  ] : [];

  // Find best classifier
  const findBestClassifier = () => {
    if (!comparisons) return null;
    const classifiers = Object.entries(comparisons)
      .filter(([_, data]) => !data.error && data.accuracy)
      .sort(([_, a], [__, b]) => (b.accuracy || 0) - (a.accuracy || 0));
    return classifiers[0] ? classifiers[0][0] : null;
  };

  const bestClassifier = findBestClassifier();
  const [[tn, fp], [fn, tp]] = metrics.confusion_matrix;
  const classifierLabel = formatClassifierLabel(metrics.classifier || localStorage.getItem('selectedClassifier'));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Activity style={{ width: 22, height: 22, color: 'var(--clr-green)' }} />
        <div>
          <h1 className="font-military text-glow-green" style={{ fontSize: 24, color: 'var(--clr-green)', marginBottom: 2 }}>ML ANALYTICS TERMINAL</h1>
          <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>{classifierLabel} PERFORMANCE INTELLIGENCE — LIVE</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="status-dot" />
          <span className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>{classifierLabel} ACTIVE</span>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Line Chart - Performance Metrics */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 }} className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Radio style={{ width: 14, height: 14, color: 'var(--clr-green)' }} />
            <span className="font-military" style={{ fontSize: 13, color: 'var(--clr-green)' }}>PERFORMANCE METRICS</span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,255,136,.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(0,255,136,.3)" tick={{ fill: '#4a9a6a', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                <YAxis domain={[0, 100]} stroke="rgba(0,255,136,.3)" tick={{ fill: '#4a9a6a', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,255,136,.2)', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="value" stroke="var(--clr-cyan)" strokeWidth={3} dot={{ fill: 'var(--clr-cyan)', r: 5 }} activeDot={{ r: 7 }} isAnimationActive={true} />
              </LineChart>
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

      {/* Classifier Comparison Section */}
      {!showComparison && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLoadComparison}
          disabled={comparisonLoading}
          className="btn-mil btn-mil-cyan"
          style={{ width: '100%', padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}
        >
          {comparisonLoading
            ? <>
              <TrendingUp style={{ width: 14, height: 14, animation: 'radar-sweep .8s linear infinite' }} /> ANALYZING ALL CLASSIFIERS…
            </>
            : <>
              <BarChart3 style={{ width: 14, height: 14 }} /> COMPARE ALL CLASSIFIERS
            </>
          }
        </motion.button>
      )}

      {showComparison && comparisons && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginTop: 28 }}>
          {/* Comparison Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BarChart3 style={{ width: 18, height: 18, color: 'var(--clr-cyan)' }} />
              <div>
                <h2 className="font-military text-glow-cyan" style={{ fontSize: 18, color: 'var(--clr-cyan)', marginBottom: 2 }}>CLASSIFIER COMPARISON MATRIX</h2>
                <div className="font-terminal" style={{ fontSize: 9, color: 'var(--clr-text-dim)' }}>PERFORMANCE ANALYSIS OF ALL 3 ALGORITHMS</div>
              </div>
            </div>
            <button
              onClick={() => setShowComparison(false)}
              className="btn-mil"
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              HIDE
            </button>
          </div>

          {/* Comparison Bar Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp style={{ width: 14, height: 14, color: 'var(--clr-cyan)' }} />
              <span className="font-military" style={{ fontSize: 13, color: 'var(--clr-cyan)' }}>METRIC COMPARISON</span>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid stroke="rgba(0,255,136,.1)" vertical={false} />
                  <XAxis dataKey="metric" stroke="rgba(0,255,136,.3)" tick={{ fill: '#4a9a6a', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                  <YAxis domain={[0, 100]} stroke="rgba(0,255,136,.3)" tick={{ fill: '#4a9a6a', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,255,136,.04)' }} />
                  <Legend wrapperStyle={{ paddingTop: 20, color: '#4a9a6a', fontFamily: 'Share Tech Mono', fontSize: 11 }} />
                  <Bar dataKey="knn" fill="#00ff88" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="naive_bayes" fill="#00d4ff" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="svm" fill="#ffd700" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Detailed Metrics Table */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Zap style={{ width: 14, height: 14, color: 'var(--clr-green)' }} />
              <span className="font-military" style={{ fontSize: 13, color: 'var(--clr-green)' }}>DETAILED METRICS TABLE</span>
              {bestClassifier && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--clr-cyan)' }} className="font-terminal">
                  BEST: {formatClassifierLabel(bestClassifier)}
                </span>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="font-terminal" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <th style={{ textAlign: 'left', padding: '10px', color: 'var(--clr-text-dim)' }}>CLASSIFIER</th>
                    <th style={{ textAlign: 'center', padding: '10px', color: 'var(--clr-text-dim)' }}>ACCURACY</th>
                    <th style={{ textAlign: 'center', padding: '10px', color: 'var(--clr-text-dim)' }}>PRECISION</th>
                    <th style={{ textAlign: 'center', padding: '10px', color: 'var(--clr-text-dim)' }}>RECALL</th>
                    <th style={{ textAlign: 'center', padding: '10px', color: 'var(--clr-text-dim)' }}>F1 SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(comparisons).map(([name, data]) => {
                    if (data.error) return null;
                    const isBest = name === bestClassifier;
                    const color = isBest ? 'var(--clr-green)' : 'var(--clr-text)';
                    return (
                      <tr key={name} style={{ borderBottom: '1px solid var(--clr-border)', background: isBest ? 'rgba(0,255,136,0.05)' : 'transparent' }}>
                        <td style={{ padding: '10px', color, fontWeight: isBest ? 'bold' : 'normal' }}>
                          {formatClassifierLabel(name)}
                          {isBest && <span style={{ marginLeft: 8, color: 'var(--clr-green)' }}>★</span>}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', color }}>{(data.accuracy * 100).toFixed(2)}%</td>
                        <td style={{ textAlign: 'center', padding: '10px', color }}>{(data.precision * 100).toFixed(2)}%</td>
                        <td style={{ textAlign: 'center', padding: '10px', color }}>{(data.recall * 100).toFixed(2)}%</td>
                        <td style={{ textAlign: 'center', padding: '10px', color }}>{(data.f1_score * 100).toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {bestClassifier && (
              <div className="glass-panel glow-green" style={{ marginTop: 16, padding: '12px 16px', borderRadius: 4 }}>
                <div className="font-military" style={{ color: 'var(--clr-green)', fontSize: 12, marginBottom: 6 }}>
                  ✓ RECOMMENDATION
                </div>
                <p className="font-terminal" style={{ fontSize: 10, color: 'rgba(160,255,200,.8)', lineHeight: 1.6 }}>
                  {formatClassifierLabel(bestClassifier)} achieved the highest overall accuracy. Consider switching to this classifier in the Config panel for optimal operational performance.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default MLDashboard;
