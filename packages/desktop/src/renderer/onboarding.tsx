import {
  ServerConnection,
  useLayout,
  useProviders,
  useServer,
  useServerSDK,
  useServerSync,
  useTabs,
} from "@opencode-ai/app"
import { onMount, startTransition, createSignal, Show } from "solid-js"

export function DesktopFirstLaunchOnboarding(props: { initialUrl: string; onLoaded: () => void }) {
  const server = useServer()
  const serverSDK = useServerSDK()
  const serverSync = useServerSync()
  const layout = useLayout()
  const providers = useProviders()
  const tabs = useTabs()

  const [errorState, setErrorState] = createSignal<string | null>(null)

  onMount(() => {
    let timer: ReturnType<typeof setTimeout>
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Initialization timed out after 15 seconds")), 15000)
    })

    void Promise.race([runFirstLaunchOnboarding(), timeout])
      .catch((error) => {
        console.error("[desktop-onboarding] first launch onboarding failed or timed out", error)
        setErrorState(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        clearTimeout(timer)
        props.onLoaded()
      })
  })

  async function runFirstLaunchOnboarding() {
    console.log("[desktop-onboarding] waiting for promises...");
    await Promise.all([
      server.ready.promise ?? Promise.resolve(),
      layout.ready.promise ?? Promise.resolve(),
      tabs.ready.promise ?? Promise.resolve(),
      tabs.recentReady.promise ?? Promise.resolve(),
    ]);
    console.log("[desktop-onboarding] all promises resolved!");
    if (!server.isLocal()) {
      console.log("[desktop-onboarding] not local server, skipping onboarding");
      return
    }

    const pending = await window.api.isFirstLaunchOnboardingPending()
    if (!pending) return

    const sessions = await serverSDK()
      .client.session.list()
      .then((x) => x.data ?? [])
      .catch(() => undefined)
    const connectedProviders = providers.connected()
    const paidProviders = providers.paid()
    const persistedProjects = layout.projects.list()
    const shouldTrigger =
      props.initialUrl === "/" &&
      sessions?.length === 0 &&
      paidProviders.length === 0 &&
      persistedProjects.length === 0 &&
      tabs.store.length === 0 &&
      server.list.every(ServerConnection.builtin)

    console.info("[desktop-onboarding] first launch onboarding evaluated", {
      pending,
      shouldTrigger,
      initialUrl: props.initialUrl,
      sessions: sessions?.length,
      connectedProviders: connectedProviders.length,
      paidProviders: paidProviders.length,
      serverProjects: serverSync().data.project.length,
      persistedProjects: persistedProjects.length,
      tabs: tabs.store.length,
      servers: server.list.map(ServerConnection.key),
    })

    const directory = await window.api.finishFirstLaunchOnboarding(shouldTrigger)
    if (!shouldTrigger || !directory) return

    console.info("[desktop-onboarding] starting first launch draft", { directory })
    server.projects.open(directory)
    server.projects.touch(directory)
    await startTransition(() => {
      tabs.newDraft({ server: server.key, directory })
    })
  }

  return (
    <Show when={errorState()}>
      <div class="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background-base p-6">
        <div class="max-w-md w-full bg-surface-base rounded-lg border border-border-base p-6 shadow-xl flex flex-col gap-4">
          <h2 class="text-16-medium text-text-strong">Startup Issue Detected</h2>
          <p class="text-14-regular text-text-base leading-relaxed">
            The application took too long to load data or encountered an error:
            <br />
            <span class="opacity-70 mt-1 inline-block">{errorState()}</span>
          </p>
          <div class="flex items-center justify-end gap-3 mt-4">
            <button
              class="px-3 py-1.5 text-13-medium bg-surface-raised-base hover:bg-surface-raised-base-hover text-text-strong rounded transition-colors"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <button
              class="px-3 py-1.5 text-13-medium bg-primary-base hover:bg-primary-hover text-white rounded transition-colors"
              onClick={() => setErrorState(null)}
            >
              Continue anyway
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
