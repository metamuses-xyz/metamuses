# Emotion Sound Effects

This directory contains sound effects for the Live2D emotion system.

## Required Sound Files

Place the following sound files in this directory:

### Emotion Sounds (Required)

1. **happy.mp3** - Cheerful, upbeat sound (e.g., chime, bell, positive jingle)
2. **sad.mp3** - Melancholic, soft sound (e.g., descending notes, gentle hum)
3. **angry.mp3** - Sharp, intense sound (e.g., strike, whoosh, strong note)
4. **think.mp3** - Contemplative sound (e.g., hmm, pondering tone, soft bell)
5. **surprise.mp3** - Sudden, bright sound (e.g., pop, sparkle, ascending notes)
6. **awkward.mp3** - Uncertain, quirky sound (e.g., warble, hesitant tone)
7. **question.mp3** - Inquisitive sound (e.g., rising tone, question mark chime)
8. **curious.mp3** - Intrigued sound (e.g., investigative tone, light ding)
9. **idle.mp3** - Neutral, calm sound (e.g., soft ambience, breathing)

## Sound Specifications

- **Format**: MP3 (widely supported)
- **Duration**: 0.3-1.5 seconds (short, non-intrusive)
- **Volume**: Normalized to -6dB to -3dB
- **Sample Rate**: 44.1kHz or 48kHz
- **Bitrate**: 128kbps minimum

## Sound Design Guidelines

### 1. Happy
- Bright, positive tone
- Major key
- Rising pitch
- Examples: Bell chime, sparkle, cheerful beep

### 2. Sad
- Soft, gentle tone
- Minor key
- Descending pitch
- Examples: Soft piano note, gentle wind, low hum

### 3. Angry
- Sharp, intense
- Dissonant or strong
- Quick attack
- Examples: Strike, snap, strong whoosh

### 4. Think
- Thoughtful, contemplative
- Mid-range pitch
- Sustained or gradual
- Examples: Hmm vocalization, soft bell, pondering tone

### 5. Surprise
- Sudden, bright
- Rising pitch
- Quick onset
- Examples: Pop, gasp, ascending chime

### 6. Awkward
- Quirky, uncertain
- Wavering pitch
- Slightly dissonant
- Examples: Warble, hesitant tone, wobble

### 7. Question
- Inquisitive, rising
- Upward inflection
- Light and curious
- Examples: Rising tone, question chime, ding

### 8. Curious
- Intrigued, exploratory
- Gentle and inviting
- Moderate tempo
- Examples: Investigation sound, light bell, discovery tone

### 9. Idle
- Calm, neutral
- Ambient or subtle
- Non-distracting
- Examples: Soft breathing, gentle ambience, white noise

## Free Sound Resources

### Recommended Sources

1. **Freesound.org** - https://freesound.org/
   - Creative Commons licensed sounds
   - Search: "UI", "notification", "chime", "beep"

2. **Zapsplat.com** - https://www.zapsplat.com/
   - Free sound effects
   - Search: "UI sounds", "notification"

3. **Mixkit.co** - https://mixkit.co/free-sound-effects/
   - Free for commercial use
   - UI and notification sounds

4. **Pixabay** - https://pixabay.com/sound-effects/
   - Royalty-free sounds
   - Good for short UI effects

5. **BBC Sound Effects** - https://sound-effects.bbcrewind.co.uk/
   - Archive of BBC sounds
   - Creative Commons licensed

### Quick Setup (Placeholder Sounds)

If you don't have custom sounds yet, you can use simple Web Audio API-generated tones:

```javascript
// Example: Generate a simple beep (for testing)
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
oscillator.frequency.value = 440; // A4 note
oscillator.connect(audioContext.destination);
oscillator.start();
oscillator.stop(audioContext.currentTime + 0.1);
```

Or download free UI sounds and rename them to match the required filenames.

## Alternative: Text-to-Speech Sounds

You can also generate emotional vocalizations:
- Happy: "Yay!", "Woo!", "Hehe"
- Sad: "Aww", "Oh no", "*sigh*"
- Think: "Hmm", "Let's see"
- Surprise: "Woah!", "Oh!", "What?!"

Use online TTS services or record your own voice.

## Volume Control

Users can adjust sound volume in the application. Default volume is set to 30% (0.3) to avoid being intrusive.

## Testing

After adding sound files, test them with:

```bash
# Start the app
pnpm dev

# Open browser console and check for:
# [Audio] Preloaded: /sounds/happy.mp3
# [Audio] Playing: /sounds/happy.mp3
```

## Troubleshooting

### Sounds not playing?
1. Check browser console for errors
2. Verify file paths are correct
3. Ensure files are in MP3 format
4. Check browser autoplay policy (some browsers block audio until user interaction)

### Sounds too loud/quiet?
- Adjust volume in `use-emotion-queue.ts` (default: 0.3)
- Or normalize audio files to consistent volume

## Optional Enhancements

- Add stereo panning for directional effects
- Add reverb for depth
- Add fade-in/fade-out for smoother transitions
- Create variations (e.g., happy1.mp3, happy2.mp3) for variety
