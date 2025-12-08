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
