import { createMemo, createEffect, For, Show } from "solid-js"
import { useLocalOptional } from "@/context/local"
import { MODES, type ModeKey } from "@/constants/modes"
// @ts-ignore
import brandConfig from "../../../../brand.config.json"

export function ModeSwitcher() {
  const local = useLocalOptional()
  const active = createMemo(() => local?.mode.current())

  createEffect(() => {
    const agent = local?.agent.current()?.name
    if (agent && brandConfig?.accentColorsByMode) {
      const color = (brandConfig.accentColorsByMode as any)[agent] || "#3B82F6"
      document.body.style.setProperty("--agent-current-accent", color)
    }
  })

  const modes: { id: ModeKey; label: string }[] = [
    { id: "main", label: "Main" },
    { id: "advanced", label: "Advanced" },
    { id: "chat", label: "Chat" },
  ]

  return (
    <Show when={local}>
      <div
      class="flex flex-row items-center justify-center p-1 gap-1 rounded-md bg-v2-background-bg-base/50 mx-auto pointer-events-auto"
    >
      <For each={modes}>
        {(m) => {
          const isActive = createMemo(() => active() === m.id)
          return (
            <button
              onClick={() => {
                local?.mode.set(m.id)
                if (m.id === "chat") {
                  const hasChat = local?.agent.list().some((a) => a.name === "chat")
                  if (hasChat) {
                    local?.agent.set("chat")
                  }
                } else {
                  const currentAgent = local?.agent.current()?.name
                  const validAgents = (MODES[m.id] as readonly string[]) || []
                  if (!currentAgent || !validAgents.includes(currentAgent)) {
                    const target = local?.agent.list().find((a) => validAgents.includes(a.name))?.name || validAgents[0]
                    if (target) {
                      local?.agent.set(target)
                    }
                  }
                }
              }}
              class={`relative overflow-hidden px-4 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-250 ${
                isActive()
                  ? "mode-tab-active shadow-sm"
                  : "text-v2-text-text-muted hover:text-v2-text-text-base hover:bg-v2-background-bg-layer-01"
              }`}
            >
              <span class="relative z-10">{m.label}</span>
            </button>
          )
        }}
      </For>
      </div>
    </Show>
  )
}
