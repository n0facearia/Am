import { createMemo, For, Show } from "solid-js"
import { useLocalOptional } from "@/context/local"
import { MODES } from "@/constants/modes"
import { Tooltip } from "@opencode-ai/ui/tooltip"

export function AgentSidebar() {
  const local = useLocalOptional()
  const currentMode = createMemo(() => local?.mode.current())
  const activeAgent = createMemo(() => local?.agent.current()?.name)

  const modeAgents = createMemo(() => {
    const mode = currentMode()
    if (!mode) return []
    return MODES[mode as keyof typeof MODES] || []
  })
  
  const isSidebarVisible = createMemo(() => currentMode() !== "chat")

  return (
    <Show when={local}>
      <div 
        class={`flex flex-col h-full border-v2-border-border-base bg-v2-background-bg-base/80 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarVisible() ? "w-64 opacity-100 border-r" : "w-0 opacity-0 border-r-0"
        }`}
      >
        <div class="w-64 flex flex-col h-full overflow-y-auto">
          <div class="px-4 py-4 text-xs font-semibold text-v2-text-text-muted uppercase tracking-wider">
            Agents
          </div>
          <div class="flex flex-col px-2 gap-1 pointer-events-auto">
            <For each={modeAgents()}>
              {(agentId) => {
                const isActive = createMemo(() => activeAgent() === agentId)
                const agentData = createMemo(() => local?.agent.list().find(a => a.name === agentId))
                
                return (
                  <button
                    onClick={() => local?.agent.set(agentId)}
                    class={`relative overflow-hidden flex items-center px-3 py-2 rounded-md transition-colors duration-250 text-sm text-left ${
                      isActive()
                        ? "mode-tab-active font-medium shadow-sm"
                        : "text-v2-text-text-muted hover:text-v2-text-text-base hover:bg-v2-background-bg-layer-01"
                    }`}
                  >
                    <span class="relative z-10 truncate capitalize">{agentData()?.name ?? agentId}</span>
                  </button>
                )
              }}
            </For>
          </div>
        </div>
      </div>
    </Show>
  )
}
