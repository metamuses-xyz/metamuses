/**
 * Emotion markers used in LLM responses
 * These markers trigger specific animations/motions in Live2D models
 */

export const EMOTION_HAPPY = '<|EMOTE_HAPPY|>'
export const EMOTION_SAD = '<|EMOTE_SAD|>'
export const EMOTION_ANGRY = '<|EMOTE_ANGRY|>'
export const EMOTION_THINK = '<|EMOTE_THINK|>'
export const EMOTION_SURPRISE = '<|EMOTE_SURPRISED|>'
export const EMOTION_AWKWARD = '<|EMOTE_AWKWARD|>'
export const EMOTION_QUESTION = '<|EMOTE_QUESTION|>'
export const EMOTION_CURIOUS = '<|EMOTE_CURIOUS|>'

export enum Emotion {
  Idle = '<|EMOTE_NEUTRAL|>',
  Happy = '<|EMOTE_HAPPY|>',
  Sad = '<|EMOTE_SAD|>',
  Angry = '<|EMOTE_ANGRY|>',
  Think = '<|EMOTE_THINK|>',
  Surprise = '<|EMOTE_SURPRISED|>',
  Awkward = '<|EMOTE_AWKWARD|>',
  Question = '<|EMOTE_QUESTION|>',
  Curious = '<|EMOTE_CURIOUS|>',
}

export const EMOTION_VALUES = Object.values(Emotion)

// Mapping from emotion markers to Live2D motion group names
// For Hiyori model, available motions: Idle, Flick, FlickDown, Tap, Tap@Body, Flick@Body
export const EMOTION_MOTION_MAP: Record<Emotion, string> = {
  [Emotion.Idle]: 'Idle',
  [Emotion.Happy]: 'Tap',           // Happy -> Tap motion
  [Emotion.Sad]: 'FlickDown',       // Sad -> FlickDown motion
  [Emotion.Angry]: 'Flick@Body',    // Angry -> Flick@Body motion
  [Emotion.Think]: 'Tap@Body',      // Think -> Tap@Body motion
  [Emotion.Surprise]: 'Tap@Body',   // Surprise -> Tap@Body motion
  [Emotion.Awkward]: 'Flick',       // Awkward -> Flick motion
  [Emotion.Question]: 'Tap@Body',   // Question -> Tap@Body motion
  [Emotion.Curious]: 'Tap',         // Curious -> Tap motion
}

// Default model parameters for Live2D
export const DEFAULT_MODEL_PARAMETERS = {
  // Head rotation
  angleX: 0,
  angleY: 0,
  angleZ: 0,
  
  // Eyes
  leftEyeOpen: 1,
  rightEyeOpen: 1,
  
  // Mouth (for lip sync)
  mouthOpen: 0,
  mouthForm: 0,
  
  // Body
  bodyAngleX: 0,
  bodyAngleY: 0,
  bodyAngleZ: 0,
  
  // Other
  breath: 0,
} as const

export type ModelParameters = typeof DEFAULT_MODEL_PARAMETERS

// Animation durations for each Live2D motion (in milliseconds)
// Based on Hiyori model motion files
export const EMOTION_ANIMATION_DURATIONS: Record<string, number> = {
  'Idle': 2000,        // Base idle animation
  'Tap': 1500,         // Happy, Curious
  'Flick': 1200,       // Awkward
  'FlickDown': 1400,   // Sad
  'Tap@Body': 1800,    // Think, Surprise, Question
  'Flick@Body': 1600,  // Angry
}

// Default duration if motion not found in map
export const DEFAULT_ANIMATION_DURATION = 1500

// Sound effect mappings for each emotion
// Maps emotions to audio file paths in /public/sounds/
// Supports both .mp3 and .wav formats (use .wav for generated sounds, .mp3 for production)
export const EMOTION_SOUND_MAP: Record<Emotion, string> = {
  [Emotion.Happy]: '/sounds/happy.wav',
  [Emotion.Sad]: '/sounds/sad.wav',
  [Emotion.Angry]: '/sounds/angry.wav',
  [Emotion.Think]: '/sounds/think.wav',
  [Emotion.Surprise]: '/sounds/surprise.wav',
  [Emotion.Awkward]: '/sounds/awkward.wav',
  [Emotion.Question]: '/sounds/question.wav',
  [Emotion.Curious]: '/sounds/curious.wav',
  [Emotion.Idle]: '/sounds/idle.wav',
}

// Enhanced emotion configuration type
export interface EmotionConfig {
  motion: string
  parameters?: Partial<ModelParameters>
  sound?: string
  transitionDuration?: number  // How long to transition to this emotion (ms)
  holdDuration?: number        // How long to hold the emotion before returning to idle (ms)
}

