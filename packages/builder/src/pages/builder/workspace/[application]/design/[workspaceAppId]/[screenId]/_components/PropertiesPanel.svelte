<script lang="ts">
  import { onDestroy, onMount, setContext, getContext } from "svelte"
  import { writable, derived } from "svelte/store"
  import { Icon } from "@budibase/bbui"
  import { componentStore, selectedScreen } from "@/stores/builder"
  import { builderStore } from "@/stores/builder"
  import type { Writable } from "svelte/store"
  import ResizablePanel from "@/components/common/ResizablePanel.svelte"

  const STORAGE_KEY = "design-properties-panel-pinned"
  const PANEL_WIDTH_KEY = "design-properties-panel-width"
  const DEFAULT_PANEL_WIDTH = 280
  const MIN_PANEL_WIDTH = 240
  const CLOSE_DURATION_MS = 320
  const OPEN_TRANSITION = "max-width 320ms ease-out"
  const CLOSE_TRANSITION = "max-width 320ms ease-in"

  let pinned = (() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved !== null ? saved === "true" : true
  })()
  let hovered = false
  let isClosing = false
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let previousShowPanel: boolean | undefined
  let panelWidth = (() => {
    const saved = localStorage.getItem(PANEL_WIDTH_KEY)
    const parsed = saved ? parseInt(saved, 10) : NaN
    return Number.isFinite(parsed) ? parsed : DEFAULT_PANEL_WIDTH
  })()
  let manuallyClosed = false
  let lastComponentId: string | undefined

  const pinnedStore = writable(true)
  $: pinnedStore.set(pinned)

  const panelWidthStore = writable(panelWidth)
  $: panelWidthStore.set(panelWidth)

  // Read shared detached window state from _layout.svelte
  const detachedPanels = getContext<Writable<Set<string>>>("detachedPanels")
  const popInDetachedPanel =
    getContext<(_panel: string) => void>("popInDetachedPanel")

  $: propertiesIsPopped = detachedPanels
    ? $detachedPanels.has("properties")
    : false

  // Auto-open when a component is selected, but respect manual close.
  $: active = !!(
    $componentStore.selectedComponentId &&
    $selectedScreen?._id &&
    $componentStore.selectedComponentId !== `${$selectedScreen._id}-screen`
  )

  // Clear manuallyClosed when the selected component changes
  $: if ($componentStore.selectedComponentId !== lastComponentId) {
    lastComponentId = $componentStore.selectedComponentId
    manuallyClosed = false
  }

  $: open = pinned || hovered || (active && !manuallyClosed)
  $: isPopped = propertiesIsPopped
  $: showPanel = open && !isPopped
  $: panelTransition = showPanel ? OPEN_TRANSITION : CLOSE_TRANSITION

  $: {
    if (previousShowPanel === undefined) {
      previousShowPanel = showPanel
      isClosing = false
    } else if (showPanel !== previousShowPanel) {
      previousShowPanel = showPanel
      if (showPanel) {
        isClosing = false
        if (closeTimer) {
          clearTimeout(closeTimer)
          closeTimer = undefined
        }
      } else {
        if (closeTimer) {
          clearTimeout(closeTimer)
        }
        isClosing = true
        closeTimer = setTimeout(() => {
          isClosing = false
          closeTimer = undefined
        }, CLOSE_DURATION_MS)
      }
    }
  }

  const toggle = () => {
    pinned = !pinned
    if (!pinned) {
      manuallyClosed = true
    } else {
      manuallyClosed = false
    }
    localStorage.setItem(STORAGE_KEY, pinned.toString())
  }

  const popIn = () => {
    popInDetachedPanel?.("properties")
  }

  const handleResizeStart = () => {}

  setContext("togglePropertiesPanel", toggle)
  setContext("propertiesPanelPinned", pinnedStore)
  setContext("propertiesPanelWidth", panelWidthStore)
  setContext(
    "isPanelPopped",
    detachedPanels
      ? derived(detachedPanels, p => p.has("properties"))
      : writable(false)
  )
  setContext("popInPanel", popIn)

  const ensureOpen = () => {
    if (!pinned) {
      pinned = true
      manuallyClosed = false
      localStorage.setItem(STORAGE_KEY, "true")
    }
  }

  onMount(() => {
    window.addEventListener("ensure-properties-panel-open", ensureOpen)
  })

  onDestroy(() => {
    window.removeEventListener("ensure-properties-panel-open", ensureOpen)
    if (closeTimer) {
      clearTimeout(closeTimer)
    }
  })
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="wrapper"
  on:mouseenter={() => {
    if (!pinned) hovered = true
  }}
  on:mouseleave={() => {
    hovered = false
  }}
