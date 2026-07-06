// Frequency band extraction and sound profile classification from audio data

// Extract energy across 6 frequency bands from AnalyserNode byte frequency data
export function getFrequencyBands(freqData, sampleRate) {
  const nyquist = sampleRate / 2;
  const binCount = freqData.length;
  const binWidth = nyquist / binCount;

  const bandEnergy = (lo, hi) => {
    const loBin = Math.floor(lo / binWidth);
    const hiBin = Math.min(binCount - 1, Math.ceil(hi / binWidth));
    let sum = 0, count = 0;
    for (let i = loBin; i <= hiBin; i++) {
      sum += freqData[i];
      count++;
    }
    return count > 0 ? sum / count : 0;
  };

  return {
    subBass: bandEnergy(20, 60),
    bass: bandEnergy(60, 250),
    lowMid: bandEnergy(250, 500),
    mid: bandEnergy(500, 2000),
    highMid: bandEnergy(2000, 4000),
    treble: bandEnergy(4000, 16000),
  };
}

// Classify sound profile from averaged frequency band energies
export function classifyFromFrequency(bands) {
  const total = Object.values(bands).reduce((a, b) => a + b, 0) || 1;
  const lowEnergy = (bands.subBass + bands.bass) / total;
  const midEnergy = (bands.lowMid + bands.mid) / total;
  const highEnergy = (bands.highMid + bands.treble) / total;

  if (lowEnergy > 0.4 && highEnergy < 0.2) return "Thocky";
  if (highEnergy > 0.35) return "Clacky";
  if (highEnergy > 0.22 && midEnergy > 0.35) return "Marbly";
  if (lowEnergy > 0.3 && midEnergy > 0.35 && highEnergy < 0.22) return "Creamy";
  return "Neutral";
}

// Spectral centroid — perceived brightness of the sound (higher = brighter)
export function spectralCentroid(bands) {
  const freqs = { subBass: 40, bass: 155, lowMid: 375, mid: 1250, highMid: 3000, treble: 10000 };
  let weighted = 0, total = 0;
  for (const [key, freq] of Object.entries(freqs)) {
    weighted += freq * bands[key];
    total += bands[key];
  }
  return total > 0 ? Math.round(weighted / total) : 0;
}

// Find the dominant frequency band name
export function dominantBand(bands) {
  let max = 0, name = "mid";
  for (const [k, v] of Object.entries(bands)) {
    if (v > max) { max = v; name = k; }
  }
  const labels = {
    subBass: "Sub-Bass (20–60 Hz)",
    bass: "Bass (60–250 Hz)",
    lowMid: "Low-Mid (250–500 Hz)",
    mid: "Mid (500–2k Hz)",
    highMid: "High-Mid (2–4k Hz)",
    treble: "Treble (4–16k Hz)",
  };
  return labels[name] || name;
}