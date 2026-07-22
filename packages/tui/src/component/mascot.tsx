import { createMemo } from "solid-js"
import { useTheme } from "../context/theme"
import { RGBA, TextAttributes } from "@opentui/core"

export type MascotState = "idle" | "thinking" | "success" | "error"

export function Mascot(props: { state: MascotState }) {
  const { theme } = useTheme()
  const accent = theme.accent

  const states = {
    idle: {
      art: `∩█     ∩█░\n█▀▀▀▀▀▀▀█░\n█ ▌   ▌ █░\n█   º   █░\n█▄▄▄▄▄▄▄█░\n  █████░ ██░\n  █████░ █░ \n  ████████░`,
      color: accent,
    },
    thinking: {
      art: `∩█     ∩█░\n█▀▀▀▀▀▀▀█░\n█ ▀   ▀ █░\n█   º   █░\n█▄▄▄▄▄▄▄█░\n  █████░ ██░\n  █████░ █░ \n  ████████░`,
      color: accent,
    },
    success: {
      art: `∩█     ∩█░\n█▀▀▀▀▀▀▀█░\n█ ^   ^ █░\n█   v   █░\n█▄▄▄▄▄▄▄█░\n  █████░ ██░\n  █████░ █░ \n  ████████░`,
      color: theme.success,
    },
    error: {
      art: `∩█     ∩█░\n█▀▀▀▀▀▀▀█░\n█ >   < █░\n█   u   █░\n█▄▄▄▄▄▄▄█░\n  █████░ ██░\n  █████░ █░ \n  ████████░`,
      color: theme.error,
    },
  }

  const current = states[props.state]

  return (
    <box flexDirection="column" alignItems="center">
      <text fg={current.color} attributes={TextAttributes.BOLD}>
        {current.art}
      </text>
    </box>
  )
}
