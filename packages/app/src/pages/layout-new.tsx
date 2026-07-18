import { createEffect, Suspense, createMemo, type ParentProps } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { DebugBar } from "@/components/debug-bar"
import { HelpButton } from "@/components/help-button"
import { Titlebar, type TitlebarUpdate } from "@/components/titlebar"
import { usePlatform } from "@/context/platform"

import { setNavigate } from "@/utils/notification-click"
import { setV2Toast, ToastRegion } from "@/utils/toast"
import { useSettingsCommand } from "@/components/settings-dialog"
// @ts-ignore
import brandConfig from "../../../../brand.config.json"

export default function NewLayout(props: ParentProps<{ serverScoped?: any }>) {
  const platform = usePlatform()
  const navigate = useNavigate()
  setNavigate(navigate)
  useSettingsCommand()

  createEffect(() => setV2Toast(true))

  const update: TitlebarUpdate = {
    version: () => {
      const state = platform.updater?.state()
      if (state?.status !== "ready") return
      return state.version
    },
    installing: () => platform.updater?.state().status === "installing",
    install: () => void platform.updater?.install(),
  }

  // Accent color from brand config — no route-scoped context needed
  const currentAccent = createMemo(() => {
    return (brandConfig?.accentColorsByMode as any)?.["chat"] || "#3B82F6"
  })

  return (
    <div
      class="relative bg-v2-background-bg-deep flex-1 min-h-0 min-w-0 flex flex-col select-none [&_input]:select-text [&_textarea]:select-text [&_[contenteditable]]:select-text transition-colors duration-250 ease-in-out"
      style={{
        "padding-top": "env(safe-area-inset-top, 0px)",
        "padding-bottom": "env(safe-area-inset-bottom, 0px)",
        "--agent-current-accent": currentAccent(),
        ...(brandConfig?.accentColorsByMode ? Object.fromEntries(
          Object.entries(brandConfig.accentColorsByMode).map(([key, val]) => [`--agent-${key}-accent`, val])
        ) : {})
      }}
    >
      <Titlebar update={update} />
      <div class="fixed inset-0 pointer-events-none z-0" style={{
        "background-image": "radial-gradient(circle, var(--v2-background-bg-layer-04) 1px, transparent 1px)",
        "background-size": "20px 20px",
        "opacity": "0.15",
        "animation": "halftone-pan 20s linear infinite"
      }} />
      <style>{`
        @keyframes halftone-pan {
          0% { background-position: 0px 0px; }
          100% { background-position: 20px 20px; }
        }
      `}</style>



      <main class="flex-1 min-h-0 min-w-0 overflow-x-hidden flex flex-col items-start contain-strict mt-8">
        {props.serverScoped}
        <Suspense fallback={<div class="flex-1" />}>{props.children}</Suspense>
      </main>
      {import.meta.env.DEV && <DebugBar inline />}
      <HelpButton />
      <ToastRegion v2 />
    </div>
  )
}
