<script lang="ts">
  import {
    ColorPicker,
    Icon,
    Label,
    ModalContent,
    Select,
    PhosphorIcons,
  } from "@budibase/bbui"
  import { createEventDispatcher } from "svelte"

  export let name: string
  export let color: string
  export let background: string = ""
  export let size: string = "XL"

  let iconSearch = ""
  let page = 1
  const pageSize = 66

  $: filteredIcons = iconSearch
    ? PhosphorIcons.filter(icon =>
        icon.toLowerCase().includes(iconSearch.toLowerCase())
      )
    : PhosphorIcons

  $: {
    filteredIcons
    page = 1
  }
  $: pageCount = Math.max(1, Math.ceil(filteredIcons.length / pageSize))
  $: currentPage = Math.min(page, pageCount)
  $: visibleIcons = filteredIcons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const sizeOptions = [
    { label: "Small", value: "S" },
    { label: "Medium", value: "M" },
    { label: "Large", value: "L" },
    { label: "Extra large", value: "XL" },
    { label: "2X large", value: "XXL" },
  ]

  const gradientOptions = [
    { label: "None", value: "" },
    { label: "Purple Haze", value: "linear-gradient(135deg, #667eea, #764ba2)" },
    { label: "Peach Sunset", value: "linear-gradient(135deg, #f6d365, #fda085)" },
    { label: "Emerald", value: "linear-gradient(135deg, #11998e, #38ef7d)" },
    { label: "Ocean Blue", value: "linear-gradient(135deg, #2193b0, #6dd5ed)" },
    { label: "Crimson Flame", value: "linear-gradient(135deg, #ee0979, #ff6a00)" },
    { label: "Golden Hour", value: "linear-gradient(135deg, #f7971e, #ffd200)" },
    { label: "Cosmic", value: "linear-gradient(135deg, #4776e6, #8e54e9)" },
    { label: "Teal Wave", value: "linear-gradient(135deg, #43b89c, #2c7ee0)" },
    { label: "Electric", value: "linear-gradient(135deg, #fc466b, #3f5efb)" },
    { label: "Midnight", value: "linear-gradient(135deg, #1a1a2e, #302b63)" },
  ]

  const dispatch = createEventDispatcher()

  const save = async () => {
    dispatch("change", { color, name, background, size })
    return
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<ModalContent title="Edit Icon" confirmText="Save" onConfirm={save} size="L">
  <div class="scrollable-icons">
    <div class="title-spacing">
      <Label>Select an icon</Label>
    </div>

    <div class="search-row">
      <input
        class="icon-search"
        type="text"
        placeholder="Search phosphor icons..."
        bind:value={iconSearch}
      />
      <button
        type="button"
        class="clear-btn"
        on:click={() => (iconSearch = "")}
      >
        Clear
      </button>
    </div>

    <div class="page-nav">
      <button
        type="button"
        class="nav-arrow"
        on:click={() => page--}
        disabled={currentPage === 1}
      >
        ←
      </button>
      <span
        >Page {currentPage} of {pageCount} ({filteredIcons.length} icons)</span
      >
      <button
        type="button"
        class="nav-arrow"
        on:click={() => page++}
        disabled={currentPage === pageCount}
      >
        →
      </button>
    </div>

    <div class="grid">
      {#each visibleIcons as item}
        <button
          type="button"
          class="icon-item"
          class:selected={item === name}
          on:click={() => (name = item)}
        >
          <Icon name={item} />
          <span class="icon-label">{item}</span>
        </button>
      {/each}
    </div>
  </div>
  <div class="color-selection">
    <div>
      <Label>Icon color</Label>
    </div>
    <div class="color-selection-item">
      <ColorPicker bind:value={color} on:change={e => (color = e.detail)} />
    </div>
  </div>
  <div class="color-selection">
    <div>
      <Label>Background color</Label>
    </div>
    <div class="color-selection-item">
      <ColorPicker
        bind:value={background}
        on:change={e => (background = e.detail)}
      />
    </div>
  </div>
  <div class="color-selection">
    <div>
      <Label>Background gradient</Label>
    </div>
    <div class="color-selection-item">
      <Select
        bind:value={background}
        options={gradientOptions}
        placeholder="Select a gradient..."
      />
    </div>
  </div>
  <div class="color-selection">
    <div>
      <Label>Icon size</Label>
    </div>
    <div class="color-selection-item">
      <Select bind:value={size} options={sizeOptions} />
    </div>
  </div>
</ModalContent>

<style>
  .search-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
  }

  .icon-search {
    flex: 1;
    background: var(--spectrum-alias-background-color-secondary);
    color: var(--spectrum-global-color-gray-800);
    border: 1px solid var(--spectrum-global-color-gray-300);
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 14px;
    box-sizing: border-box;
    outline: none;
  }
  .icon-search:focus {
    border-color: var(--spectrum-global-color-blue-500);
  }

  .clear-btn {
    flex-shrink: 0;
    padding: 7px 16px;
    border-radius: 20px;
    border: 1px solid var(--spectrum-global-color-gray-300);
    background: transparent;
    color: var(--spectrum-global-color-gray-700);
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
  }
  .clear-btn:hover {
    background: var(--spectrum-global-color-gray-100);
  }

  .page-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 13px;
    color: var(--spectrum-global-color-gray-700);
  }

  .nav-arrow {
    background: none;
    border: none;
    color: var(--spectrum-global-color-gray-700);
    font-size: 16px;
    cursor: pointer;
    padding: 0 6px;
    line-height: 1;
  }
  .nav-arrow:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    /* ↓ Adjust this value to change the visible height of the icon area */
    max-height: 240px;
    overflow-y: auto;
  }

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 8px 4px;
    border-radius: 8px;
    border: 1px solid var(--spectrum-global-color-gray-300);
    background: var(--spectrum-alias-background-color-primary);
    color: var(--spectrum-global-color-gray-800);
    cursor: pointer;
    transition: background-color 130ms ease-out;
  }
  .icon-item:hover {
    background: var(--spectrum-global-color-gray-100);
  }
  .icon-item.selected {
    border-color: var(--spectrum-global-color-blue-500);
    color: var(--spectrum-global-color-blue-600);
  }

  .icon-label {
    font-size: 11px;
    text-align: center;
    color: inherit;
    line-height: 1.2;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .color-selection {
    display: flex;
    align-items: center;
  }

  .color-selection-item {
    margin-left: 20px;
    flex: 1;
  }

  .title-spacing {
    margin-bottom: 10px;
  }

</style>
