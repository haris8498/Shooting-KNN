import React, { useState } from 'react';
import { mlService } from '../services/api';
import { Settings, RefreshCw, Info, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const FieldBlock = ({ label, hint, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', letterSpacing: '0.15em', marginBottom: 10 }}>{label}</div>
    {children}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8 }}>
      <Info style={{ width: 11, height: 11, color: 'var(--clr-text-dim)', flexShrink: 0, marginTop: 1 }} />
      <p className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)', lineHeight: 1.65 }}>{hint}</p>
    </div>
  </div>
);

const ModelConfig = () => {
  const [classifier, setClassifier] = useState(() => localStorage.getItem('selectedClassifier') || 'knn');
  const [k, setK]           = useState(5);
  const [testSize, setTestSize] = useState(0.2);
  const [metric, setMetric] = useState('euclidean');
  const [svmKernel, setSvmKernel] = useState('rbf');
  const [svmC, setSvmC] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleClassifierChange = (e) => {
    const selected = e.target.value;
    setClassifier(selected);
    localStorage.setItem('selectedClassifier', selected);
  };

  const handleTrain = async () => {
    setLoading(true); setResult(null);
    try {
      const trainParams = {
        classifier,
        test_size: testSize,
        ...(classifier === 'knn' && { k, metric }),
        ...(classifier === 'svm' && { svm_kernel: svmKernel, svm_C: svmC })
      };
      const res = await mlService.train(trainParams);
      setResult({ success: true, data: res });
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Settings style={{ width: 22, height: 22, color: 'var(--clr-cyan)' }} />
        <div>
          <h1 className="font-military" style={{ fontSize: 24, color: 'var(--clr-cyan)', textShadow: '0 0 12px rgba(0,212,255,.7)', marginBottom: 2 }}>TACTICAL AI CALIBRATION</h1>
          <div className="font-terminal" style={{ fontSize: 10, color: 'var(--clr-text-dim)' }}>CLASSIFIER SELECTION & MODEL PARAMETER CONFIGURATION</div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }} className="glass-panel hud-corners" style={{ padding: 32 }}>

        {/* Classifier Selection */}
        <FieldBlock
          label="▸ SELECT CLASSIFIER ALGORITHM"
          hint="Choose between K-Nearest Neighbors (fast, instance-based), Naive Bayes (probabilistic), or Support Vector Machine (powerful, margin-based). Each has different performance characteristics."
        >
          <div style={{ position: 'relative' }}>
            <select value={classifier} onChange={handleClassifierChange} className="select-mil">
              <option value="knn">K-NEAREST NEIGHBORS (KNN) — FAST &amp; INTUITIVE</option>
              <option value="naive_bayes">NAIVE BAYES — PROBABILISTIC &amp; LIGHTWEIGHT</option>
              <option value="svm">SUPPORT VECTOR MACHINE (SVM) — POWERFUL &amp; ROBUST</option>
            </select>
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--clr-green)', fontSize: 10 }}>▼</div>
          </div>
        </FieldBlock>

        <div style={{ borderTop: '1px solid var(--clr-border)', margin: '0 0 24px' }} />

        {/* K slider - KNN only */}
        {classifier === 'knn' && (
          <>
            <FieldBlock
              label="▸ NUMBER OF NEIGHBORS (K)"
              hint="K determines how many nearby training samples vote on the classification. Odd numbers prevent ties. Low K = sensitive, High K = smoother."
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <input type="range" min="1" max="15" step="2" value={k} onChange={e => setK(parseInt(e.target.value))} className="mil-slider" style={{ flex: 1 }} />
                <div className="glass-panel" style={{ padding: '8px 16px', minWidth: 52, textAlign: 'center' }}>
                  <span className="font-military text-glow-green" style={{ fontSize: 22, color: 'var(--clr-green)' }}>{k}</span>
                </div>
              </div>
              {/* K tick marks */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 2px' }}>
                {[1, 3, 5, 7, 9, 11, 13, 15].map(v => (
                  <span key={v} className="font-terminal" style={{ fontSize: 8, color: v === k ? 'var(--clr-green)' : 'rgba(74,154,106,.4)' }}>{v}</span>
                ))}
              </div>
            </FieldBlock>

            <div style={{ borderTop: '1px solid var(--clr-border)', margin: '0 0 24px' }} />

            {/* Distance metric - KNN only */}
            <FieldBlock
              label="▸ DISTANCE METRIC"
              hint="Mathematical formula to measure feature vector distance. StandardScaler is applied — large numerical ranges (e.g. Altitude) won't dominate."
            >
              <div style={{ position: 'relative' }}>
                <select value={metric} onChange={e => setMetric(e.target.value)} className="select-mil">
                  <option value="euclidean">EUCLIDEAN — STRAIGHT-LINE DISTANCE</option>
                  <option value="manhattan">MANHATTAN — CITY-BLOCK DISTANCE</option>
                </select>
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--clr-green)', fontSize: 10 }}>▼</div>
              </div>
            </FieldBlock>

            <div style={{ borderTop: '1px solid var(--clr-border)', margin: '0 0 24px' }} />
          </>
        )}

        {/* SVM Parameters */}
        {classifier === 'svm' && (
          <>
            <FieldBlock
              label="▸ SVM KERNEL FUNCTION"
              hint="Kernel determines how SVM transforms the data. RBF works well for most non-linear problems, Linear for linearly separable data."
            >
              <div style={{ position: 'relative' }}>
                <select value={svmKernel} onChange={e => setSvmKernel(e.target.value)} className="select-mil">
                  <option value="linear">LINEAR — SIMPLE, FAST</option>
                  <option value="rbf">RBF (RADIAL BASIS FUNCTION) — DEFAULT, HANDLES NON-LINEAR</option>
                  <option value="poly">POLYNOMIAL — MODERATE FLEXIBILITY</option>
                </select>
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--clr-green)', fontSize: 10 }}>▼</div>
              </div>
            </FieldBlock>

            <div style={{ borderTop: '1px solid var(--clr-border)', margin: '0 0 24px' }} />

            <FieldBlock
              label="▸ SVM REGULARIZATION (C)"
              hint="Controls trade-off between margin size and classification accuracy. Higher C = stricter fit on training data, lower C = simpler decision boundary."
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <input type="range" min="0.1" max="10" step="0.1" value={svmC} onChange={e => setSvmC(parseFloat(e.target.value))} className="mil-slider" style={{ flex: 1 }} />
                <div className="glass-panel" style={{ padding: '8px 16px', minWidth: 52, textAlign: 'center' }}>
                  <span className="font-military text-glow-green" style={{ fontSize: 18, color: 'var(--clr-green)' }}>{svmC.toFixed(1)}</span>
                </div>
              </div>
            </FieldBlock>

            <div style={{ borderTop: '1px solid var(--clr-border)', margin: '0 0 24px' }} />
          </>
        )}

        {/* Train/test split */}
        <FieldBlock
          label="▸ TRAIN / TEST SPLIT RATIO"
          hint="Defines how much data trains the model vs how much evaluates accuracy. Default 80/20 is a safe standard."
        >
          <div style={{ position: 'relative' }}>
            <select value={testSize} onChange={e => setTestSize(parseFloat(e.target.value))} className="select-mil">
              <option value={0.1}>90% TRAIN / 10% TEST — MAX TRAINING</option>
              <option value={0.2}>80% TRAIN / 20% TEST — BALANCED (DEFAULT)</option>
              <option value={0.3}>70% TRAIN / 30% TEST — LARGER TEST SET</option>
            </select>
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--clr-green)', fontSize: 10 }}>▼</div>
          </div>
        </FieldBlock>

        <div style={{ borderTop: '1px solid var(--clr-border)', margin: '0 0 24px' }} />

        {/* Retrain button */}
        <button onClick={handleTrain} disabled={loading} className="btn-mil btn-mil-cyan"
          style={{ width: '100%', padding: '14px 0', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 4 }}>
          {loading
            ? <><RefreshCw style={{ width: 16, height: 16, animation: 'radar-sweep .8s linear infinite' }} /> RETRAINING MODEL…</>
            : <><Zap style={{ width: 16, height: 16 }} /> APPLY &amp; RETRAIN MODEL</>
          }
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={result.success ? 'glass-panel glow-green' : 'glass-panel-red glow-red'}
            style={{ marginTop: 16, padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>{result.success ? '✓' : '✗'}</span>
            <span className="font-terminal" style={{ fontSize: 12, color: result.success ? 'var(--clr-green)' : 'var(--clr-red)' }}>
              {result.success
                ? `RETRAIN COMPLETE — NEW ACCURACY: ${(result.data.metrics.accuracy * 100).toFixed(2)}%`
                : `ERROR: ${result.error}`}
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ModelConfig;
