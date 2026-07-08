import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Square, Save, Volume2, RotateCcw, Keyboard, Waves, Boxes, Grid3x3 } from "lucide-react";
import { useUserBehavior } from "@/hooks/useUserBehavior";
import SmartSuggestions from "@/components/SmartSuggestions";
import AcousticInsights from "@/components/AcousticInsights";
import AcousticProfileSummary from "@/components/AcousticProfileSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import MobileSelect from "@/components/ui/mobile-select";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import DecibelGauge from "@/components/DecibelGauge";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import TypingTest from "@/components/TypingTest";
import DecibelScale from "@/components/DecibelScale";
import KeyboardHeatmap from "@/components/KeyboardHeatmap";

export default function Home() {
  const { toast } = useToast();
  const { behavior, streak, suggestions, trackRecording, trackBuild } = useUserBehavior();
  const [isRecording, setIsRecording] = useState(false);
  const [currentDb, setCurrentDb] = useState(0);
  const [peakDb, setPeakDb] = useState(0);
  const [minDb, setMinDb] = useState(Infinity);
  const [samples, setSamples] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [analyserNode, setAnalyserNode] = useState(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [saveCategory, setSaveCategory] = useState("other");
  const [isSaving, setIsSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [meteringStarted, setMeteringStarted] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [soundOnly, setSoundOnly] = useState(false);
  const soundOnlyRef = useRef(false);
  const [saveSwitchType, setSaveSwitchType] = useState("");
  const [saveKeycapProfile, setSaveKeycapProfile] = useState("");
  const [saveMods, setSaveMods] = useState({
    o_rings_single: false,
    o_rings_double: false,
    lubed: false,
    filmed: false,
    tape_mod: false,
  });
  const [saveBuildType, setSaveBuildType] = useState("Custom");

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const samplesRef = useRef([]);
  const peakRef = useRef(0);
  const minRef = useRef(Infinity);
  const meteringStartedRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioUrlRef = useRef(null);
  const pendingUploadRef = useRef(null);
  const currentDbRef = useRef(0);
  const recentPeakRef = useRef(0);
  const keyStatsRef = useRef({});
  const [liveHeatmap, setLiveHeatmap] = useState({});

  const calculateDecibels = useCallback((analyser) => {
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sumSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);

    // Noise gate: ignore ambient background noise below threshold.
    // Only sounds above the gate (actual keypresses) register on the meter.
    const NOISE_GATE = 0.005;
    if (rms < NOISE_GATE) return 35;

    // Calibrated dB SPL mapping for keyboard sounds:
    // ~40 dB: silent switches · ~55 dB: tactile · ~66 dB: clicky · 76+: very loud
    let db = 40 + 20 * Math.log10(rms / NOISE_GATE);

    return Math.max(35, Math.min(95, db));
  }, []);

  const handleKeystroke = useCallback((char) => {
    // Delay sampling so the keypress sound has time to reach the analyser
    setTimeout(() => {
      const db = Math.max(currentDbRef.current, recentPeakRef.current);
      if (db <= 35) return; // ignore if below noise gate
      const stats = keyStatsRef.current[char] || { hits: 0, totalDb: 0, avg_db: 0, peak_db: 0 };
      stats.hits++;
      stats.totalDb += db;
      stats.avg_db = stats.totalDb / stats.hits;
      if (db > stats.peak_db) stats.peak_db = db;
      keyStatsRef.current[char] = stats;
      setLiveHeatmap({ ...keyStatsRef.current });
    }, 100);
  }, []);

  const handleQuickRecord = () => {
    const { lastMode, lastSettings } = behavior;
    if (lastMode) {
      const so = lastMode === "soundOnly";
      setSoundOnly(so);
      soundOnlyRef.current = so;
    }
    if (lastSettings) {
      if (lastSettings.category) setSaveCategory(lastSettings.category);
      if (lastSettings.switchType) setSaveSwitchType(lastSettings.switchType);
      if (lastSettings.keycapProfile) setSaveKeycapProfile(lastSettings.keycapProfile);
      if (lastSettings.mods) setSaveMods(lastSettings.mods);
      if (lastSettings.buildType) setSaveBuildType(lastSettings.buildType);
    }
    startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      streamRef.current = stream;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      // Reset
      setPeakDb(0);
      setMinDb(Infinity);
      setSamples([]);
      samplesRef.current = [];
      peakRef.current = 0;
      minRef.current = Infinity;
      setElapsedTime(0);
      setWpm(0);
      setAccuracy(100);
      setMeteringStarted(false);
      meteringStartedRef.current = false;
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      audioUrlRef.current = null;
      pendingUploadRef.current = null;
      currentDbRef.current = 0;
      keyStatsRef.current = {};
      setIsRecording(true);
      setPermissionDenied(false);
      recentPeakRef.current = 0;
      // In Sound Only mode, metering starts immediately
      if (soundOnlyRef.current) {
        beginMetering();
      }
    } catch (err) {
      setPermissionDenied(true);
      toast({
        title: "Microphone access needed",
        description: "Please allow microphone access to measure sound levels.",
        variant: "destructive",
      });
    }
  };

  // Begins audio metering + timer on the first keystroke
  const beginMetering = () => {
    if (meteringStartedRef.current || !analyserRef.current) return;
    const analyser = analyserRef.current;
    meteringStartedRef.current = true;
    setMeteringStarted(true);
    startTimeRef.current = Date.now();

    // Start audio capture for playback (resolves pendingUploadRef on stop)
    let resolveUpload;
    pendingUploadRef.current = new Promise((resolve) => { resolveUpload = resolve; });
    try {
      const mr = new MediaRecorder(streamRef.current);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        try {
          const mimeType = mr.mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          if (blob.size === 0) { audioUrlRef.current = null; resolveUpload(null); return; }
          const ext = mimeType.includes("mp4") ? "m4a" : "webm";
          const file = new File([blob], `rec-${Date.now()}.${ext}`, { type: mimeType });
          const res = await base44.integrations.Core.UploadFile({ file });
          audioUrlRef.current = res.file_url;
          resolveUpload(res.file_url);
        } catch {
          audioUrlRef.current = null;
          resolveUpload(null);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
    } catch {
      pendingUploadRef.current = Promise.resolve(null);
    }

    // Timer (counts up; displayed as a 30s countdown)
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);

    // Metering loop
    const meter = () => {
      const db = calculateDecibels(analyser);
      setCurrentDb(db);
      currentDbRef.current = db;

      // Track a rolling peak that decays slowly so keystroke events
      // (which fire slightly before the sound reaches the analyser)
      // can still attribute the correct dB to the key pressed.
      recentPeakRef.current = Math.max(db, recentPeakRef.current * 0.92);

      // Only track keyboard sounds above the noise gate
      if (db > 35) {
        if (db > peakRef.current) {
          peakRef.current = db;
          setPeakDb(db);
        }
        if (db < minRef.current) {
          minRef.current = db;
          setMinDb(db);
        }

        // Sample every 200ms
        const now = Date.now();
        const lastSample = samplesRef.current[samplesRef.current.length - 1];
        if (!lastSample || now - lastSample.t > 200) {
          samplesRef.current.push({ t: now - startTimeRef.current, db });
        }
      }

      animFrameRef.current = requestAnimationFrame(meter);
    };

    meter();
  };

  const stopRecording = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }

    const wasMetering = meteringStartedRef.current;
    meteringStartedRef.current = false;
    setMeteringStarted(false);
    setIsRecording(false);

    // No keystroke happened → nothing to save
    if (!wasMetering || samplesRef.current.length === 0) {
      resetRecording();
      return;
    }

    setSamples([...samplesRef.current]);
    setShowSaveForm(true);
    setSaveName(prev => prev || "");
  };

  const resetRecording = () => {
    setCurrentDb(0);
    setPeakDb(0);
    setMinDb(Infinity);
    setSamples([]);
    setElapsedTime(0);
    setWpm(0);
    setAccuracy(100);
    setShowSaveForm(false);
    setSaveName("");
    setSaveNotes("");
    setSaveCategory("other");
    setSaveSwitchType("");
    setSaveKeycapProfile("");
    setSaveMods({
      o_rings_single: false,
      o_rings_double: false,
      lubed: false,
      filmed: false,
      tape_mod: false,
    });
    setSaveBuildType("Custom");
    setMeteringStarted(false);
    meteringStartedRef.current = false;
    keyStatsRef.current = {};
    setLiveHeatmap({});
  };

  const saveRecording = async () => {
    if (!saveName.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }

    const avgDb = samplesRef.current.length > 0
      ? samplesRef.current.reduce((s, sample) => s + sample.db, 0) / samplesRef.current.length
      : currentDb;

    // Capture data before reset clears refs
    const heatmap = { ...keyStatsRef.current };
    const samplesCopy = samplesRef.current.slice(0, 500);
    const peakCopy = peakRef.current;
    const minCopy = minRef.current === Infinity ? 0 : minRef.current;

    // Optimistically close the form and show success immediately
    resetRecording();
    toast({ title: "Recording saved!" });
    trackRecording({
      mode: soundOnly ? "soundOnly" : "typing",
      category: saveCategory,
      switchType: saveSwitchType,
      keycapProfile: saveKeycapProfile,
      mods: saveMods,
      buildType: saveBuildType,
      wpm,
    });

    // Wait for the audio file upload (started when recording stopped)
    let audioUrl = null;
    if (pendingUploadRef.current) {
      try { audioUrl = await pendingUploadRef.current; } catch { audioUrl = null; }
    }

    try {
      await base44.entities.SoundRecording.create({
        name: saveName.trim(),
        avg_decibels: Math.round(avgDb * 10) / 10,
        peak_decibels: Math.round(peakCopy * 10) / 10,
        min_decibels: Math.round(minCopy * 10) / 10,
        duration_seconds: elapsedTime,
        notes: saveNotes.trim() || undefined,
        category: saveCategory,
        switch_type: saveSwitchType.trim() || undefined,
        keycap_profile: saveKeycapProfile || undefined,
        modifications: JSON.stringify(
          Object.entries(saveMods).filter(([, v]) => v).map(([k]) => k)
        ) || undefined,
        decibel_samples: JSON.stringify(samplesCopy),
        wpm: wpm > 0 ? wpm : undefined,
        accuracy: wpm > 0 ? Math.round(accuracy * 10) / 10 : undefined,
        total_words: wpm > 0 ? Math.round((elapsedTime / 60) * wpm) : undefined,
        audio_url: audioUrl || undefined,
        key_heatmap: Object.keys(heatmap).length > 0
          ? JSON.stringify(heatmap)
          : undefined,
      });
    } catch (err) {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const saveAsBuild = async () => {
    if (!saveName.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }

    const avgDb = samplesRef.current.length > 0
      ? samplesRef.current.reduce((s, sample) => s + sample.db, 0) / samplesRef.current.length
      : currentDb;

    const heatmap = { ...keyStatsRef.current };
    const uploadPromise = pendingUploadRef.current;

    resetRecording();
    toast({ title: "Build profile saved!" });
    trackBuild();
    trackRecording({
      mode: soundOnly ? "soundOnly" : "typing",
      category: saveCategory,
      switchType: saveSwitchType,
      keycapProfile: saveKeycapProfile,
      mods: saveMods,
      buildType: saveBuildType,
      wpm,
    });

    let audioUrl = null;
    if (uploadPromise) {
      try { audioUrl = await uploadPromise; } catch { audioUrl = null; }
    }

    try {
      await base44.entities.BuildProfile.create({
        name: saveName.trim(),
        build_type: saveBuildType,
        avg_decibels: Math.round(avgDb * 10) / 10,
        peak_decibels: Math.round(peakRef.current * 10) / 10,
        min_decibels: minRef.current === Infinity ? 0 : Math.round(minRef.current * 10) / 10,
        duration_seconds: elapsedTime,
        notes: saveNotes.trim() || undefined,
        switch_type: saveSwitchType.trim() || undefined,
        keycap_profile: saveKeycapProfile || undefined,
        modifications: JSON.stringify(
          Object.entries(saveMods).filter(([, v]) => v).map(([k]) => k)
        ) || undefined,
        decibel_samples: JSON.stringify(samplesRef.current.slice(0, 500)),
        wpm: wpm > 0 ? wpm : undefined,
        accuracy: wpm > 0 ? Math.round(accuracy * 10) / 10 : undefined,
        audio_url: audioUrl || undefined,
        key_heatmap: Object.keys(heatmap).length > 0
          ? JSON.stringify(heatmap)
          : undefined,
      });
    } catch (err) {
      toast({ title: "Failed to save build", variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Sound Meter</h1>
        <p className="text-xs text-muted-foreground">Measure & compare keyboard noise levels</p>
      </div>

      {/* Gauge — meter is the first thing you see */}
      <DecibelGauge value={currentDb} peak={peakDb} isRecording={meteringStarted} />

      {/* Mode toggle (only when idle) */}
      {!isRecording && !showSaveForm && (
        <div className="flex items-center gap-1 p-1 bg-muted rounded-full mb-4">
          <button
            type="button"
            onClick={() => { setSoundOnly(false); soundOnlyRef.current = false; }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !soundOnly ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" /> Typing + Sound
          </button>
          <button
            type="button"
            onClick={() => { setSoundOnly(true); soundOnlyRef.current = true; }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              soundOnly ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" /> Keys Only
          </button>
        </div>
      )}

      {/* Timer */}
      {isRecording && !meteringStarted && !soundOnly && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          Start typing to begin recording
        </motion.p>
      )}
      {(meteringStarted || elapsedTime > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-4 text-2xl font-mono ${
            !soundOnly && 30 - elapsedTime <= 5 ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {soundOnly
            ? formatTime(elapsedTime)
            : formatTime(Math.max(0, 30 - elapsedTime))}
        </motion.div>
      )}

      {/* Waveform */}
      <div className="w-full mt-6">
        <WaveformVisualizer analyser={analyserNode} isRecording={meteringStarted} />
      </div>

      {/* Live heatmap (above typing test so it's visible while typing) */}
      {!soundOnly && meteringStarted && Object.keys(liveHeatmap).length > 0 && (
        <div className="w-full mt-4 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Grid3x3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold">Live Key Heatmap</h3>
          </div>
          <KeyboardHeatmap recording={{ key_heatmap: JSON.stringify(liveHeatmap) }} />
        </div>
      )}

      {/* Typing test (hidden in Sound Only mode) */}
      {!soundOnly && (isRecording || showSaveForm) && (
        <div className="w-full mt-4">
          <TypingTest
            isRecording={isRecording}
            onFirstKeystroke={beginMetering}
            onComplete={stopRecording}
            onKeystroke={handleKeystroke}
            onWpmUpdate={(newWpm, acc) => {
              setWpm(newWpm);
              setAccuracy(acc);
            }}
          />
        </div>
      )}

      {/* Stats row */}
      {(meteringStarted || peakDb > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid gap-3 w-full mt-4 ${wpm > 0 ? "grid-cols-4" : "grid-cols-3"}`}
        >
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Min</p>
            <p className="text-lg font-mono font-bold text-blue-400">
              {minDb === Infinity ? "—" : minDb.toFixed(1)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current</p>
            <p className="text-lg font-mono font-bold text-emerald-400">{currentDb.toFixed(1)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Peak</p>
            <p className="text-lg font-mono font-bold text-amber-400">{peakDb.toFixed(1)}</p>
          </div>
          {wpm > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest text-primary/70">WPM</p>
              <p className="text-lg font-mono font-bold text-primary">{wpm}</p>
            </div>
          )}
        </motion.div>
      )}

      {meteringStarted && (
        <div className="w-full mt-3 bg-card border border-border rounded-lg p-4">
          <DecibelScale db={currentDb} />
        </div>
      )}

      {meteringStarted && !soundOnly && Object.keys(liveHeatmap).length > 0 && (
        <div className="w-full mt-3 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Grid3x3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold">Live Key Heatmap</h3>
          </div>
          <KeyboardHeatmap recording={{ key_heatmap: JSON.stringify(liveHeatmap) }} />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mt-8">
        {!isRecording && !showSaveForm && (
          <Button
            size="lg"
            className="rounded-full h-14 w-14 bg-primary hover:bg-primary/90"
            onClick={startRecording}
          >
            <Mic className="w-6 h-6" />
          </Button>
        )}

        {isRecording && (
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full h-14 w-14"
            onClick={stopRecording}
          >
            <Square className="w-5 h-5" />
          </Button>
        )}

        {!isRecording && peakDb > 0 && !showSaveForm && (
          <Button variant="ghost" size="icon" onClick={resetRecording} className="text-muted-foreground">
            <RotateCcw className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Acoustic profile summary — metrics from your recording history */}
      {!isRecording && !showSaveForm && (
        <AcousticProfileSummary wpmHistory={behavior.wpmHistory} />
      )}

      {/* Personalized coaching insights */}
      {!isRecording && !showSaveForm && (
        <AcousticInsights wpmHistory={behavior.wpmHistory} />
      )}

      {/* Smart suggestions — at the bottom */}
      {!isRecording && !showSaveForm && (
        <SmartSuggestions
          suggestions={suggestions}
          streak={streak}
          onQuickRecord={handleQuickRecord}
        />
      )}

      {/* Permission denied */}
      {permissionDenied && (
        <p className="text-xs text-destructive mt-4 text-center">
          Microphone access was denied. Please enable it in your browser settings.
        </p>
      )}

      {/* Save form */}
      <AnimatePresence>
        {showSaveForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full mt-6 bg-card border border-border rounded-xl p-5 space-y-4"
          >
            <h2 className="text-sm font-semibold">Save Recording</h2>

            {samples.length > 0 && (
              <DecibelScale
                db={samples.reduce((s, sm) => s + sm.db, 0) / samples.length}
              />
            )}

            {!soundOnly && Object.keys(liveHeatmap).length > 0 && (
              <div className="bg-background border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Grid3x3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Key Heatmap</span>
                </div>
                <KeyboardHeatmap recording={{ key_heatmap: JSON.stringify(liveHeatmap) }} />
              </div>
            )}

            <Input
              placeholder="Keyboard name (e.g. Cherry MX Blue)"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="bg-background"
            />

            <MobileSelect
              value={saveCategory}
              onValueChange={setSaveCategory}
              placeholder="Select type"
              className="bg-background"
              options={[
                { value: "mechanical", label: "Mechanical" },
                { value: "membrane", label: "Membrane" },
                { value: "scissor", label: "Scissor" },
                { value: "optical", label: "Optical" },
                { value: "other", label: "Other" },
              ]}
            />

            {/* Switch type */}
            <MobileSelect
              value={saveSwitchType}
              onValueChange={setSaveSwitchType}
              placeholder="Switch type"
              className="bg-background"
              options={[
                { value: "Linear", label: "Linear" },
                { value: "Tactile", label: "Tactile" },
                { value: "Clicky", label: "Clicky" },
              ]}
            />

            {/* Keycap profile */}
            <MobileSelect
              value={saveKeycapProfile}
              onValueChange={setSaveKeycapProfile}
              placeholder="Keycap profile"
              className="bg-background"
              options={[
                { value: "Cherry", label: "Cherry" },
                { value: "OEM", label: "OEM" },
                { value: "XVX", label: "XVX" },
                { value: "MT3", label: "MT3" },
                { value: "Other", label: "Other" },
              ]}
            />

            {/* Modifications */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Modifications</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "o_rings_single", label: "O-rings (Single)" },
                  { key: "o_rings_double", label: "O-rings (Double)" },
                  { key: "lubed", label: "Lubed" },
                  { key: "filmed", label: "Filmed" },
                  { key: "tape_mod", label: "Tape Mod" },
                ].map((mod) => (
                  <label
                    key={mod.key}
                    className="flex items-center gap-2 text-xs cursor-pointer rounded-md border border-border px-2.5 py-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={saveMods[mod.key]}
                      onCheckedChange={(v) =>
                        setSaveMods((prev) => ({ ...prev, [mod.key]: !!v }))
                      }
                    />
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Notes (optional)"
              value={saveNotes}
              onChange={(e) => setSaveNotes(e.target.value)}
              rows={2}
              className="bg-background resize-none"
            />

            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveRecording}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={resetRecording}>
                Discard
              </Button>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Build Profile</p>
              <MobileSelect
                value={saveBuildType}
                onValueChange={setSaveBuildType}
                placeholder="Build type"
                className="bg-background mb-2"
                options={[
                  { value: "Silent", label: "Silent Build" },
                  { value: "Gaming", label: "Gaming Build" },
                  { value: "Thock", label: "Thock Build" },
                  { value: "Clack", label: "Clack Build" },
                  { value: "Custom", label: "Custom" },
                ]}
              />
              <Button variant="secondary" className="w-full" onClick={saveAsBuild}>
                <Boxes className="w-4 h-4 mr-2" />
                Save as Build Profile
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}