// Enhanced emotion-to-motion mapping with parameter variations
// Each emotion has unique parameters to differentiate even when sharing motion groups
export const EMOTION_MOTION_CONFIG: Record<Emotion, EmotionConfig> = {
  [Emotion.Happy]: {
    motion: 'Tap',
    parameters: {
      leftEyeOpen: 1.15,
      rightEyeOpen: 1.15,
      mouthOpen: 0.5,
      mouthForm: 0.4,     // Smile shape
      angleY: 3,          // Slight upward tilt
    },
    transitionDuration: 200,
    holdDuration: 1500,
  },
  [Emotion.Sad]: {
    motion: 'FlickDown',
    parameters: {
      leftEyeOpen: 0.7,
      rightEyeOpen: 0.7,
      angleX: -8,         // Look down
      angleY: -5,         // Head tilt
      mouthForm: -0.3,    // Slight frown
    },
    transitionDuration: 350,
    holdDuration: 1600,
  },
  [Emotion.Think]: {
    motion: 'Tap@Body',
    parameters: {
      angleX: -15,        // Look down (contemplating)
      angleY: -8,         // Slight side tilt
      angleZ: 3,          // Subtle tilt
      leftEyeOpen: 0.7,   // Narrowed eyes
      rightEyeOpen: 0.7,
      mouthForm: -0.15,   // Subtle pursed lips
    },
    transitionDuration: 400,  // Slower for contemplation
    holdDuration: 2000,
  },
  [Emotion.Surprise]: {
    motion: 'Tap@Body',
    parameters: {
      angleX: 8,          // Head back
      leftEyeOpen: 1.4,   // Wide eyes
      rightEyeOpen: 1.4,
      mouthOpen: 0.7,     // Open mouth (gasp)
      mouthForm: 0.1,     // Slightly rounded
    },
    transitionDuration: 120,  // Quick snap reaction
    holdDuration: 1200,
  },
  [Emotion.Question]: {
    motion: 'Tap@Body',
    parameters: {
      angleZ: 12,         // Head tilt (curious)
      angleX: 5,          // Slight forward lean
      angleY: 8,          // Looking up slightly
      leftEyeOpen: 1.15,  // Alert eyes
      rightEyeOpen: 1.1,  // Slight asymmetry
      mouthOpen: 0.15,    // Slightly parted
    },
    transitionDuration: 250,
    holdDuration: 1500,
  },
  [Emotion.Curious]: {
    motion: 'Tap',
    parameters: {
      angleY: 12,         // Head turn (interested)
      angleX: 5,          // Slight lean forward
      leftEyeOpen: 1.2,   // Wide, interested eyes
      rightEyeOpen: 1.2,
      mouthForm: 0.2,     // Slight smile
    },
    transitionDuration: 220,
    holdDuration: 1500,
  },
  [Emotion.Angry]: {
    motion: 'Flick@Body',
    parameters: {
      angleX: 5,          // Head tilted forward
      angleY: 0,
      leftEyeOpen: 0.75,  // Narrowed, intense eyes
      rightEyeOpen: 0.75,
      mouthOpen: 0.2,
      mouthForm: -0.4,    // Frown
    },
    transitionDuration: 180,
    holdDuration: 1600,
  },
  [Emotion.Awkward]: {
    motion: 'Flick',
    parameters: {
      angleZ: -8,         // Head tilt away
      angleY: -6,         // Looking away
      leftEyeOpen: 0.85,
      rightEyeOpen: 0.9,  // Asymmetric
      mouthForm: -0.25,   // Nervous expression
      mouthOpen: 0.1,
    },
    transitionDuration: 280,
    holdDuration: 1400,
  },
  [Emotion.Idle]: {
    motion: 'Idle',
    parameters: {
      angleX: 0,
      angleY: 0,
      angleZ: 0,
      leftEyeOpen: 1,
      rightEyeOpen: 1,
      mouthOpen: 0,
      mouthForm: 0,
    },
    transitionDuration: 350,
    holdDuration: 2000,
  }
}

// Default transition duration if not specified
export const DEFAULT_TRANSITION_DURATION = 300

/**
 * Utility function to strip emotion markers from text for display
 * @param text - Text potentially containing emotion markers
 * @returns Clean text without emotion markers
 */
export function stripEmotionMarkers(text: string): string {
  let cleanedText = text

  // Remove all emotion markers
  for (const emotion of EMOTION_VALUES) {
    cleanedText = cleanedText.replace(new RegExp(emotion.replace(/[|<>]/g, '\\$&'), 'g'), '')
  }

  // Clean up any extra whitespace left behind
  return cleanedText.trim()
}
