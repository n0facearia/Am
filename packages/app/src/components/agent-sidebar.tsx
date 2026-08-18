import { createMemo, For, Show } from "solid-js"
import { useLocalOptional } from "@/context/local"
import { MODES, type ModeKey } from "@/constants/modes"
// @ts-ignore
import brandConfig from "../../../../brand.config.json"

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  plan: "Planning & architecture",
  build: "Execution & code changes",
  frontend: "UI & frontend development",
  backend: "APIs & backend systems",
  documentation: "Docs & project specs",
  chat: "Conversational assistant",
}

const SECTIONS: { id: ModeKey; title: string }[] = [
  { id: "main", title: "Main" },
  { id: "advanced", title: "Advanced" },
  { id: "chat", title: "Chat" },
]

export function AgentSidebar() {
  const local = useLocalOptional()
  const activeAgent = createMemo(() => local?.agent.current()?.name)

  const allPredefined = Object.values(MODES).flat() as readonly string[]

  const customAgents = createMemo(() => {
    const list = local?.agent.list() || []
    return list.filter((a) => !allPredefined.includes(a.name)).map((a) => a.name)
  })

  const getAgentColor = (agentId: string) => {
    return (brandConfig?.accentColorsByMode as Record<string, string> | undefined)?.[agentId] ?? "#3B82F6"
  }

  const getAgentDescription = (agentId: string) => {
    const agentData = local?.agent.list().find((a) => a.name === agentId)
    return agentData?.description || DEFAULT_DESCRIPTIONS[agentId] || "Specialized agent"
  }

  return (
    <Show when={local}>
      <aside
        class="flex flex-col h-full w-60 border-r border-v2-border-border-base bg-v2-background-bg-base/80 backdrop-blur-md overflow-hidden select-none shrink-0 transition-all duration-300 ease-in-out"
        aria-label="Agent Selection"
      >
        <div class="flex flex-col h-full overflow-y-auto px-3 py-4 gap-4">
          <div class="px-2 text-[11px] font-bold text-v2-text-text-muted uppercase tracking-wider">
            Agents
          </div>

          <For each={SECTIONS}>
            {(section) => {
              const agents = MODES[section.id] || []
              return (
                <div class="flex flex-col gap-1">
                  <div class="px-2 text-[10px] font-semibold text-v2-text-text-faint uppercase tracking-wider mb-0.5">
                    {section.title}
                  </div>
                  <div class="flex flex-col gap-1">
                    <For each={agents}>
                      {(agentId) => {
                        const isActive = createMemo(() => activeAgent() === agentId)
                        const color = getAgentColor(agentId)
                        const description = getAgentDescription(agentId)

                        return (
                          <button
                            type="button"
                            onClick={() => local?.agent.set(agentId)}
                            class={`group relative overflow-hidden flex flex-col px-3 py-2 rounded-lg transition-all duration-200 text-left cursor-pointer border ${
                              isActive()
                                ? "mode-tab-active font-medium shadow-sm border-v2-border-border-base/50 bg-v2-background-bg-layer-02"
                                : "border-transparent text-v2-text-text-muted hover:text-v2-text-text-base hover:bg-v2-background-bg-layer-01/80"
                            }`}
                          >
                            <div class="flex items-center gap-2 w-full min-w-0">
                              <span
                                class="size-2 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                                style={{ "background-color": color }}
                              />
                              <span class="truncate capitalize text-xs font-medium">
                                {agentId}
                              </span>
                            </div>
                            <span class="text-[11px] text-v2-text-text-muted/80 truncate mt-0.5 pl-4 leading-tight">
                              {description}
                            </span>
                          </button>
                        )
                      }}
                    </For>
                  </div>
                </div>
              )
            }}
          </For>

          <Show when={customAgents().length > 0}>
            <div class="flex flex-col gap-1">
              <div class="px-2 text-[10px] font-semibold text-v2-text-text-faint uppercase tracking-wider mb-0.5">
                Custom
              </div>
              <div class="flex flex-col gap-1">
                <For each={customAgents()}>
                  {(agentId) => {
                    const isActive = createMemo(() => activeAgent() === agentId)
                    const color = getAgentColor(agentId)
                    const description = getAgentDescription(agentId)

                    return (
                      <button
                        type="button"
                        onClick={() => local?.agent.set(agentId)}
                        class={`group relative overflow-hidden flex flex-col px-3 py-2 rounded-lg transition-all duration-200 text-left cursor-pointer border ${
                          isActive()
                            ? "mode-tab-active font-medium shadow-sm border-v2-border-border-base/50 bg-v2-background-bg-layer-02"
                            : "border-transparent text-v2-text-text-muted hover:text-v2-text-text-base hover:bg-v2-background-bg-layer-01/80"
                        }`}
                      >
                        <div class="flex items-center gap-2 w-full min-w-0">
                          <span
                            class="size-2 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                            style={{ "background-color": color }}
                          />
                          <span class="truncate capitalize text-xs font-medium">
                            {agentId}
                          </span>
                        </div>
                        <span class="text-[11px] text-v2-text-text-muted/80 truncate mt-0.5 pl-4 leading-tight">
                          {description}
                        </span>
                      </button>
                    )
                  }}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </aside>
    </Show>
  )
}
