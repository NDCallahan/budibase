<script lang="ts">
  import AppPanel from "./_components/AppPanel.svelte"
  import * as routify from "@roxi/routify"
  import { syncURLToState } from "@/helpers/urlStateSync"
  import {
    screenStore,
    selectedScreen,
    workspaceAppStore,
    builderStore,
    componentStore,
    appStore,
  } from "@/stores/builder"
  import { onDestroy, onMount, setContext } from "svelte"
  import { writable, get } from "svelte/store"
  import { notifyDetachedPanel } from "@/helpers/detachedPanelBridge"
  import LeftPanel from "./_components/LeftPanel.svelte"
  import ScreenPanel from "./_components/ScreenPanel.svelte"
  import PropertiesPanel from "./_components/PropertiesPanel.svelte"
  import TopBar from "@/components/common/TopBar.svelte"

  // Extract stores from namespace for Svelte 5 compatibility
  const { goto, params, url, redirect, isActive, page, layout } = routify

  $goto
  $params
  $url
  $redirect
  $isActive
  $page
  $layout

  // Keep URL and state in sync for selected screen ID
  const stopSyncing = syncURLToState({
    urlParam: "screenId",
    stateKey: "selectedScreenId",
    validate: (id: string) =>
      $screenStore.screens.some(screen => screen._id === id),
    fallbackUrl: () => {
      const workspaceAppScreens = $screenStore.screens.filter(
        s => s.workspaceAppId === $workspaceAppStore.selectedWorkspaceApp?._id
      )
      // Fall back to the first screen if one exists
      if (workspaceAppScreens.length) {
        return `../${workspaceAppScreens[0]._id}`
      }

      return "../new"
    },
    routify,
    update: screenStore.select,
    store: screenStore,
  })

  // Shared detached window management
  const DETACHED_WINDOW_TARGET = "budibase-detached-panels"
  const detachedWindowStore = writable<Window | null>(null)
  const detachedPanelsStore = writable<Set<string>>(new Set())

  const handleDetachedMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return
    if (e.data.type === "DETACHED_PANEL_READY") {
      const newWindow = e.source as Window
      detachedWindowStore.set(newWindow)
      // If the detached window reports which panels it has active, use that
      // to update the main UI state only after the detached window is ready.
      if (Array.isArray(e.data.panels)) {
        detachedPanelsStore.set(new Set(e.data.panels))
      }
      // Send initial sync after window is ready to catch any component changes that happened during init
      const payload = {
        type: "SYNC_COMPONENT",
        componentId: get(componentStore).selectedComponentId,
        screenId: get(selectedScreen)?._id,
      }
      notifyDetachedPanel(newWindow, payload)
      // Also write to localStorage as a resilient fallback for detached windows that miss postMessage
      try {
        localStorage.setItem(
          "budibase.detached.sync",
          JSON.stringify({
            componentId: payload.componentId,
            screenId: payload.screenId,
            ts: Date.now(),
          })
        )
      } catch (err) {
        // ignore storage errors
      }
    } else if (e.data.type === "DETACHED_PANEL_CLOSED") {
      detachedWindowStore.set(null)
      detachedPanelsStore.set(new Set())
    } else if (e.data.type === "PANEL_POPPED_IN") {
      detachedPanelsStore.update(s => {
        const next = new Set(s)
        next.delete(e.data.panel)
        return next
      })
    } else if (e.data.type === "SELECT_SCREEN") {
      screenStore.select(e.data.screenId)
    } else if (e.data.type === "SELECT_COMPONENT") {
      if (e.data.screenId) {
        screenStore.select(e.data.screenId)
      }
      if (e.data.componentId) {
        componentStore.select(e.data.componentId)
      }
    }
  }

  onMount(() => {
    window.addEventListener("message", handleDetachedMessage)
  })

  // Sync component/screen selection to detached window
  $: if ($detachedWindowStore && !$detachedWindowStore.closed) {
    const payload = {
      type: "SYNC_COMPONENT",
      componentId: $componentStore.selectedComponentId,
      screenId: $selectedScreen?._id,
    }

    notifyDetachedPanel($detachedWindowStore, payload)
    try {
      localStorage.setItem(
        "budibase.detached.sync",
        JSON.stringify({
          componentId: payload.componentId,
          screenId: payload.screenId,
          ts: Date.now(),
        })
      )
    } catch (err) {
      // ignore storage errors
    }
  }

  const popOutDetachedPanel = (panelName: string) => {
    const currentDetachedWindow = get(detachedWindowStore)
    if (currentDetachedWindow && !currentDetachedWindow.closed) {
      currentDetachedWindow.focus() // <-- bring window to front if already open
      notifyDetachedPanel(currentDetachedWindow, {
        type: "ADD_PANEL",
        panel: panelName,
      })
      // Immediately sync current selection to the detached window when adding a panel
      const payload = {
        type: "SYNC_COMPONENT",
        componentId: get(componentStore).selectedComponentId,
        screenId: get(selectedScreen)?._id,
      }
      notifyDetachedPanel(currentDetachedWindow, payload)
      try {
        localStorage.setItem(
          "budibase.detached.sync",
          JSON.stringify({
            componentId: payload.componentId,
            screenId: payload.screenId,
            ts: Date.now(),
          })
        )
      } catch (err) {
        // ignore
      }
      // Update known detached panels immediately when the detached window already exists
      detachedPanelsStore.update(s => new Set([...s, panelName]))
    } else {
      const urlAppId = get(appStore).appId
      const urlWorkspaceAppId = get(workspaceAppStore).selectedWorkspaceApp?._id
      const urlComponentId = get(componentStore).selectedComponentId
      const urlScreenId = get(selectedScreen)?._id
      const currentPanels = get(detachedPanelsStore)
      const newPanels = new Set([...currentPanels, panelName])

      const params = new URLSearchParams()
      if (urlAppId) params.set("appId", urlAppId)
      if (urlComponentId) params.set("componentId", urlComponentId)
      if (urlScreenId) params.set("screenId", urlScreenId)
      if (urlWorkspaceAppId) params.set("workspaceAppId", urlWorkspaceAppId)
      params.set("panels", Array.from(newPanels).join(","))

      window.open(
        `/builder/workspace/detached-properties?${params}`,
        DETACHED_WINDOW_TARGET,
        `width=650,height=${screen.availHeight},top=0,resizable=yes,toolbar=no,menubar=no`
      )
    }
  }

  const popInDetachedPanel = (panelName: string) => {
    detachedPanelsStore.update(s => {
      const next = new Set(s)
      next.delete(panelName)
      return next
    })
    const currentDetachedWindow = get(detachedWindowStore)
    if (currentDetachedWindow && !currentDetachedWindow.closed) {
      const remaining = get(detachedPanelsStore)
      if (remaining.size === 0) {
        currentDetachedWindow.close()
        detachedWindowStore.set(null)
      } else {
        notifyDetachedPanel(currentDetachedWindow, {
          type: "REMOVE_PANEL",
          panel: panelName,
        })
      }
    }
  }

  setContext("detachedPanels", detachedPanelsStore)
  setContext("popOutDetachedPanel", popOutDetachedPanel)
  setContext("popInDetachedPanel", popInDetachedPanel)

  onDestroy(() => {
    window.removeEventListener("message", handleDetachedMessage)
    const currentDetachedWindow = get(detachedWindowStore)
    if (currentDetachedWindow && !currentDetachedWindow.closed) {
      currentDetachedWindow.close()
    }
    stopSyncing?.()
  })
</script>

{#if $selectedScreen}
  <div class="design" class:resizing-panel={$builderStore.isResizingPanel}>
    <TopBar
      breadcrumbs={[
        { text: "Apps", url: "../../" },
        { text: $workspaceAppStore.selectedWorkspaceApp?.name },
      ]}
      icon="browser"
    ></TopBar>
    <div class="content">
      <ScreenPanel>
        <LeftPanel />
      </ScreenPanel>
      <AppPanel />
      <PropertiesPanel>
        <slot />
      </PropertiesPanel>
    </div>
  </div>
{/if}

<style>
  .design {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
  }
  .content {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: stretch;
    flex: 1 1 auto;
    height: 0;
  }
  .design.resizing-panel {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
</style>
