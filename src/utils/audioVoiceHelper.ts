// Generates a real playable WAV Audio Blob URL for fallback or instant preview
export function createSyntheticVoiceBlobUrl(durationSeconds: number = 3): string {
  const sampleRate = 22050;
  const numChannels = 1;
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format chunk length
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true); // 16 bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate pleasant human-vocal formant-like waveform
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Harmonic voice-like simulation (fundamental frequency around 140Hz with vibrato & overtones)
    const f0 = 135 + Math.sin(t * 5) * 6;
    const s1 = Math.sin(2 * Math.PI * f0 * t) * 0.4;
    const s2 = Math.sin(2 * Math.PI * f0 * 2 * t) * 0.25;
    const s3 = Math.sin(2 * Math.PI * f0 * 3 * t) * 0.15;
    const env = Math.min(1, t * 8) * Math.min(1, (durationSeconds - t) * 6);
    const sample = Math.max(-1, Math.min(1, (s1 + s2 + s3) * env));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
