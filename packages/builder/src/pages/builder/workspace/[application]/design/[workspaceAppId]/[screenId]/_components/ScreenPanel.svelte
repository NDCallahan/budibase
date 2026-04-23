<script lang="ts">
  import { onDestroy, setContext, getContext } from "svelte"
  import { writable } from "svelte/store"
  import { Icon } from "@budibase/bbui"
  import { builderStore } from "@/stores/builder"
  import type { Writable } from "svelte/store"
  import ResizablePanel from "@/components/common/ResizablePanel.svelte"

  const STORAGE_KEY = "design-screens-panel-pinned"
  const PANEL_WIDTH_KEY = "design-screens-panel-width"
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
    return Number.isFinite(parsed) ? parsed : 310
  })()

  const pinnedStore = writable(true)
  $: pinnedStore.set(pinned)

  // Read shared detached state from _layout.svelte
  const detachedPanels = getContext<Writable<Set<string>>>("detachedPanels")
  $: screensIsPopped = detachedPanels ? $detachedPanels.has("screens") : false

  $: open = pinned || hovered
  $: showPanel = open && !screensIsPopped
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

  const handleResizeStart = () => {}

  const toggle = () => {
    pinned = !pinned
    localStorage.setItem(STORAGE_KEY, pinned.toString())
  }

  setContext("toggleScreenPanel", toggle)
  setContext("screenPanelPinned", pinnedStore)

  onDestroy(() => {
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
    class:hidden={showPanel || isClosing || screensIsPopped}
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
    <span class="reopen-label">Screens</span>
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
      defaultWidth={310}
      minWidth={260}
      maxWidthRatio={0.4}
      position="left"
      onResizeStart={handleResizeStart}
      onWidthChange={w => (panelWidth = w)}
      isResizing={$builderStore.isResizingPanel}
      isOpen={showPanel}
    >
      <slot />
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
  .panel {
    display: flex;
    flex-direction: row;
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
    max-width: var(--open-width, 310px);
    border-right: 1px solid var(--spectrum-global-color-gray-200);
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
    border-right: 1px solid var(--spectrum-global-color-gray-200);
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
    opacity: 0;
    pointer-events: none;
    transition: none;
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
  /* Mirror the reopen icon horizontally and rotate for vertical layout. */
  .icon-rotated {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: scaleX(-1) rotate(180deg);
  }
</style>
