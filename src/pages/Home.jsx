import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Square, Save, Volume2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import DecibelGauge from "@/components/DecibelGauge";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import TypingTest from "@/components/TypingTest";

export default function Home() {
  const { toast } = useToast();
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
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const samplesRef = useRef([]);
  const peakRef = useRef(0);
  const minRef = useRef(Infinity);

  const calculateDecibels = useCallback((analyser) => {
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sumSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);

    // Convert to decibels, calibrated for keyboard-level sounds
    // Adding offset to better represent ambient/keyboard noise levels
    let db = 20 * Math.log10(rms + 0.0000001);
    // Map the -90 to 0 range into roughly 20-80 dB SPL range for keyboard sounds
    db = Math.max(0, db + 90);
    // Scale to more realistic dB SPL approximation
    db = (db / 90) * 70 + 15;

    return Math.max(0, Math.min(120, db));
  }, []);

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
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setPermissionDenied(false);

      // Timer
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Metering loop
      const meter = () => {
        const db = calculateDecibels(analyser);
        setCurrentDb(db);

        if (db > peakRef.current) {
          peakRef.current = db;
          setPeakDb(db);
        }
        if (db < minRef.current && db > 5) {
          minRef.current = db;
          setMinDb(db);
        }

        // Sample every 200ms
        const now = Date.now();
        const lastSample = samplesRef.current[samplesRef.current.length - 1];
        if (!lastSample || now - lastSample.t > 200) {
          samplesRef.current.push({ t: now - startTimeRef.current, db });
        }

        animFrameRef.current = requestAnimationFrame(meter);
      };

      meter();
    } catch (err) {
      setPermissionDenied(true);
      toast({
        title: "Microphone access needed",
        description: "Please allow microphone access to measure sound levels.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setSamples([...samplesRef.current]);
    setIsRecording(false);
    setShowSaveForm(true);
    // Auto-fill name from WPM context
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
  };

  const saveRecording = async () => {
    if (!saveName.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }

    const avgDb = samplesRef.current.length > 0
      ? samplesRef.current.reduce((s, sample) => s + sample.db, 0) / samplesRef.current.length
      : currentDb;

    // Optimistically close the form and show success immediately
    resetRecording();
    toast({ title: "Recording saved!" });

    try {
      await base44.entities.SoundRecording.create({
        name: saveName.trim(),
        avg_decibels: Math.round(avgDb * 10) / 10,
        peak_decibels: Math.round(peakRef.current * 10) / 10,
        min_decibels: minRef.current === Infinity ? 0 : Math.round(minRef.current * 10) / 10,
        duration_seconds: elapsedTime,
        notes: saveNotes.trim() || undefined,
        category: saveCategory,
        decibel_samples: JSON.stringify(samplesRef.current.slice(0, 500)),
        wpm: wpm > 0 ? wpm : undefined,
        accuracy: wpm > 0 ? Math.round(accuracy * 10) / 10 : undefined,
        total_words: wpm > 0 ? Math.round((elapsedTime / 60) * wpm) : undefined,
      });
    } catch (err) {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
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
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Sound Meter</h1>
        <p className="text-xs text-muted-foreground">Measure & compare keyboard noise levels</p>
      </div>

      {/* Gauge */}
      <DecibelGauge value={currentDb} peak={peakDb} isRecording={isRecording} />

      {/* Timer */}
      {(isRecording || elapsedTime > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-2xl font-mono text-muted-foreground"
        >
          {formatTime(elapsedTime)}
        </motion.div>
      )}

      {/* Waveform */}
      <div className="w-full mt-6">
        <WaveformVisualizer analyser={analyserNode} isRecording={isRecording} />
      </div>

      {/* Typing test */}
      {(isRecording || showSaveForm) && (
        <div className="w-full mt-4">
          <TypingTest
            isRecording={isRecording}
            onWpmUpdate={(newWpm, acc) => {
              setWpm(newWpm);
              setAccuracy(acc);
            }}
          />
        </div>
      )}

      {/* Stats row */}
      {(isRecording || peakDb > 0) && (
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

            <Input
              placeholder="Keyboard name (e.g. Cherry MX Blue)"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="bg-background"
            />

            <Select value={saveCategory} onValueChange={setSaveCategory}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="membrane">Membrane</SelectItem>
                <SelectItem value="scissor">Scissor</SelectItem>
                <SelectItem value="optical">Optical</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}