import { Component, createEffect, createResource, createSignal, For, Show } from "solid-js"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Icon } from "@opencode-ai/ui/icon"
import { useLanguage } from "@/context/language"
import { useServer } from "@/context/server"
import { useSync } from "@/context/sync"
import { fetchSettings, updateSettings, type SettingsData } from "@/utils/settings-api"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

const KNOWN_AGENTS = ["build", "plan", "chat", "general", "explore", "frontend", "backend", "documentation", "orchestrator"]

export const SettingsAgentsV2: Component = () => {
  const language = useLanguage()
  const server = useServer()
  const sync = useSync()
  const directory = () => sync().data.path.directory ?? ""

  const [settings, { mutate, refetch }] = createResource(
    () => ({ server: server.current?.http, directory: directory() }),
    async ({ server, directory }) => {
      if (!server || !directory) return undefined
      return fetchSettings(server, directory)
    },
  )

  const [agentModels, setAgentModels] = createSignal<Record<string, string>>({})
  const [customInstructions, setCustomInstructions] = createSignal<Record<string, string[]>>({})
  const [userProfile, setUserProfile] = createSignal<{
    preferredName?: string
    bio?: string
    experienceLevel?: string
  }>({})
  const [pending, setPending] = createSignal(false)

  createEffect(() => {
    const data = settings()
    if (!data) return
    setAgentModels(data.agentModels ?? {})
    setCustomInstructions(data.customInstructions ?? {})
    setUserProfile(data.userProfile ?? {})
  })

  const save = async (patch: Partial<SettingsData>) => {
    const conn = server.current?.http
    const dir = directory()
    if (!conn || !dir) return
    setPending(true)
    try {
      const result = await updateSettings(conn, dir, patch)
      mutate(result)
      setAgentModels(result.agentModels ?? {})
      setCustomInstructions(result.customInstructions ?? {})
      setUserProfile(result.userProfile ?? {})
    } finally {
      setPending(false)
    }
  }

  const updateAgentModel = async (agentId: string, modelRef: string) => {
    const next = { ...agentModels(), [agentId]: modelRef }
    setAgentModels(next)
    await save({ agentModels: next })
  }

  const removeAgentModel = async (agentId: string) => {
    const next = { ...agentModels() }
    delete next[agentId]
    setAgentModels(next)
    await save({ agentModels: next })
  }

  const addInstruction = async (agentId: string, filePath: string) => {
    if (!filePath.trim()) return
    const next = { ...customInstructions(), [agentId]: [...(customInstructions()[agentId] ?? []), filePath.trim()] }
    setCustomInstructions(next)
    await save({ customInstructions: next })
  }

  const removeInstruction = async (agentId: string, index: number) => {
    const current = customInstructions()[agentId] ?? []
    const updated = current.filter((_, i) => i !== index)
    const next = { ...customInstructions() }
    if (updated.length === 0) {
      delete next[agentId]
    } else {
      next[agentId] = updated
    }
    setCustomInstructions(next)
    await save({ customInstructions: next })
  }

  const AgentModelsSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">Agent Models</h3>
      <p class="text-12-regular text-text-weak mb-3">
        Override the default model for each agent. Use provider/model format (e.g. opencode/deepseek-v4-pro).
      </p>
      <SettingsListV2>
        <For each={KNOWN_AGENTS}>
          {(agentId) => (
            <SettingsRowV2
              title={agentId}
              description={agentModels()[agentId] || "Using default model"}
            >
              <div class="flex items-center gap-2">
                <TextInputV2
                  value={agentModels()[agentId] ?? ""}
                  placeholder="provider/model"
                  onInput={(e) => {
                    const value = e.currentTarget.value
                    setAgentModels((prev) => ({ ...prev, [agentId]: value }))
                  }}
                  onBlur={() => {
                    const value = agentModels()[agentId]
                    if (value) {
                      void updateAgentModel(agentId, value)
                    } else {
                      void removeAgentModel(agentId)
                    }
                  }}
                />
              </div>
            </SettingsRowV2>
          )}
        </For>
      </SettingsListV2>
    </div>
  )

  const CustomInstructionsSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">Custom Instructions</h3>
      <p class="text-12-regular text-text-weak mb-3">
        Attach .md files as custom instructions for each agent. These are appended to the agent's system prompt.
      </p>
      <SettingsListV2>
        <For each={KNOWN_AGENTS}>
          {(agentId) => {
            const [newPath, setNewPath] = createSignal("")
            const instructions = () => customInstructions()[agentId] ?? []
            return (
              <div class="px-4 py-3 border-b border-border-weak-base last:border-b-0">
                <div class="text-14-medium text-text-strong mb-2">{agentId}</div>
                <Show when={instructions().length > 0}>
                  <div class="flex flex-col gap-1 mb-2">
                    <For each={instructions()}>
                      {(path, index) => (
                        <div class="flex items-center gap-2 text-12-regular text-text-weak">
                          <Icon name="folder" class="size-3.5 shrink-0" />
                          <span class="truncate flex-1">{path}</span>
                          <button
                            type="button"
                            class="shrink-0 p-1 text-text-weak hover:text-error-base"
                            onClick={() => void removeInstruction(agentId, index())}
                          >
                            <Icon name="close-small" class="size-3" />
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
                <div class="flex items-center gap-2">
                  <TextInputV2
                    value={newPath()}
                    placeholder="path/to/instructions.md"
                    onInput={(e) => setNewPath(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void addInstruction(agentId, newPath())
                        setNewPath("")
                      }
                    }}
                  />
                  <ButtonV2
                    variant="ghost-muted"
                    size="small"
                    onClick={() => {
                      void addInstruction(agentId, newPath())
                      setNewPath("")
                    }}
                    disabled={!newPath().trim()}
                  >
                    <Icon name="plus" class="size-3.5" />
                  </ButtonV2>
                </div>
              </div>
            )
          }}
        </For>
      </SettingsListV2>
    </div>
  )

  const UserProfileSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">User Profile</h3>
      <p class="text-12-regular text-text-weak mb-3">
        Your profile information is injected into every agent's system prompt.
      </p>
      <SettingsListV2>
        <SettingsRowV2 title="Preferred Name" description="How agents should address you">
          <TextInputV2
            value={userProfile().preferredName ?? ""}
            placeholder="Your name"
            onInput={(e) => setUserProfile((prev) => ({ ...prev, preferredName: e.currentTarget.value }))}
            onBlur={() => void save({ userProfile: userProfile() })}
          />
        </SettingsRowV2>
        <SettingsRowV2 title="Bio" description="Brief description about yourself">
          <TextInputV2
            value={userProfile().bio ?? ""}
            placeholder="Your bio"
            onInput={(e) => setUserProfile((prev) => ({ ...prev, bio: e.currentTarget.value }))}
            onBlur={() => void save({ userProfile: userProfile() })}
          />
        </SettingsRowV2>
        <SettingsRowV2 title="Experience Level" description="Your experience level (e.g. beginner, intermediate, expert)">
          <TextInputV2
            value={userProfile().experienceLevel ?? ""}
            placeholder="e.g. expert"
            onInput={(e) => setUserProfile((prev) => ({ ...prev, experienceLevel: e.currentTarget.value }))}
            onBlur={() => void save({ userProfile: userProfile() })}
          />
        </SettingsRowV2>
      </SettingsListV2>
    </div>
  )

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">Agents</h2>
      </div>
      <div class="settings-v2-tab-body">
        <AgentModelsSection />
        <CustomInstructionsSection />
        <UserProfileSection />
      </div>
    </>
  )
}
