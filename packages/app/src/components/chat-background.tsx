import { createMemo, createEffect, createSignal } from "solid-js"
import { useParams } from "@solidjs/router"
import { useSync } from "@/context/sync"

type BgState = "thinking" | "transitioning-to-thinking" | "transitioning-to-done" | "done"

export function ChatBackground() {
  const params = useParams()
  const sync = useSync()
  
  const isBusy = createMemo(() => {
    const id = params.id
    if (!id) return false
    try {
      return sync().data.session_working(id)
    } catch {
      return false
    }
  })

  const [bgState, setBgState] = createSignal<BgState>("done")
  const [targetState, setTargetState] = createSignal<"thinking" | "done">("done")
  let containerRef!: HTMLDivElement
  let a1Ref!: HTMLDivElement
  let a2Ref!: HTMLDivElement

  createEffect(() => {
    const busy = isBusy()
    const target = busy ? "thinking" : "done"
    
    if (targetState() !== target) {
      setTargetState(target)
      
      if (a1Ref && a2Ref) {
        // Step 1: Capture current computed transforms and opacities
        const c1 = getComputedStyle(a1Ref)
        const c2 = getComputedStyle(a2Ref)
        
        const t1 = c1.transform === "none" ? "" : c1.transform
        const t2 = c2.transform === "none" ? "" : c2.transform
        const o1 = c1.opacity
        const o2 = c2.opacity
        
        // Remove CSS animation explicitly by setting inline style
        a1Ref.style.animation = "none"
        a2Ref.style.animation = "none"
        
        // Lock to current computed values
        a1Ref.style.transform = t1
        a1Ref.style.opacity = o1
        a2Ref.style.transform = t2
        a2Ref.style.opacity = o2
        
        // Explicitly set transition on the inline style
        a1Ref.style.transition = "transform 1.5s ease-in-out, opacity 1.5s ease-in-out"
        a2Ref.style.transition = "transform 1.5s ease-in-out, opacity 1.5s ease-in-out"
        
        setBgState(busy ? "transitioning-to-thinking" : "transitioning-to-done")
        
        // Force reflow
        void containerRef.offsetHeight
        
        // Step 3: Set transform and opacity to target home position
        a1Ref.style.transform = "matrix(1, 0, 0, 1, 0, 0)"
        a1Ref.style.opacity = busy ? "0.25" : "0.1"
        
        a2Ref.style.transform = "matrix(1, 0, 0, 1, 0, 0)"
        a2Ref.style.opacity = busy ? "0.2" : "0.08"
      } else {
        setBgState(target)
      }
    }
  })
  
  const handleTransitionEnd = (e: TransitionEvent) => {
    if (bgState().startsWith("transitioning") && e.propertyName === "transform" && (e.target === a1Ref || e.target === a2Ref)) {
      setBgState(targetState())
      if (a1Ref) {
        a1Ref.style.transform = ""
        a1Ref.style.opacity = ""
        a1Ref.style.transition = ""
        a1Ref.style.animation = ""
      }
      if (a2Ref) {
        a2Ref.style.transform = ""
        a2Ref.style.opacity = ""
        a2Ref.style.transition = ""
        a2Ref.style.animation = ""
      }
    }
  }

  // Fallback timeout in case transitionend gets lost or skipped
  createEffect(() => {
    const s = bgState()
    if (s.startsWith("transitioning")) {
      const timer = setTimeout(() => {
        if (bgState() === s) {
          setBgState(targetState())
          if (a1Ref) {
            a1Ref.style.transform = ""
            a1Ref.style.opacity = ""
            a1Ref.style.transition = ""
            a1Ref.style.animation = ""
          }
          if (a2Ref) {
            a2Ref.style.transform = ""
            a2Ref.style.opacity = ""
            a2Ref.style.transition = ""
            a2Ref.style.animation = ""
          }
        }
      }, 1600)
      return () => clearTimeout(timer)
    }
  })

  return (
    <div 
      ref={containerRef}
      class={`absolute inset-0 z-[-1] pointer-events-none overflow-hidden transition-opacity duration-1000 ease-in-out chat-bg-${bgState()}`}
      onTransitionEnd={handleTransitionEnd}
    >
      <style>{`
        .chat-bg-thinking .aurora-1 {
          opacity: 0.25;
          animation: aurora-drift-1 12s infinite alternate ease-in-out;
        }
        .chat-bg-thinking .aurora-2 {
          opacity: 0.2;
          animation: aurora-drift-2 15s infinite alternate ease-in-out;
        }

        .chat-bg-transitioning-to-thinking .aurora-1,
        .chat-bg-transitioning-to-done .aurora-1 {
        }
        .chat-bg-transitioning-to-thinking .aurora-2,
        .chat-bg-transitioning-to-done .aurora-2 {
        }

        .chat-bg-done .aurora-1 {
          opacity: 0.1;
          animation: aurora-breathe-1 5s infinite alternate ease-in-out;
        }
        .chat-bg-done .aurora-2 {
          opacity: 0.08;
          animation: aurora-breathe-2 6s infinite alternate ease-in-out;
        }

        .aurora-1, .aurora-2 {
          position: absolute;
          width: 80vw;
          height: 80vh;
          background: radial-gradient(circle at center, var(--agent-current-accent, rgba(128,128,128,0.5)), transparent 60%);
          filter: blur(80px);
          border-radius: 50%;
        }

        .aurora-1 {
          top: -20%;
          left: -10%;
        }

        .aurora-2 {
          bottom: -20%;
          right: -10%;
        }

        @keyframes aurora-drift-1 {
          0% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(25%, 15%) scale(1.05); }
          100% { transform: translate(-15%, 25%) scale(0.95); }
        }

        @keyframes aurora-drift-2 {
          0% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-25%, -20%) scale(1.1); }
          100% { transform: translate(20%, -30%) scale(0.9); }
        }
        
        @keyframes aurora-breathe-1 {
          0% { transform: scale(1); opacity: 0.1; }
          100% { transform: scale(0.98); opacity: 0.14; }
        }

        @keyframes aurora-breathe-2 {
          0% { transform: scale(1); opacity: 0.08; }
          100% { transform: scale(0.98); opacity: 0.12; }
        }
      `}</style>
      <div ref={a1Ref} class="aurora-1" />
      <div ref={a2Ref} class="aurora-2" />
    </div>
  )
}
