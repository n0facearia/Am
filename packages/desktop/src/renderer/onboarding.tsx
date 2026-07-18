import {
  ServerConnection,
  useLayout,
  useProviders,
  useServer,
  useServerSDK,
  useServerSync,
  useTabs,
} from "@opencode-ai/app"
import { onMount, startTransition } from "solid-js"

export function DesktopFirstLaunchOnboarding(props: { initialUrl: string; onLoaded: () => void }) {
  const server = useServer()
  const serverSDK = useServerSDK()
  const serverSync = useServerSync()
  const layout = useLayout()
  const providers = useProviders()
  const tabs = useTabs()

  onMount(() => {
    void runFirstLaunchOnboarding().finally(props.onLoaded)
  })

  async function runFirstLaunchOnboarding() {
    try {
      console.log("[desktop-onboarding] waiting for promises...");
      console.log("[desktop-onboarding] server.ready.promise", !!server.ready.promise);
      console.log("[desktop-onboarding] layout.ready.promise", !!layout.ready.promise);
      console.log("[desktop-onboarding] tabs.ready.promise", !!tabs.ready.promise);
      console.log("[desktop-onboarding] tabs.recentReady.promise", !!tabs.recentReady.promise);
      
      const p1 = server.ready.promise ?? Promise.resolve();
      p1.then(() => console.log("[desktop-onboarding] server.ready.promise resolved"));
      
      const p2 = layout.ready.promise ?? Promise.resolve();
      p2.then(() => console.log("[desktop-onboarding] layout.ready.promise resolved"));
      
      const p3 = tabs.ready.promise ?? Promise.resolve();
      p3.then(() => console.log("[desktop-onboarding] tabs.ready.promise resolved"));
      
      const p4 = tabs.recentReady.promise ?? Promise.resolve();
      p4.then(() => console.log("[desktop-onboarding] tabs.recentReady.promise resolved"));

      await Promise.all([p1, p2, p3, p4])
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
    } catch (error) {
      console.error("[desktop-onboarding] first launch onboarding failed", error)
    }
  }

  return null
}
