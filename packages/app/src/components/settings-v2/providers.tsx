import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Tag } from "@opencode-ai/ui/v2/badge-v2"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { SelectV2 } from "@opencode-ai/ui/v2/select-v2"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { showToast } from "@/utils/toast"
import { popularProviders, useProviders } from "@/hooks/use-providers"
import { createMemo, type Component, For, Show, createSignal } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSDK } from "@/context/server-sdk"
import { useServerSync } from "@/context/server-sync"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

const PROVIDER_ICON_SIZE = 16

export const SettingsProvidersV2: Component<{ onBack?: () => void }> = (props) => {
  const dialog = useDialog()
  const language = useLanguage()
  const serverSdk = useServerSDK()
  const serverSync = useServerSync()
  const providers = useProviders()

  const [keys, setKeys] = createSignal<Record<string, string>>({})

  const connected = createMemo(() => {
    return providers
      .connected()
      .filter((p) => p.id !== "opencode" || Object.values(p.models).find((m) => m.cost?.input))
  })

  // List of connected provider IDs
  const connectedIDs = createMemo(() => new Set(connected().map((p) => p.id)))

  // Get all available models for default model selector
  const connectedModels = createMemo(() => {
    return connected().flatMap((p) =>
      Object.values(p.models).map((m) => ({
        id: `${p.id}/${m.id}`,
        label: `${p.name} - ${m.name}`,
        providerID: p.id,
        modelID: m.id,
      }))
    )
  })

  const currentDefaultModel = createMemo(() => {
    const configured = serverSync().data.config.model
    if (configured) {
      const match = connectedModels().find((m) => m.id === configured)
      if (match) return match
    }
    // Fallback to first available model if any
    return connectedModels()[0]
  })

  const selectDefaultModel = async (model: any) => {
    if (!model) return
    await serverSync().updateConfig({ model: model.id })
    showToast({
      variant: "success",
      icon: "circle-check",
      title: "Default Model Updated",
      description: `Default model set to ${model.label}`,
    })
  }

  // Local Ollama option
  const isOllamaEnabled = createMemo(() => {
    return !!serverSync().data.config.provider?.ollama
  })

  const toggleOllama = async (checked: boolean) => {
    const currentProviders = { ...serverSync().data.config.provider }
    if (checked) {
      currentProviders.ollama = {
        npm: "@ai-sdk/openai-compatible",
        name: "Ollama (local)",
        options: {
          baseURL: "http://localhost:11434/v1"
        },
        models: {
          "llama3": {
            name: "Llama 3"
          },
          "mistral": {
            name: "Mistral"
          }
        }
      }
      showToast({
        variant: "success",
        icon: "circle-check",
        title: "Ollama Connected",
        description: "Local Ollama provider configured at http://localhost:11434/v1",
      })
    } else {
      delete currentProviders.ollama
      showToast({
        variant: "success",
        icon: "circle-check",
        title: "Ollama Disconnected",
        description: "Local Ollama provider removed from configuration",
      })
    }

    await serverSync().updateConfig({
      provider: currentProviders
    })
  }

  const connectProvider = async (providerID: string, name: string) => {
    const key = keys()[providerID]
    if (!key || !key.trim()) {
      showToast({ variant: "error", title: "API Key Required", description: "Please enter a valid API key." })
      return
    }

    try {
      await serverSdk().client.auth.set({
        providerID,
        auth: {
          type: "api",
          key: key.trim(),
        },
      })
      await serverSdk().client.global.dispose()
      
      // Clear input
      setKeys(prev => {
        const next = { ...prev }
        delete next[providerID]
        return next
      })

      showToast({
        variant: "success",
        icon: "circle-check",
        title: "Connected Successfully",
        description: `${name} has been connected.`,
      })
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: "Connection Failed", description: message })
    }
  }

  const disconnectProvider = async (providerID: string, name: string) => {
    try {
      await serverSdk().client.auth.remove({ providerID })
      await serverSdk().client.global.dispose()
      showToast({
        variant: "success",
        icon: "circle-check",
        title: "Disconnected",
        description: `${name} has been disconnected.`,
      })
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: "Disconnection Failed", description: message })
    }
  }

  // Unified list of providers
  const displayProviders = createMemo(() => {
    const list = [
      { id: "openai", name: "OpenAI" },
      { id: "anthropic", name: "Anthropic" },
      { id: "openrouter", name: "OpenRouter", note: "Recommended — automatically retries a backup model if yours is rate-limited or down." },
      { id: "google", name: "Google Gemini" }
    ]
    return list
  })

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">Providers & Models</h2>
      </div>

      <div class="settings-v2-tab-body settings-v2-providers">
        
        {/* --- Default Model Selection --- */}
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Default Model</h3>
          <SettingsListV2>
            <SettingsRowV2
              title="Default Session Model"
              description="Choose the default LLM model for your chat sessions."
            >
              <Show
                when={connectedModels().length > 0}
                fallback={<div class="text-sm text-text-weak">Connect a provider to choose a model.</div>}
              >
                <SelectV2
                  appearance="inline"
                  options={connectedModels()}
                  current={currentDefaultModel()}
                  value={(o) => o.id}
                  label={(o) => o.label}
                  onSelect={(option) => option && selectDefaultModel(option)}
                />
              </Show>
            </SettingsRowV2>
          </SettingsListV2>
        </div>

        {/* --- Local Ollama Option --- */}
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Local Models</h3>
          <SettingsListV2>
            <SettingsRowV2
              title="Use Local Ollama Model"
              description="Connect to your local Ollama instance running at http://localhost:11434"
            >
              <Switch
                checked={isOllamaEnabled()}
                onChange={toggleOllama}
                hideLabel
              >
                Use Local Ollama
              </Switch>
            </SettingsRowV2>
          </SettingsListV2>
        </div>

        {/* --- Connected and Popular Providers --- */}
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">AI Providers</h3>
          <SettingsListV2>
            <For each={displayProviders()}>
              {(item) => {
                const isConnected = () => connectedIDs().has(item.id)
                return (
                  <div class="settings-v2-provider-row group flex flex-col gap-2 p-4 border border-border-color rounded-lg bg-card-bg">
                    <div class="flex items-center justify-between w-full">
                      <div class="settings-v2-provider-lead flex items-center gap-2">
                        <ProviderIcon
                          id={item.id}
                          width={PROVIDER_ICON_SIZE}
                          height={PROVIDER_ICON_SIZE}
                          class="settings-v2-provider-icon shrink-0"
                        />
                        <div class="flex flex-col">
                          <span class="settings-v2-provider-name font-medium">{item.name}</span>
                          <Show when={item.note}>
                            <span class="text-xs text-text-secondary mt-0.5">{item.note}</span>
                          </Show>
                        </div>
                      </div>
                      <Show when={isConnected()}>
                        <ButtonV2 size="normal" variant="ghost-muted" onClick={() => void disconnectProvider(item.id, item.name)}>
                          Disconnect
                        </ButtonV2>
                      </Show>
                    </div>

                    <Show when={!isConnected()}>
                      <div class="flex items-center gap-2 w-full mt-2">
                        <TextInputV2
                          type="password"
                          placeholder="Paste API Key..."
                          class="flex-1"
                          value={keys()[item.id] ?? ""}
                          onInput={(e) => setKeys(prev => ({ ...prev, [item.id]: e.currentTarget.value }))}
                        />
                        <ButtonV2 size="normal" variant="neutral" onClick={() => void connectProvider(item.id, item.name)}>
                          Connect
                        </ButtonV2>
                      </div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </SettingsListV2>
        </div>

      </div>
    </>
  )
}

