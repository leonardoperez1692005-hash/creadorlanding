// ─── Shared types for section renderers ──────────────────────

export interface Theme {
  primary: string
  secondary: string
  accent: string
  bg: string
  bgCard: string
  text: string
  muted: string
  textMuted: string
  isDark: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Content = Record<string, any>

export interface RenderContext {
  projectId: string
  baseUrl: string
}

export type SectionRenderer = (content: Content, theme: Theme, ctx: RenderContext) => string
