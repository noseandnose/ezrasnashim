// Sound utility functions for the app

let audioContext: AudioContext | null = null;
let coinClinkBuffer: AudioBuffer | null = null;

// Initialize audio context
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Generate a synthetic coin clink sound using Web Audio API
const generateCoinClinkSound = () => {
  const context = initAudioContext();
  const duration = 0.5; // 500ms
  const sampleRate = context.sampleRate;
  const frameCount = sampleRate * duration;
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Create a metallic "clink" sound by combining multiple frequencies
  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate;
    
    // Primary metallic frequency around 2000Hz
    const primary = Math.sin(2 * Math.PI * 2000 * t) * 0.3;
    
    // Higher harmonic for brightness
    const harmonic1 = Math.sin(2 * Math.PI * 4000 * t) * 0.2;
    
    // Lower frequency for body
    const harmonic2 = Math.sin(2 * Math.PI * 800 * t) * 0.15;
    
    // Sharp attack, quick decay envelope
    const envelope = Math.exp(-t * 8) * (1 - Math.exp(-t * 50));
    
    // Add some noise for metallic texture
    const noise = (Math.random() - 0.5) * 0.05;
    
    channelData[i] = (primary + harmonic1 + harmonic2 + noise) * envelope;
  }

  return buffer;
};

// Play coin clink sound
export const playCoinClinkSound = async () => {
  try {
    const context = initAudioContext();
    
    // Resume context if it's suspended (required for user interaction)
    if (context.state === 'suspended') {
      await context.resume();
    }

    // Generate the sound if we don't have it cached
    if (!coinClinkBuffer) {
      coinClinkBuffer = generateCoinClinkSound();
    }

    // Create and play the sound
    const source = context.createBufferSource();
    const gainNode = context.createGain();
    
    source.buffer = coinClinkBuffer;
    source.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Set volume (0.0 to 1.0)
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    
    source.start();
  } catch (error) {
    // Audio playback failed
  }
};

// Alternative method using HTML5 Audio (for actual audio files)
export const playCoinClinkSoundFromFile = () => {
  try {
    const audio = new Audio('/sounds/coin-jingle.mp3');
    audio.volume = 0.3;
    audio.play().catch(error => {
      // Audio file playback failed
    });
  } catch (error) {
    // Audio element creation failed
  }
};

// Main function that tries file first, falls back to generated sound
export const playCoinSound = () => {
  // Try to play from file first
  try {
    const audio = new Audio('/sounds/coin-jingle.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // If file doesn't exist or fails, use generated sound
      playCoinClinkSound();
    });
  } catch {
    // Fallback to generated sound
    playCoinClinkSound();
  }
};