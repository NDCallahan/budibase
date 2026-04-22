<script lang="ts">
  import { onMount, setContext, getContext } from "svelte"
  import { writable, derived } from "svelte/store"
  import { Icon } from "@budibase/bbui"
  import { componentStore, selectedScreen } from "@/stores/builder"
  import type { Writable } from "svelte/store"

  const STORAGE_KEY = "design-properties-panel-pinned"

  let pinned = true
  let hovered = false
  let manuallyClosed = false
  let lastComponentId: string | undefined

  const pinnedStore = writable(true)
  $: pinnedStore.set(pinned)

  // Read shared detached window state from _layout.svelte
  const detachedPanels = getContext<Writable<Set<string>>>("detachedPanels")
  const popInDetachedPanel = getContext<(panel: string) => void>(
    "popInDetachedPanel"
  )

  $: propertiesIsPopped = detachedPanels ? $detachedPanels.has("properties") : false

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

  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      pinned = saved === "true"
    }
  })

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

  setContext("togglePropertiesPanel", toggle)
  setContext("propertiesPanelPinned", pinnedStore)
  setContext(
    "isPanelPopped",
    detachedPanels ? derived(detachedPanels, p => p.has("properties")) : writable(false)
  )
  setContext("popInPanel", popIn)
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
    class:hidden={open || isPopped}
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
  <div class="panel" class:open={open && !isPopped}>
    <div class="content">
      <slot />
    </div>
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
    align-items: stretch;
    height: 100%;
    width: 0;
    background: var(--background);
    transition: width 160ms cubic-bezier(0.22, 1, 0.36, 1);
    overflow: hidden;
  }
  .panel.open {
    width: 310px;
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
    font-size: 11px;
    font-weight: 500;
    color: var(--spectrum-global-color-gray-700);
    white-space: nowrap;
    letter-spacing: 0.5px;
    margin-top: 6px;
  }
  .content {
    flex: 1 1 auto;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-width: 0;
  }

  /* Mirror the reopen icon horizontally. */
  .icon-rotated {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: scaleX(-1);
  }
</style>
