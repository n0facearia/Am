import { Component, createEffect, createResource, createSignal, For, Show } from "solid-js"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Icon } from "@opencode-ai/ui/icon"
import { useLanguage } from "@/context/language"
import { useServer } from "@/context/server"
import { useSync } from "@/context/sync"
import { usePlatform } from "@/context/platform"
import { fetchSettings, updateSettings, type SettingsData } from "@/utils/settings-api"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"
import { createSdkForServer } from "@/utils/server"

const KNOWN_AGENTS = ["build", "plan", "chat", "general", "explore", "frontend", "backend", "documentation", "orchestrator"]

export const SettingsContextV2: Component = () => {
  const language = useLanguage()
  const server = useServer()
  const sync = useSync()
  const platform = usePlatform()
  const directory = () => sync().data.path.directory ?? ""

  const [settings, { mutate }] = createResource(
    () => ({ server: server.current?.http, directory: directory() }),
    async ({ server, directory }) => {
      if (!server || !directory) return undefined
      return fetchSettings(server, directory)
    },
  )

  const [agentModels, setAgentModels] = createSignal<Record<string, string>>({})
  const [customInstructions, setCustomInstructions] = createSignal<Record<string, string[]>>({})
  const [customSkills, setCustomSkills] = createSignal<Record<string, string[]>>({})
  const [pending, setPending] = createSignal(false)

  createEffect(() => {
    const data = settings()
    if (!data) return
    setAgentModels(data.agentModels ?? {})
    setCustomInstructions(data.customInstructions ?? {})
    setCustomSkills(data.customSkills ?? {})
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
      setCustomSkills(result.customSkills ?? {})
    } finally {
      setPending(false)
    }
  }

  const uploadFile = async (
    title: string,
    onSuccess: (file: File, content: string) => Promise<void>,
  ) => {
    if (!platform.openAttachmentPickerDialog) return
    await platform.openAttachmentPickerDialog(
      { title, accept: [".md"], multiple: false },
      async (file) => {
        const text = await file.text()
        await onSuccess(file, text)
      },
    )
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

  const addSkill = async (agentId: string, skillName: string) => {
    if (!skillName.trim()) return
    const next = { ...customSkills(), [agentId]: [...(customSkills()[agentId] ?? []), skillName.trim()] }
    setCustomSkills(next)
    await save({ customSkills: next })
  }

  const removeSkill = async (agentId: string, index: number) => {
    const current = customSkills()[agentId] ?? []
    const updated = current.filter((_, i) => i !== index)
    const next = { ...customSkills() }
    if (updated.length === 0) {
      delete next[agentId]
    } else {
      next[agentId] = updated
    }
    setCustomSkills(next)
    await save({ customSkills: next })
  }

  const GlobalContextSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">Global Context</h3>
      <p class="text-12-regular text-text-weak mb-3">
        Upload markdown files to provide global context (AGENTS.md) or global skills for all agents.
      </p>
      <SettingsListV2>
        <div class="px-4 py-3 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-14-medium text-text-strong">Global Instructions (AGENTS.md)</div>
              <div class="text-12-regular text-text-weak">Appends to the project's AGENTS.md</div>
            </div>
            <ButtonV2
              variant="outline"
              size="small"
              onClick={() => {
                void uploadFile("Upload Global Instructions", async (file, content) => {
                  const conn = server.current?.http
                  if (!conn) return
                  const api = createSdkForServer({ server: conn })
                  
                  // Read existing AGENTS.md if any
                  let existing = ""
                  try {
                    const res = await api.file.read({ path: ".opencode/AGENTS.md" })
                    if (res.data && res.data.type === "text") {
                      existing = res.data.content + "\n\n"
                    }
                  } catch (e) {
                    // Ignore, file doesn't exist yet
                  }
                  
                  const combined = existing + `## From ${file.name}\n${content}`
                  await api.file.write({
                    path: ".opencode/AGENTS.md",
                    content: combined
                  })
                })
              }}
            >
              Upload .md
            </ButtonV2>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-14-medium text-text-strong">Global Skills</div>
              <div class="text-12-regular text-text-weak">Adds a skill available to all agents</div>
            </div>
            <ButtonV2
              variant="outline"
              size="small"
              onClick={() => {
                void uploadFile("Upload Global Skill", async (file, content) => {
                  const conn = server.current?.http
                  if (!conn) return
                  const api = createSdkForServer({ server: conn })
                  const skillName = file.name.replace(/\.md$/, "")
                  const destPath = `.opencode/skills/${skillName}/SKILL.md`
                  
                  await api.file.write({
                    path: destPath,
                    content
                  })
                })
              }}
            >
              Upload Skill
            </ButtonV2>
          </div>
        </div>
      </SettingsListV2>
    </div>
  )

  const PerAgentContextSection = () => (
    <div class="settings-v2-section">
      <h3 class="settings-v2-section-title">Per-Agent Context</h3>
      <p class="text-12-regular text-text-weak mb-3">
        Configure LLM models, custom instructions, and specific skills for individual agents.
      </p>
      <SettingsListV2>
        <For each={KNOWN_AGENTS}>
          {(agentId) => {
            const instructions = () => customInstructions()[agentId] ?? []
            const skills = () => customSkills()[agentId] ?? []
            return (
              <div class="px-4 py-3 border-b border-border-weak-base last:border-b-0">
                <div class="text-14-medium text-text-strong mb-3 capitalize">{agentId} Agent</div>
                
                <div class="flex flex-col gap-4">
                  {/* Model Config */}
                  <div>
                    <div class="text-12-medium text-text-strong mb-1">LLM Model Override</div>
                    <TextInputV2
                      value={agentModels()[agentId] ?? ""}
                      placeholder="e.g. opencode/deepseek-v4-pro"
                      onInput={(e) => {
                        const value = e.currentTarget.value
                        setAgentModels((prev) => ({ ...prev, [agentId]: value }))
                      }}
                      onBlur={() => {
                        const value = agentModels()[agentId]
                        if (value) void updateAgentModel(agentId, value)
                        else void removeAgentModel(agentId)
                      }}
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <div class="text-12-medium text-text-strong mb-1 flex justify-between items-center">
                      <span>Custom Instructions</span>
                      <ButtonV2
                        variant="ghost-muted"
                        size="small"
                        onClick={() => {
                          void uploadFile("Upload Custom Instructions", async (file, content) => {
                            const conn = server.current?.http
                            if (!conn) return
                            const api = createSdkForServer({ server: conn })
                            const destPath = `.opencode/agents/${agentId}-instructions/${file.name}`
                            
                            await api.file.write({
                              path: destPath,
                              content
                            })
                            await addInstruction(agentId, destPath)
                          })
                        }}
                      >
                        <Icon name="plus" class="size-3.5 mr-1" /> Upload
                      </ButtonV2>
                    </div>
                    <Show when={instructions().length > 0}>
                      <div class="flex flex-col gap-1 mt-1">
                        <For each={instructions()}>
                          {(path, index) => (
                            <div class="flex items-center gap-2 text-12-regular text-text-weak bg-background-base p-1.5 rounded">
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
                  </div>

                  {/* Skills */}
                  <div>
                    <div class="text-12-medium text-text-strong mb-1 flex justify-between items-center">
                      <span>Specific Skills</span>
                      <ButtonV2
                        variant="ghost-muted"
                        size="small"
                        onClick={() => {
                          void uploadFile("Upload Skill", async (file, content) => {
                            const conn = server.current?.http
                            if (!conn) return
                            const api = createSdkForServer({ server: conn })
                            const skillName = file.name.replace(/\.md$/, "")
                            const destPath = `.opencode/skills/${skillName}/SKILL.md`
                            
                            await api.file.write({
                              path: destPath,
                              content
                            })
                            await addSkill(agentId, skillName)
                          })
                        }}
                      >
                        <Icon name="plus" class="size-3.5 mr-1" /> Upload
                      </ButtonV2>
                    </div>
                    <Show when={skills().length > 0}>
                      <div class="flex flex-col gap-1 mt-1">
                        <For each={skills()}>
                          {(skill, index) => (
                            <div class="flex items-center gap-2 text-12-regular text-text-weak bg-background-base p-1.5 rounded">
                              <Icon name="folder" class="size-3.5 shrink-0" />
                              <span class="truncate flex-1">{skill}</span>
                              <button
                                type="button"
                                class="shrink-0 p-1 text-text-weak hover:text-error-base"
                                onClick={() => void removeSkill(agentId, index())}
                              >
                                <Icon name="close-small" class="size-3" />
                              </button>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            )
          }}
        </For>
      </SettingsListV2>
    </div>
  )

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">Context & Agents</h2>
      </div>
      <div class="settings-v2-tab-body">
        <GlobalContextSection />
        <PerAgentContextSection />
      </div>
    </>
  )
}
