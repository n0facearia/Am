export const MODES = {
  main: ["plan", "build"],
  advanced: ["frontend", "backend", "documentation"],
  chat: ["chat"],
} as const

export type ModeKey = keyof typeof MODES
