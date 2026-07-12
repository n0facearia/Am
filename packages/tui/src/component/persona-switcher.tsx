import { createSignal, createMemo, For } from "solid-js"
import { useLocal } from "../context/local"
import { AGENT_ACCENTS, FALLBACK_PALETTE } from "../theme"
import { BoxRenderable } from "@opentui/core"
import { RGBA } from "@opentui/core"

export function PersonaSwitcher() {
  const local = useLocal()
  const active = createMemo(() => local.agent.current())

  const personas = [
    { id: "plan", label: "Plan" },
    { id: "build", label: "Build" },
    { id: "chat", label: "Chat" },
  ]

  return (
    <box flexDirection="row" gap={1} paddingLeft={1} paddingRight={1} alignItems="center">
      <For each={personas}>
        {(p) => {
          const color = AGENT_ACCENTS[p.id]
          return (
            <box
              onMouseUp={() => local.agent.set(p.id)}
              paddingTop={0.5}
              paddingBottom={0.5}
              paddingLeft={1}
              paddingRight={1}
               backgroundColor={active()?.name === p.id ? color : "transparent"}
               borderColor={color}
               border={["left", "right", "top", "bottom"]}
            >
               <text fg={active()?.name === p.id ? FALLBACK_PALETTE.onPrimary : color}>{p.label}</text>

            </box>
          )
        }}
      </For>
    </box>
  )
}
