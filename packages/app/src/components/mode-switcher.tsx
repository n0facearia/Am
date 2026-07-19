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
                // When entering chat mode, automatically set agent to chat
                if (m.id === "chat") {
                  local?.agent.set("chat")
                } else {
                  // For other modes, if current agent is not in the mode, select the first agent of that mode
                  const currentAgent = local?.agent.current()?.name
                  if (!currentAgent || !(MODES[m.id] as readonly string[]).includes(currentAgent)) {
                    local?.agent.set(MODES[m.id][0])
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
