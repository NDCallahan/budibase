<script lang="ts">
  import { onMount, onDestroy, setContext } from "svelte"
  import { writable, get } from "svelte/store"
  import {
    selectedScreen,
    componentStore,
    screenStore,
    appStore,
    workspaceAppStore,
    initialise,
    reset,
  } from "@/stores/builder"
  import { API } from "@/api"
  import ComponentSettingsPanel from "../[application]/design/[workspaceAppId]/[screenId]/[componentId]/_components/Component/ComponentSettingsPanel.svelte"
  import ScreenSettingsPanel from "../[application]/design/[workspaceAppId]/[screenId]/[componentId]/_components/Screen/index.svelte"
  import NavigationPanel from "../[application]/design/[workspaceAppId]/[screenId]/[componentId]/_components/Navigation/index.svelte"
  import LeftPanel from "../[application]/design/[workspaceAppId]/[screenId]/_components/LeftPanel.svelte"
  import NewComponentPanel from "../[application]/design/[workspaceAppId]/[screenId]/[componentId]/new/_components/NewComponentPanel.svelte"
  import ResizablePanel from "@/components/common/ResizablePanel.svelte"
  import { notifyParent } from "@/helpers/detachedPanelBridge"
  import { Icon } from "@budibase/bbui"

  let activePanels = new Set<string>()
  const detachedPanelsStore = writable<Set<string>>(activePanels)

  // Shared detached panel contexts (required by ScreenList and PropertiesPanel children)
  setContext("detachedPanels", detachedPanelsStore)
  setContext("popOutDetachedPanel", (_panelName: string) => {})
  setContext("popInDetachedPanel", (panelName: string) => {
    activePanels.delete(panelName)
    detachedPanelsStore.set(new Set(activePanels))
    notifyParent({ type: "PANEL_POPPED_IN", panel: panelName })
    if (activePanels.size === 0) {
      window.close()
    }
  })

  // Properties panel contexts
  setContext("togglePropertiesPanel", () => {})
  setContext("propertiesPanelPinned", writable(true))
  setContext("isPanelPopped", writable(true))
  setContext("popInPanel", () => {
    activePanels.delete("properties")
    detachedPanelsStore.set(new Set(activePanels))
    notifyParent({ type: "PANEL_POPPED_IN", panel: "properties" })
    if (activePanels.size === 0) {
      window.close()
    }
  })

  // Screen panel contexts
  setContext("toggleScreenPanel", () => {})
  setContext("screenPanelPinned", writable(true))

  let componentId: string | undefined
  let isInitializing = true
  let initError: string | null = null
  let messageHandler: ((_e: MessageEvent) => void) | null = null
  let resizeHandler: (() => void) | null = null
  let storageHandler: ((e: StorageEvent) => void) | null = null
  let toggleAddComponentHandler: (() => void) | null = null
  let screenUnsubscribe: (() => void) | null = null
  let componentUnsubscribe: (() => void) | null = null
  let isFirstScreenSync = true
  let suppressOutgoingComponentNotify = false
  let windowWidth = window.innerWidth
  let showAddComponentPanel = false
  let propertiesPaneWidth = 0

  onMount(async () => {
    const params = new URLSearchParams(window.location.search)
    const appId = params.get("appId")
    const urlComponentId = params.get("componentId")
    const urlScreenId = params.get("screenId")
    const urlWorkspaceAppId = params.get("workspaceAppId")
    const panelsParam = params.get("panels")

    if (panelsParam) {
      activePanels = new Set(panelsParam.split(",").filter(Boolean))
      detachedPanelsStore.set(new Set(activePanels))
    }

    if (!appId) {
      initError = "No app ID provided"
      isInitializing = false
      return
    }

    try {
      reset()
      appStore.update(state => ({ ...state, appId }))
      const pkg = await API.fetchAppPackage(appId)
      await initialise(pkg)

      if (urlWorkspaceAppId) {
        workspaceAppStore.select(urlWorkspaceAppId)
      }
      if (urlScreenId) {
        screenStore.select(urlScreenId)
      }
      if (urlComponentId) {
        componentId = urlComponentId
        // Programmatic initial selection: suppress outgoing notify to avoid
        // immediately echoing this selection back to the parent during init.
        suppressOutgoingComponentNotify = true
        componentStore.select(urlComponentId)
      }

      // Relay screen selections back to the parent window
      // Skip the first emission (initial sync from URL) to avoid a loop
      screenUnsubscribe = screenStore.subscribe(state => {
        if (isFirstScreenSync) {
          isFirstScreenSync = false
          return
        }
        if (state.selectedScreenId && window.opener && !window.opener.closed) {
          notifyParent({
            type: "SELECT_SCREEN",
            screenId: state.selectedScreenId,
          })
        }
      })

      // Relay component selections back to the parent window
      // Use a suppress flag to avoid echoing programmatic updates that came from the parent
      componentUnsubscribe = componentStore.subscribe(state => {
        if (suppressOutgoingComponentNotify) {
          suppressOutgoingComponentNotify = false
          return
        }
        if (
          state.selectedComponentId &&
          window.opener &&
          !window.opener.closed
        ) {
          notifyParent({
            type: "SELECT_COMPONENT",
            componentId: state.selectedComponentId,
            screenId: get(selectedScreen)?._id,
          })
        }
      })

      messageHandler = (e: MessageEvent) => {
        if (e.origin !== window.location.origin) return
        const { type, componentId: msgCId, screenId: msgSId, panel } = e.data
        if (type === "SYNC_COMPONENT") {
          if (msgCId) {
            componentId = msgCId
            // Prevent echoing this programmatic update back to the parent
            suppressOutgoingComponentNotify = true
            componentStore.select(msgCId)

            // If the incoming component is not a screen and the properties panel
            // is not currently active in this detached window, enable it so the
            // user can see properties even when only one panel was previously popped out.
            const relevantScreenId = msgSId || componentId?.split("-")[0]
            const isScreenComp =
              componentId === `${relevantScreenId}-screen` ||
              componentId === `${relevantScreenId}-screen-explicit`
            const isNavigationComp =
              componentId === `${relevantScreenId}-navigation`
            if (
              !isScreenComp &&
              !isNavigationComp &&
              !activePanels.has("properties")
            ) {
              activePanels.add("properties")
              detachedPanelsStore.set(new Set(activePanels))
            }
            // Also if it's a navigation component, ensure properties panel is shown
            if (isNavigationComp && !activePanels.has("properties")) {
              activePanels.add("properties")
              detachedPanelsStore.set(new Set(activePanels))
            }
          }
          if (msgSId) {
            screenStore.select(msgSId)
          }
        } else if (type === "ADD_PANEL") {
          activePanels.add(panel)
          detachedPanelsStore.set(new Set(activePanels))
        } else if (type === "REMOVE_PANEL") {
          activePanels.delete(panel)
          detachedPanelsStore.set(new Set(activePanels))
          if (activePanels.size === 0) {
            window.close()
          }
        }
      }
      window.addEventListener("message", messageHandler)

      resizeHandler = () => {
        windowWidth = window.innerWidth
      }
      window.addEventListener("resize", resizeHandler)

      if (window.opener && !window.opener.closed) {
        // Inform the parent that this detached window is ready and report which panels
        // are active so the parent can update its UI only after the detached window
        // has fully initialized. This avoids layout jitter in the main window.
        notifyParent({
          type: "DETACHED_PANEL_READY",
          panels: Array.from(activePanels),
        })
      }

      // Apply any recent sync that might have been written by the parent (resilient fallback)
      try {
        const raw = localStorage.getItem("budibase.detached.sync")
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.componentId) {
            componentId = parsed.componentId
            // This selection originates from storage (parent wrote it). Suppress
            // outgoing notifications to avoid creating a message loop.
            suppressOutgoingComponentNotify = true
            componentStore.select(parsed.componentId)
            // If this payload indicates a component/navigation, ensure properties pane
            const relevantScreenId =
              parsed.screenId || componentId?.split("-")[0]
            const isScreenComp =
              componentId === `${relevantScreenId}-screen` ||
              componentId === `${relevantScreenId}-screen-explicit`
            const isNavigationComp =
              componentId === `${relevantScreenId}-navigation`
            if (
              !isScreenComp &&
              !isNavigationComp &&
              !activePanels.has("properties")
            ) {
              activePanels.add("properties")
              detachedPanelsStore.set(new Set(activePanels))
            }
            if (isNavigationComp && !activePanels.has("properties")) {
              activePanels.add("properties")
              detachedPanelsStore.set(new Set(activePanels))
            }
          }
          if (parsed.screenId) {
            screenStore.select(parsed.screenId)
          }
        }
      } catch (err) {
        // ignore parse errors
      }

      // Listen for cross-window storage updates as a robust fallback
      storageHandler = (ev: StorageEvent) => {
        if (ev.key !== "budibase.detached.sync" || !ev.newValue) return
        try {
          const parsed = JSON.parse(ev.newValue)
          if (parsed.componentId) {
            componentId = parsed.componentId
            // Selection triggered by another window; suppress outgoing notify
            // to avoid immediate echoing back to the origin.
            suppressOutgoingComponentNotify = true
            componentStore.select(parsed.componentId)
            const relevantScreenId =
              parsed.screenId || componentId?.split("-")[0]
            const isScreenComp =
              componentId === `${relevantScreenId}-screen` ||
              componentId === `${relevantScreenId}-screen-explicit`
            const isNavigationComp =
              componentId === `${relevantScreenId}-navigation`
            if (
              !isScreenComp &&
              !isNavigationComp &&
              !activePanels.has("properties")
            ) {
              activePanels.add("properties")
              detachedPanelsStore.set(new Set(activePanels))
            }
            if (isNavigationComp && !activePanels.has("properties")) {
              activePanels.add("properties")
              detachedPanelsStore.set(new Set(activePanels))
            }
          }
          if (parsed.screenId) {
            screenStore.select(parsed.screenId)
          }
        } catch (err) {
          // ignore
        }
      }
      window.addEventListener("storage", storageHandler)

      toggleAddComponentHandler = () => {
        toggleAddComponent()
      }
      window.addEventListener(
        "toggle-detached-add-component",
        toggleAddComponentHandler
      )

      isInitializing = false
    } catch (error: any) {
      console.error("Detached panel init error:", error)
      initError = error?.message || "Unknown error"
      isInitializing = false
    }
  })

  onDestroy(() => {
    if (messageHandler) {
      window.removeEventListener("message", messageHandler)
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler)
    }
    if (storageHandler) {
      window.removeEventListener("storage", storageHandler)
    }
    if (toggleAddComponentHandler) {
      window.removeEventListener(
        "toggle-detached-add-component",
        toggleAddComponentHandler
      )
    }
    if (screenUnsubscribe) {
      screenUnsubscribe()
    }
    if (componentUnsubscribe) {
      componentUnsubscribe()
    }
    if (window.opener && !window.opener.closed) {
      notifyParent({ type: "DETACHED_PANEL_CLOSED" })
    }
  })

  $: screenId = $selectedScreen?._id
  $: isScreenPanel =
    componentId === `${screenId}-screen` ||
    componentId === `${screenId}-screen-explicit`
  $: isNavigationPanel = componentId === `${screenId}-navigation`
  $: isComponentPanel = !isScreenPanel && !isNavigationPanel && !!componentId
  $: showScreensPanel = $detachedPanelsStore.has("screens")
  $: showPropertiesPanel = $detachedPanelsStore.has("properties")
  $: showComponentsPanel = $detachedPanelsStore.has("components")

  $: showLeftPanel = showScreensPanel || showComponentsPanel
  $: leftPanelMaxWidth = showPropertiesPanel ? windowWidth - 240 : undefined

  const toggleAddComponent = () => {
    showAddComponentPanel = !showAddComponentPanel
  }

  const observePropertiesPane = (node: HTMLDivElement) => {
    const updateWidth = () => {
      const width = Math.round(node.getBoundingClientRect().width)
      if (Number.isFinite(width) && width > 0) {
        propertiesPaneWidth = width
      }
    }

    updateWidth()

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateWidth()
      })

      observer.observe(node)

      return {
        destroy() {
          observer.disconnect()
        },
      }
    }

    return {
      destroy() {},
    }
  }
