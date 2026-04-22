<script lang="ts">
  import NavHeader from "@/components/common/NavHeader.svelte"
  import { getVerticalResizeActions } from "@/components/common/resizable"
  import { workspaceAppStore } from "@/stores/builder/workspaceApps"
  import { Layout, Icon, TooltipPosition, TooltipType } from "@budibase/bbui"
  import NewScreenModal from "../../../../_components/NewScreen/index.svelte"
  import type { Writable } from "svelte/store"
  import type { Screen } from "@budibase/types"
  import ScreenNavItem from "./ScreenNavItem.svelte"
  import { getContext } from "svelte"

  const toggleScreenPanel = getContext<() => void>("toggleScreenPanel")
  const screenPanelPinned = getContext<Writable<boolean>>("screenPanelPinned")
  $: collapseTooltip = $screenPanelPinned ? "Collapse panel" : "Pin panel"

  const detachedPanels = getContext<Writable<Set<string>>>("detachedPanels")
  const popOutDetachedPanel = getContext<(panel: string) => void>(
    "popOutDetachedPanel"
  )
  const popInDetachedPanel =
    getContext<(panel: string) => void>("popInDetachedPanel")
  $: screensIsPopped = detachedPanels ? $detachedPanels.has("screens") : false

  const [resizable, resizableHandle] = getVerticalResizeActions()

  let searching = false
  let searchValue = ""
  let screensContainer!: HTMLDivElement
  let scrolling = false
  let newScreenModal: NewScreenModal

  $: allScreens = $workspaceAppStore.selectedWorkspaceApp?.screens || []
  $: filteredScreens = getFilteredScreens(allScreens, searchValue)
  $: deletionAllowed = allScreens.length > 1

  $: workspaceAppId = $workspaceAppStore.selectedWorkspaceApp?._id || ""

  const handleOpenSearch = async () => {
    screensContainer.scroll({ top: 0, behavior: "smooth" })
  }

  $: {
    if (searching) {
      handleOpenSearch()
    }
  }

  const getFilteredScreens = (screens: Screen[], searchValue: string) => {
    return screens.filter(screen => {
      return !searchValue || screen.routing.route.includes(searchValue)
    })
  }

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement
    scrolling = target.scrollTop !== 0
  }
</script>

<div class="screens" class:searching use:resizable>
  <div class="header" class:scrolling>
    <NavHeader
      title="Screens"
      placeholder="Search for screens"
      bind:value={searchValue}
      bind:search={searching}
      onAdd={() => newScreenModal?.open?.()}
    >
      <div slot="right" class="header-actions">
        <button
          class="icon-btn"
          on:click={() =>
            screensIsPopped
              ? popInDetachedPanel?.("screens")
              : popOutDetachedPanel?.("screens")}
          title={screensIsPopped
            ? "Pop back into panel"
            : "Pop out to new window"}
        >
          <Icon
            name={screensIsPopped ? "arrow-square-in" : "arrow-square-out"}
            size="M"
            hoverable
            tooltip={screensIsPopped
              ? "Pop back into panel"
              : "Pop out to new window"}
            tooltipPosition={TooltipPosition.Left}
            tooltipType={TooltipType.Info}
          />
        </button>
        <button class="collapse-btn" on:click={toggleScreenPanel}>
          <Icon
            name="sidebar-simple"
            size="M"
            hoverable
            tooltip={collapseTooltip}
            tooltipPosition={TooltipPosition.Left}
            tooltipType={TooltipType.Info}
          />
        </button>
      </div>
    </NavHeader>
  </div>
  <div on:scroll={handleScroll} bind:this={screensContainer} class="content">
    {#if filteredScreens?.length}
      {#each filteredScreens as screen (screen._id)}
        <ScreenNavItem {screen} {deletionAllowed} />
      {/each}
    {:else}
      <Layout paddingY="none" paddingX="L">
        <div class="no-results">
          There aren't any screens matching that route
        </div>
      </Layout>
    {/if}
  </div>

  <div
    role="separator"
    class="divider"
    class:disabled={searching}
    use:resizableHandle
  ></div>
</div>

<NewScreenModal bind:this={newScreenModal} {workspaceAppId} />

<style>
  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }
  .icon-btn,
  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    color: var(--spectrum-global-color-gray-700);
    padding: 0;
    margin: 0;
    line-height: 1;
    vertical-align: middle;
    transition: background 130ms ease-out;
  }
  .icon-btn:hover,
  .collapse-btn:hover {
    background: var(--spectrum-global-color-gray-200);
  }
  .screens {
    display: flex;
    flex-direction: column;
    min-height: 240px;
    max-height: calc(100% - 320px);
    position: relative;
    transition:
      height 300ms ease-out,
      max-height 300ms ease-out;
    height: 210px;
  }
  .screens.searching {
    max-height: 100%;
    height: 100% !important;
  }

  .header {
    flex-shrink: 0;
    position: relative;
    height: 50px;
    box-sizing: border-box;
    padding: 0 var(--spacing-l);
    display: flex;
    align-items: center;
    border-bottom: 2px solid transparent;
    transition: border-bottom 130ms ease-out;
  }
  .header.scrolling {
    border-bottom: var(--border-light);
  }

  .content {
    overflow: auto;
    flex-grow: 1;
  }

  .screens :global(.nav-item) {
    padding-right: 8px !important;
  }

  .no-results {
    color: var(--spectrum-global-color-gray-600);
  }

  .divider {
    position: absolute;
    bottom: 0;
    transform: translateY(50%);
    height: 16px;
    width: 100%;
  }
  .divider:after {
    content: "";
    position: absolute;
    background: var(--spectrum-global-color-gray-200);
    height: 2px;
    width: 100%;
    top: 50%;
    transform: translateY(-50%);
    transition: background 130ms ease-out;
  }
  .divider:hover {
    cursor: row-resize;
  }
  .divider:hover:after {
    background: var(--spectrum-global-color-gray-300);
  }
  .divider.disabled {
    cursor: auto;
  }
  .divider.disabled:after {
    background: var(--spectrum-global-color-gray-200);
  }
</style>
