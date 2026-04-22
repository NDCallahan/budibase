<script lang="ts">
  import { onMount, setContext, getContext } from "svelte"
  import { writable } from "svelte/store"
  import { Icon } from "@budibase/bbui"
  import type { Writable } from "svelte/store"

  const STORAGE_KEY = "design-screens-panel-pinned"

  let pinned = true
  let hovered = false

  const pinnedStore = writable(true)
  $: pinnedStore.set(pinned)

  // Read shared detached state from _layout.svelte
  const detachedPanels = getContext<Writable<Set<string>>>("detachedPanels")
  $: screensIsPopped = detachedPanels ? $detachedPanels.has("screens") : false

  $: open = pinned || hovered

  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      pinned = saved === "true"
    }
  })

  const toggle = () => {
    pinned = !pinned
    localStorage.setItem(STORAGE_KEY, pinned.toString())
  }

  setContext("toggleScreenPanel", toggle)
  setContext("screenPanelPinned", pinnedStore)
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
  <div class="panel" class:open={open && !screensIsPopped}>
    <div class="content">
      <slot />
    </div>
  </div>
  <button
    class="reopen-btn"
    class:hidden={open || screensIsPopped}
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
