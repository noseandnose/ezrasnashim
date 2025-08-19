# Sound Files Directory

This directory contains audio files used in the application.

## Required Files

- `coin-clink.mp3` - A short coin clink sound effect played when:
  - Users complete tzedaka donations
  - Users click "Gave Tzedaka Elsewhere"
  - Users interact with donation buttons

## File Requirements

- Format: MP3
- Duration: ~0.5 seconds maximum
- Volume: Should be moderate (the app sets volume to 0.3)
- Quality: Clear but not overpowering

## Fallback Behavior

If the audio file is not present, the app will automatically generate a synthetic coin clink sound using the Web Audio API as a fallback.