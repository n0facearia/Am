import { createMemo, For } from "solid-js"
import { useLocal } from "@/context/local"

export function PersonaSwitcher() {
  const local = useLocal()
  const active = createMemo(() => local.agent.current()?.name)

  const personas = [
    { id: "plan", label: "Plan" },
    { id: "build", label: "Build" },
    { id: "chat", label: "Chat" },
  ]

  return (
    <div
      class="flex flex-row items-center justify-center p-1 gap-1 rounded-md bg-v2-background-bg-base/50 mx-auto pointer-events-auto"
    >
      <For each={personas}>
        {(p) => {
          const isActive = createMemo(() => active() === p.id)
          return (
            <button
              onClick={() => local.agent.set(p.id)}
              class={`px-4 py-1 rounded-[4px] text-xs font-semibold transition-all ease-in-out ${
                isActive()
                  ? "shadow-sm"
                  : "text-v2-text-text-muted hover:text-v2-text-text-base hover:bg-v2-background-bg-layer-01"
              }`}
              style={{
                "transition-duration": "250ms",
                ...(isActive()
                  ? {
                      "background-color": "var(--agent-current-accent, var(--v2-background-bg-layer-02))",
                      color: "#FFFFFF",
                    }
                  : {}),
              }}
            >
              {p.label}
            </button>
          )
        }}
      </For>
    </div>
  )
}
