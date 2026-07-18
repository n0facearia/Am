import type { ServerConnection } from "@/context/server"
import { authFromToken } from "@/utils/server"

export interface SettingsData {
  budgetGuardian?: {
    fallbackModels?: string[]
    contextThreshold?: number
  }
  agentModels?: Record<string, string>
  customInstructions?: Record<string, string[]>
  userProfile?: {
    preferredName?: string
    bio?: string
    experienceLevel?: string
  }
}

function buildAuthHeaders(server: ServerConnection.HttpBase): Record<string, string> {
  if (!server.password) return {}
  const token = btoa(`${server.username ?? "opencode"}:${server.password}`)
  return { Authorization: `Basic ${token}` }
}

export async function fetchSettings(
  server: ServerConnection.HttpBase,
  directory: string,
): Promise<SettingsData> {
  const url = new URL(`/settings?directory=${encodeURIComponent(directory)}`, server.url)
  const response = await fetch(url.toString(), {
    headers: {
      ...buildAuthHeaders(server),
      "Content-Type": "application/json",
    },
  })
  if (!response.ok) return {}
  return (await response.json()) as SettingsData
}

export async function updateSettings(
  server: ServerConnection.HttpBase,
  directory: string,
  patch: Partial<SettingsData>,
): Promise<SettingsData> {
  const url = new URL(`/settings?directory=${encodeURIComponent(directory)}`, server.url)
  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      ...buildAuthHeaders(server),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  })
  if (!response.ok) throw new Error(`Failed to update settings: ${response.status}`)
  return (await response.json()) as SettingsData
}
