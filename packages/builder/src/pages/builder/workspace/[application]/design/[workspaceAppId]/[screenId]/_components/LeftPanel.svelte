<script lang="ts">
  import ScreenList from "./ScreenList/index.svelte"
  import ComponentList from "./ComponentList/index.svelte"
  import { ActionButton } from "@budibase/bbui"
  import StatePanel from "./StatePanel.svelte"
  import BindingsPanel from "./BindingsPanel.svelte"
  import ComponentKeyHandler from "./ComponentKeyHandler.svelte"

  const Tabs = {
    Components: "Components",
    Bindings: "Bindings",
    State: "State",
  }

  let activeTab = Tabs.Components
</script>

<div class="panel">
  <div class="content">
    <ScreenList />
    <div class="tabs">
      {#each Object.values(Tabs) as tab}
        <ActionButton
          quiet
          selected={activeTab === tab}
          on:click={() => (activeTab = tab)}
        >
          <div class="tab-label">
            {tab}
          </div>
        </ActionButton>
      {/each}
    </div>
    {#if activeTab === Tabs.Components}
      <ComponentList />
    {:else if activeTab === Tabs.Bindings}
      <BindingsPanel />
    {:else if activeTab === Tabs.State}
      <div class="tab-content"><StatePanel /></div>
    {/if}
  </div>
</div>
<ComponentKeyHandler />

<style>
  .panel {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
  }

  .content {
    overflow: hidden;
    flex-grow: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--background);
    position: relative;
  }

  .tabs {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding: var(--spacing-m) var(--spacing-l);
    border-bottom: var(--border-light);
  }
  .tab-content {
    flex: 1 1 auto;
    height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--spacing-l);
  }
  .tab-label {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
