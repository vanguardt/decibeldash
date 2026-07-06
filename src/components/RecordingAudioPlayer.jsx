import React, { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

export default function RecordingAudioPlayer({ url, onPlay }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else { audio.play().catch(() => {}); onPlay?.(); }
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration) setProgress(a.currentTime / a.duration);
        }}
        preload="metadata"
      />
    </div>
  );
}