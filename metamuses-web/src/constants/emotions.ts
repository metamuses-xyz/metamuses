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

// Enhanced emotion-to-motion mapping with parameter variations
// Differentiates emotions that share the same motion group
export const EMOTION_MOTION_CONFIG: Record<Emotion, {
  motion: string
  parameters?: Partial<ModelParameters>
  sound?: string
}> = {
  [Emotion.Happy]: {
    motion: 'Tap',
    parameters: { leftEyeOpen: 1.2, rightEyeOpen: 1.2, mouthOpen: 0.6 }
  },
  [Emotion.Sad]: {
    motion: 'FlickDown',
    parameters: { leftEyeOpen: 0.7, rightEyeOpen: 0.7, angleY: -5 }
  },
  [Emotion.Think]: {
    motion: 'Tap@Body',
    parameters: { angleX: -10, leftEyeOpen: 0.9, rightEyeOpen: 0.9 }
  },
  [Emotion.Surprise]: {
    motion: 'Tap@Body',
    parameters: { leftEyeOpen: 1.3, rightEyeOpen: 1.3, angleY: 5 }
  },
  [Emotion.Question]: {
    motion: 'Tap@Body',
    parameters: { angleZ: 8, leftEyeOpen: 1.1, rightEyeOpen: 1.1 }
  },
  [Emotion.Curious]: {
    motion: 'Tap',
    parameters: { angleY: 10, leftEyeOpen: 1.1, rightEyeOpen: 1.1 }
  },
  [Emotion.Angry]: {
    motion: 'Flick@Body',
    parameters: { angleX: 5, leftEyeOpen: 0.8, rightEyeOpen: 0.8 }
  },
  [Emotion.Awkward]: {
    motion: 'Flick',
    parameters: { angleZ: -5, mouthForm: -0.3 }
  },
  [Emotion.Idle]: {
    motion: 'Idle',
    parameters: {} // Default parameters
  }
}

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
