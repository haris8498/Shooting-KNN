import { useRef, useState, useCallback } from 'react';

const useSound = () => {
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const mutedRef = useRef(false);
  const volRef = useRef(0.5);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.gain.value = 0.5;
      masterGainRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playRadarPing = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(masterGainRef.current);
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  }, [getCtx]);

  const playMissileFire = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    // noise burst
    const bufSize = ctx.sampleRate * 0.3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 0.5;
    const gain = ctx.createGain();
    src.connect(filter); filter.connect(gain); gain.connect(masterGainRef.current);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    src.start(); src.stop(ctx.currentTime + 0.3);

    // pitch sweep
    const osc = ctx.createOscillator(); const og = ctx.createGain();
    osc.connect(og); og.connect(masterGainRef.current);
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
    og.gain.setValueAtTime(0.2, ctx.currentTime);
    og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  }, [getCtx]);

  const playExplosion = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const bufSize = ctx.sampleRate * 0.8;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400;
    const gain = ctx.createGain();
    src.connect(filter); filter.connect(gain); gain.connect(masterGainRef.current);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    src.start(); src.stop(ctx.currentTime + 0.8);
  }, [getCtx]);

  const playEnemyAlert = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    [0, 0.15, 0.3].forEach(offset => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(masterGainRef.current);
      osc.type = 'square'; osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.1);
      osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.12);
    });
  }, [getCtx]);

  const playLock = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(masterGainRef.current);
    osc.type = 'sine'; osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  }, [getCtx]);

  const playClick = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(masterGainRef.current);
    osc.type = 'sine'; osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  }, [getCtx]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = mutedRef.current ? 0 : volRef.current;
    }
  }, []);

  const setVolume = useCallback((v) => {
    volRef.current = v;
    setVolumeState(v);
    if (masterGainRef.current && !mutedRef.current) {
      masterGainRef.current.gain.value = v;
    }
  }, []);

  return { playRadarPing, playMissileFire, playExplosion, playEnemyAlert, playLock, playClick, toggleMute, muted, volume, setVolume };
};

export default useSound;
