import { createMemo } from "solid-js"
import { useTheme } from "../context/theme"
import { RGBA } from "@opentui/core"

export type MascotState = "idle" | "thinking" | "success" | "error"

export function Mascot(props: { state: MascotState }) {
  const { theme } = useTheme()
  const accent = theme.accent

  const states = {
    idle: {
      art: ` /\\_\\/\n( o.o )\n > ^ <`,
      color: accent,
    },
    thinking: {
      art: ` /\\_\\/\n( -.- )\n > w <`,
      color: accent,
    },
    success: {
      art: ` /\\_\\/\n( ^.^ )\n > v <`,
      color: theme.success,
    },
    error: {
      art: ` /\\_\\/\n( >.< )\n > u <`,
      color: theme.error,
    },
  }

  const current = states[props.state]

  return (
    <box flexDirection="column" alignItems="center" transition={150}>
      <text fg={current.color} style={{ bold: true }}>
        {current.art}
      </text>
    </box>
  )
}
