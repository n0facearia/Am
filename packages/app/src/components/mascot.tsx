import { createSignal, createEffect, onCleanup, createMemo } from "solid-js"
import { useParams } from "@solidjs/router"
import { useServerSync } from "@/context/server-sync"
import { useSDK } from "@/context/sdk"
// @ts-ignore
import mascotImg from "../../../../ui/src/assets/images/mascot.png"

export type MascotState = "idle" | "thinking" | "success" | "error"

export function Mascot() {
  const sync = useServerSync()
  const sdk = useSDK()
  const params = useParams<{ id: string }>()
  
  const activeSessionId = createMemo(() => params.id)

  const [mascotState, setMascotState] = createSignal<MascotState>("idle")
  
  createEffect(() => {
    const id = activeSessionId()
    if (!id) {
      setMascotState("idle")
      return
    }
    const status = (sync().data as any).session_status?.[id]
    if (status && status.type !== "idle") {
      setMascotState("thinking")
    } else {
      setMascotState("idle")
    }
  })

  createEffect(() => {
    const cleanup = sdk().event.on("message.part.updated", (evt) => {
      const part = evt.properties.part
      if (part.type !== "tool") return
      if (part.state.status === "error") {
        setMascotState("error")
        setTimeout(() => setMascotState("idle"), 3000)
      } else if (part.state.status === "completed") {
        setMascotState("success")
        setTimeout(() => setMascotState("idle"), 2000)
      }
    })
    onCleanup(() => cleanup())
  })

  // Map state to visual filters/transforms based on the 150ms token for state changes
  const visualStyle = createMemo(() => {
    const state = mascotState()
    if (state === "thinking") {
      return "scale(1.05) brightness(1.1) drop-shadow(0 0 4px var(--agent-current-accent))"
    } else if (state === "success") {
      return "scale(1.1) drop-shadow(0 0 8px var(--v2-icon-icon-success))"
    } else if (state === "error") {
      return "rotate(5deg) drop-shadow(0 0 8px var(--v2-icon-icon-danger))"
    }
    // idle
    return "scale(1) drop-shadow(0 0 2px rgba(0,0,0,0.2))"
  })

  return (
    <div class="relative w-8 h-8 flex items-center justify-center pointer-events-auto">
      <img 
        src={mascotImg} 
        alt="Mascot"
        class="w-full h-full object-contain transition-all ease-in-out"
        style={{
          "transition-duration": "150ms",
          transform: visualStyle().includes("scale") || visualStyle().includes("rotate") ? visualStyle().split(" drop-shadow")[0] : "none",
          filter: visualStyle().includes("drop-shadow") ? visualStyle().substring(visualStyle().indexOf("drop-shadow")) : "none",
        }}
      />
    </div>
  )
}
