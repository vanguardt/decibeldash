import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Activity, Loader2, Waves } from "lucide-react";
import { getFrequencyBands, classifyFromFrequency, spectralCentroid, dominantBand } from "@/lib/frequencyAnalysis";

const BAR_COUNT = 40;

export default function FrequencySpectrum({ audioUrl }) {
  const [state, setState] = useState("idle"); // idle | loading | playing | done
  const [bars, setBars] = useState(new Array(BAR_COUNT).fill(0));
  const [result, setResult] = useState(null);

  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);
  const accRef = useRef(null);
  const srRef = useRef(0);
  const playingRef = useRef(false);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} }
    if (ctxRef.current) ctxRef.current.close().catch(() => {});
    setState("done");
  }, []);

  useEffect(() => () => stop(), [stop]);

  const loop = () => {
    const analyser = analyserRef.current;
    if (!analyser || !playingRef.current) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    // Downsample to BAR_COUNT bars
    const step = Math.floor(data.length / BAR_COUNT) || 1;
    const newBars = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      newBars.push(data[i * step] || 0);
    }
    setBars(newBars);

    // Accumulate band energies
    const bandData = getFrequencyBands(data, srRef.current);
    if (!accRef.current) accRef.current = { _count: 0 };
    for (const [k, v] of Object.entries(bandData)) {
      accRef.current[k] = (accRef.current[k] || 0) + v;
    }
    accRef.current._count++;

    rafRef.current = requestAnimationFrame(loop);
  };

  const handleToggle = async () => {
    if (state === "playing") { stop(); return; }
    if (state === "done") {
      // Reset for replay
      setResult(null);
      setState("idle");
    }

    setState("loading");
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;

      const res = await fetch(audioUrl);
      const buf = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(buf);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;
      analyserRef.current = analyser;
      srRef.current = ctx.sampleRate;
      accRef.current = null;

      source.onended = () => {
        if (!playingRef.current) return;
        const acc = accRef.current;
        if (acc && acc._count > 0) {
          const avgBands = {};
          for (const [k, v] of Object.entries(acc)) {
            if (k !== "_count") avgBands[k] = v / acc._count;
          }
          setResult({
            bands: avgBands,
            profile: classifyFromFrequency(avgBands),
            brightness: spectralCentroid(avgBands),
            dominant: dominantBand(avgBands),
          });
        }
        stop();
      };

      source.start();
      playingRef.current = true;
      setState("playing");
      loop();
    } catch {
      setState("idle");
    }
  };

  const PROFILE_STYLES = {
    Thocky: "bg-purple-500/15 text-purple-400",
    Clacky: "bg-orange-500/15 text-orange-400",
    Marbly: "bg-sky-500/15 text-sky-400",
    Creamy: "bg-pink-500/15 text-pink-400",
    Neutral: "bg-muted text-muted-foreground",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">Frequency Analysis</span>
        </div>
        <button
          onClick={handleToggle}
          disabled={state === "loading"}
          className="flex items-center gap-1.5 text-xs font-medium text-primary px-2.5 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors"
        >
          {state === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : state === "playing" ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {state === "loading" ? "Loading" : state === "playing" ? "Stop" : state === "done" ? "Replay" : "Analyze"}
        </button>
      </div>

      {/* Spectrum bars */}
      <div className="flex items-end gap-px h-16 bg-muted/30 rounded-lg p-1.5 mb-2">
        {bars.map((bar, i) => {
          const pct = (bar / 255) * 100;
          const hue = 160 + (i / BAR_COUNT) * 80;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-75"
              style={{
                height: `${Math.max(2, pct)}%`,
                background: state === "playing" ? `hsl(${hue}, 70%, 50%)` : `hsl(${hue}, 30%, 40%)`,
                opacity: state === "playing" || state === "done" ? 1 : 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PROFILE_STYLES[result.profile] || PROFILE_STYLES.Neutral}`}>
              {result.profile}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Brightness: <span className="font-mono font-bold text-foreground">{result.brightness} Hz</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-background border border-border rounded-lg p-2 text-center">
              <p className="text-[9px] uppercase text-muted-foreground">Dominant</p>
              <p className="text-[10px] font-medium mt-0.5">{result.dominant.split(" (")[0]}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-2 text-center">
              <p className="text-[9px] uppercase text-muted-foreground">Low Energy</p>
              <p className="text-sm font-mono font-bold text-purple-400">
                {(((result.bands.subBass + result.bands.bass) / (Object.values(result.bands).reduce((a, b) => a + b, 0) || 1)) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-background border border-border rounded-lg p-2 text-center">
              <p className="text-[9px] uppercase text-muted-foreground">High Energy</p>
              <p className="text-sm font-mono font-bold text-orange-400">
                {(((result.bands.highMid + result.bands.treble) / (Object.values(result.bands).reduce((a, b) => a + b, 0) || 1)) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {["subBass", "bass", "lowMid", "mid", "highMid", "treble"].map((band, i) => {
              const total = Object.values(result.bands).reduce((a, b) => a + b, 0) || 1;
              const pct = (result.bands[band] / total) * 100;
              const hues = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f97316", "#fbbf24"];
              return (
                <div
                  key={band}
                  style={{ width: `${pct}%`, background: hues[i] }}
                  className="h-full"
                  title={band}
                />
              );
            })}
          </div>
        </div>
      )}

      {state === "idle" && !result && (
        <p className="text-[10px] text-muted-foreground">
          Press Analyze to decode the audio and extract its frequency profile.
        </p>
      )}
    </div>
  );
}