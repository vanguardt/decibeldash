// Analyzes an audio file's loudness profile using the Web Audio API.
// Mirrors the dB calibration used in the live meter so uploaded
// recordings compare on the same scale as recorded ones.

const round1 = (n) => Math.round(n * 10) / 10;

export async function analyzeAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  let audioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    ctx.close().catch(() => {});
  }

  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  const windowSize = Math.max(1, Math.floor(sampleRate * 0.02)); // 20ms windows
  const dbs = [];
  let sumDb = 0;
  let peak = 0;
  let min = Infinity;

  for (let i = 0; i + windowSize <= channel.length; i += windowSize) {
    let sumSq = 0;
    for (let j = 0; j < windowSize; j++) {
      const s = channel[i + j];
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / windowSize);
    let db = 20 * Math.log10(rms + 1e-7);
    db = Math.max(0, db + 90);
    db = (db / 90) * 70 + 15;
    db = Math.max(0, Math.min(120, db));

    if (db > 5 && db < min) min = db;
    if (db > peak) peak = db;
    sumDb += db;
    dbs.push(db);
  }

  const avg = dbs.length ? sumDb / dbs.length : 0;

  // Downsample to ~120 points for the waveform chart
  const stride = Math.max(1, Math.floor(dbs.length / 120));
  const samples = [];
  for (let i = 0; i < dbs.length; i += stride) {
    samples.push({
      t: Math.round((i * windowSize / sampleRate) * 1000),
      db: +dbs[i].toFixed(2),
    });
  }

  return {
    avg_decibels: round1(avg),
    peak_decibels: round1(peak),
    min_decibels: min === Infinity ? 0 : round1(min),
    duration_seconds: Math.round(duration),
    decibel_samples: JSON.stringify(samples),
  };
}