</script>

<div class="detached-properties">
  {#if isInitializing}
    <div class="state-message">Loading...</div>
  {:else if initError}
    <div class="state-message error">{initError}</div>
  {:else}
    {#if showLeftPanel}
      <div class="screens-pane" class:solo={!showPropertiesPanel}>
        <ResizablePanel
          storageKey="detached-screens-panel-width"
          defaultWidth={310}
          minWidth={260}
          maxWidth={leftPanelMaxWidth}
          position="left"
        >
          <LeftPanel />
        </ResizablePanel>
      </div>
    {/if}
    {#if showPropertiesPanel}
      <div class="properties-pane" use:observePropertiesPane>
        {#if isScreenPanel}
          <ScreenSettingsPanel />
        {:else if isNavigationPanel}
          <NavigationPanel />
        {:else if isComponentPanel}
          <ComponentSettingsPanel />
        {:else}
          <div class="state-message">
            Select a component in the main builder to view its properties here.
          </div>
        {/if}
        <button
          class="add-component"
          class:open={showAddComponentPanel}
          title="Add component (Cmd/Ctrl + Enter)"
          aria-label="Add component"
          on:click={toggleAddComponent}
        >
          <Icon size="XL" name="plus" />
        </button>
        {#if showAddComponentPanel}
          <NewComponentPanel
            onClose={() => (showAddComponentPanel = false)}
            panelWidthOverride={propertiesPaneWidth || undefined}
          />
        {/if}
      </div>
    {/if}
    {#if !showLeftPanel && !showPropertiesPanel}
      <div class="state-message">
        Select a component in the main builder to view its properties here.
      </div>
    {/if}
  {/if}
</div>

<style>
  .detached-properties {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    background: var(--background);
  }
  .screens-pane {
    display: flex;
    flex-direction: row;
    overflow: visible;
    height: 100%;
    flex-shrink: 0;
  }
  .screens-pane.solo {
    flex: 1 1 auto;
  }
  .screens-pane.solo :global(.resizable-panel) {
    flex: 1 1 auto;
    width: 100% !important;
  }
  .properties-pane {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    overflow: hidden;
    min-width: 240px;
  }
  .properties-pane :global(.panel) {
    flex: 1 1 auto;
    width: 100%;
    min-width: unset;
  }

  .add-component {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 0;
    background: var(--spectrum-global-color-blue-500);
    display: grid;
    place-items: center;
    color: white;
    box-shadow: 1px 3px 8px 0 rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition:
      transform ease-out 300ms,
      background ease-out 130ms;
    z-index: 10;
  }

  .add-component:hover {
    background: var(--spectrum-global-color-blue-600);
  }

  .add-component:active {
    transform: scale(0.97);
  }

  .add-component.open {
    transform: rotate(45deg);
  }

  .add-component.open:active {
    transform: rotate(45deg) scale(0.97);
  }

  .state-message {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 24px;
    text-align: center;
    color: var(--spectrum-global-color-gray-600);
    font-size: 13px;
  }

  .state-message.error {
    color: var(--spectrum-red-700);
  }
</style>