>
  <button
    class="reopen-btn"
    class:hidden={showPanel || isClosing || isPopped}
    on:click={toggle}
    title="Pin panel open"
  >
    <span class="icon-rotated" aria-hidden="true">
      <Icon
        name="sidebar-simple"
        size="M"
        color="var(--spectrum-global-color-gray-700)"
      />
    </span>
    <span class="reopen-label">Component Properties</span>
  </button>
  <div
    class="panel"
    class:open={showPanel}
    class:resizing={$builderStore.isResizingPanel}
    class:pinned
    class:hovered={!pinned && hovered}
    style="--open-width: {panelWidth}px; --panel-transition: {panelTransition}"
  >
    <ResizablePanel
      storageKey={PANEL_WIDTH_KEY}
      defaultWidth={DEFAULT_PANEL_WIDTH}
      minWidth={MIN_PANEL_WIDTH}
      maxWidthRatio={0.4}
      position="right"
      onResizeStart={handleResizeStart}
      onWidthChange={w => (panelWidth = w)}
      isResizing={$builderStore.isResizingPanel}
      isOpen={showPanel}
    >
      <div class="content">
        <slot />
      </div>
    </ResizablePanel>
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    height: 100%;
  }
  /* Panel container: always mounted but clipped to 0 when closed.
     Use overflow: clip (not hidden) so it doesn't become a scroll container — 
     overflow: hidden locks the panel's layout size, preventing ResizablePanel
     from pushing the layout wider during drag. overflow: clip visually clips
     without affecting the layout sizing. */
  .panel {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    height: 100%;
    max-width: 0;
    background: var(--background);
    overflow: clip;
    transition: var(--panel-transition);
    will-change: max-width;
    contain: layout paint;
  }
  .panel:not(.pinned).hovered {
    transition: none;
  }
  .panel.resizing {
    transition: none;
  }
  .panel:has(.divider:hover),
  .panel:has(.divider-hitbox:hover) {
    transition: none;
  }
  .panel.resizing.open {
    max-width: none;
  }
  .panel.open {
    max-width: var(--open-width, 280px);
    border-left: 1px solid var(--spectrum-global-color-gray-200);
  }
  .reopen-btn {
    flex: 0 0 36px;
    width: 36px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 12px;
    border: none;
    border-left: 1px solid var(--spectrum-global-color-gray-200);
    background: var(--background-alt);
    cursor: pointer;
    color: var(--spectrum-global-color-gray-700);
    overflow: hidden;
    transition:
      flex 160ms cubic-bezier(0.22, 1, 0.36, 1),
      width 160ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .reopen-btn.hidden {
    flex: 0 0 0px;
    width: 0;
    padding: 0;
    border: none;
  }
  .reopen-btn:not(.hidden):hover {
    background: var(--spectrum-global-color-gray-200);
  }
  .reopen-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    font-size: 12px;
    font-weight: 500;
    color: var(--spectrum-global-color-gray-700);
    white-space: nowrap;
    letter-spacing: 1px;
    margin-top: 6px;
  }
  .content {
    flex: 1 1 auto;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-width: 0;
    position: relative;
  }
  /* Panel.svelte uses fixed flex: 0 0 310px / width: 310px (wide).
     Override to fill ResizablePanel's width instead of staying fixed. */
  .content :global(.panel) {
    flex: 1 1 auto !important;
    width: 100% !important;
    min-width: 0 !important;
  }

  /* Mirror the reopen icon horizontally. */
  .icon-rotated {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: scaleX(-1);
  }
</style>
