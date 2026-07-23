import { createSignal, createMemo, For } from "solid-js"
import { useLocal } from "../context/local"
import { AGENT_ACCENTS, FALLBACK_PALETTE } from "../theme"
import { BoxRenderable } from "@opentui/core"
import { RGBA } from "@opentui/core"

export function PersonaSwitcher() {
  const local = useLocal()
  const active = createMemo(() => local.agent.current())

  return (
    <box flexDirection="row" gap={1} paddingLeft={1} paddingRight={1} alignItems="center">
      <For each={local.agent.list()}>
        {(p) => {
          const color = local.agent.color(p.name)
          const isSelected = active()?.name === p.name
          return (
            <box
              onMouseUp={() => local.agent.set(p.name)}
              paddingTop={0.5}
              paddingBottom={0.5}
              paddingLeft={1}
              paddingRight={1}
               backgroundColor={isSelected ? color : "transparent"}
               borderColor={color}
               border={["left", "right", "top", "bottom"]}
            >
               <text fg={isSelected ? FALLBACK_PALETTE.onPrimary : color}>
                 {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
               </text>

            </box>
          )
        }}
      </For>
    </box>
  )
}
