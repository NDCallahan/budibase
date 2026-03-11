<script>
  import { onMount, setContext } from "svelte"
  import { writable } from "svelte/store"
  import { Icon } from "@budibase/bbui"
  import { componentStore, selectedScreen } from "@/stores/builder"

  const STORAGE_KEY = "design-properties-panel-pinned"

  let pinned = true
  let hovered = false

  const pinnedStore = writable(true)
  $: pinnedStore.set(pinned)

<<<<<<< HEAD
  // Auto-open when a component is selected.
=======
  // Auto-open when a component is selected (excluding only the screen background)
  // Screen component has ID like "screenId-screen", but navigation "screenId-navigation" should open the panel
>>>>>>> da8465237c (feat: panel pin/collapse UX improvements and nginx custom config)
  $: active = !!(
    $componentStore.selectedComponentId &&
    $selectedScreen?._id &&
    $componentStore.selectedComponentId !== `${$selectedScreen._id}-screen`
  )

<<<<<<< HEAD
=======
  // Open when pinned, hovered, or a component is selected
>>>>>>> da8465237c (feat: panel pin/collapse UX improvements and nginx custom config)
  $: open = pinned || hovered || active

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

  setContext("togglePropertiesPanel", toggle)
  setContext("propertiesPanelPinned", pinnedStore)
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
    class:hidden={open}
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
  <div class="panel" class:open>
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
<<<<<<< HEAD

  /* Mirror the reopen icon horizontally. */
  .icon-rotated {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: scaleX(-1);
  }
=======
>>>>>>> da8465237c (feat: panel pin/collapse UX improvements and nginx custom config)
</style>
