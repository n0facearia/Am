import { DataProvider } from "@opencode-ai/session-ui/context"
import { showToast } from "@/utils/toast"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { useLocation, useNavigate, useParams } from "@solidjs/router"
import { type Accessor, createEffect, createMemo, createResource, onCleanup, type ParentProps, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { LocalProvider } from "@/context/local"
import { useSettings } from "@/context/settings"
import { ModeSwitcher } from "@/components/mode-switcher"
import { AgentSidebar } from "@/components/agent-sidebar"
import { ChatBackground } from "@/components/chat-background"
import { SDKProvider } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { decode64 } from "@/utils/base64"
import { Schema } from "effect"
import type { ServerConnection } from "@/context/server"
import { sessionHref } from "@/utils/session-route"
import { useServerSync } from "@/context/server-sync"

export function DirectoryDataProvider(
  props: ParentProps<{
    directory: string | Accessor<string>
    draftID?: string
    server?: Accessor<ServerConnection.Key | undefined>
  }>,
) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const sync = useSync()
  const serverSync = useServerSync()
  const directory = () => (typeof props.directory === "function" ? props.directory() : props.directory)
  const slug = createMemo(() => base64Encode(directory()))
  const href = (sessionID: string) => {
    const server = props.server?.()
    if (server) return sessionHref(server, sessionID)
    return `/${slug()}/session/${sessionID}`
  }

  createEffect(() => {
    // A draft lives at /new-session?draftId=… and has no directory segment to normalize.
    if (props.draftID || props.server?.()) return
    const next = sync().data.path.directory
    if (!next || next === directory()) return
    const path = location.pathname.slice(slug().length + 1)
    navigate(`/${base64Encode(next)}${path}${location.search}${location.hash}`, { replace: true })
  })

  createResource(
    () => params.id,
    (id) =>
      sync()
        .session.sync(id)
        .catch(() => {}),
  )

  createEffect(() => {
    const sessionID = params.id
    if (!sessionID) return
    serverSync().session.pin(sessionID)
    onCleanup(() => serverSync().session.unpin(sessionID))
  })

  return (
    <Show when={directory()} keyed>
      {(directory) => (
        <DataProvider
          data={sync().data}
          directory={directory}
          onNavigateToSession={(sessionID: string) => navigate(href(sessionID))}
          onSessionHref={href}
        >
          <LocalProvider>
            <Show
              when={useSettings().general.newLayoutDesigns()}
              fallback={props.children}
            >
              <style>{`
                .mode-tab-active {
                  color: #FFFFFF;
                  background: linear-gradient(135deg, color-mix(in srgb, var(--agent-current-accent, var(--v2-background-bg-layer-02)) 70%, white), color-mix(in srgb, var(--agent-current-accent, var(--v2-background-bg-layer-02)) 70%, black));
                }

                .mode-tab-active::before {
                  content: "";
                  position: absolute;
                  inset: 0;
                  pointer-events: none;
                  background-image: radial-gradient(circle at center, color-mix(in srgb, var(--agent-current-accent, white) 50%, white) 2px, transparent 2.5px);
                  background-size: 6px 6px;
                  opacity: 0;
                  z-index: 0;
                  animation: mode-tab-halftone 400ms ease-in-out;
                }

                @keyframes mode-tab-halftone {
                  0% {
                    opacity: 0;
                    filter: contrast(1) blur(0px);
                    transform: scale(0.9);
                  }
                  50% {
                    opacity: 0.6;
                    filter: contrast(20) blur(1px);
                    transform: scale(1.05);
                  }
                  100% {
                    opacity: 0;
                    filter: contrast(1) blur(0px);
                    transform: scale(1.1);
                  }
                }
              `}</style>
              <div class="flex w-full h-full min-h-0 min-w-0 relative z-0">
                <ChatBackground />
                <AgentSidebar />
                <div class="flex-1 min-h-0 min-w-0 flex flex-col relative transition-all duration-300">
                  <div class="absolute top-[env(safe-area-inset-top,10px)] left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
                    <ModeSwitcher />
                  </div>
                  {props.children}
                </div>
              </div>
            </Show>
          </LocalProvider>
        </DataProvider>
      )}
    </Show>
  )
}

export const ProjectDirString = Schema.String.pipe(Schema.brand("ProjectDirString"))
export type ProjectDirString = Schema.Schema.Type<typeof ProjectDirString>

export function decodeDirectory(dir: string): ProjectDirString | undefined {
  const decoded = decode64(dir)
  if (!decoded) return
  return ProjectDirString.make(decoded)
}

export default function Layout(props: ParentProps) {
  const params = useParams()
  const language = useLanguage()
  const navigate = useNavigate()
  let invalid = ""

  const resolved = createMemo(() => {
    if (!params.dir) return ""
    return decodeDirectory(params.dir) ?? ""
  })

  createEffect(() => {
    const dir = params.dir
    if (!dir) return
    if (resolved()) {
      invalid = ""
      return
    }
    if (invalid === dir) return
    invalid = dir
    showToast({
      variant: "error",
      title: language.t("common.requestFailed"),
      description: language.t("directory.error.invalidUrl"),
    })
    navigate("/", { replace: true })
  })

  return (
    <Show when={resolved()} keyed>
      {(resolved) => (
        <SDKProvider directory={resolved}>
          <DirectoryDataProvider directory={resolved}>{props.children}</DirectoryDataProvider>
        </SDKProvider>
      )}
    </Show>
  )
}
