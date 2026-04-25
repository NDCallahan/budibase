<script>
  import Panel from "@/components/design/Panel.svelte"
  import { goto } from "@roxi/routify"
  import { Layout, Search, Icon, Body, notifications } from "@budibase/bbui"
  import { getComponentStructure } from "./componentStructure"
  import {
    previewStore,
    selectedScreen,
    componentStore,
    selectedComponent,
  } from "@/stores/builder"
  import { getContext, onMount } from "svelte"
  import { fly } from "svelte/transition"
  import { findComponentPath } from "@/helpers/components"
  import NewPill from "@/components/common/NewPill.svelte"
  import { featureFlags } from "@/stores/portal"

  $goto

  export let onClose = () => $goto("../")
  export let panelWidthOverride = undefined

  const isDetachedWindow =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/detached-properties")

  const PANEL_WIDTH_KEY = "design-properties-panel-width"
  const DEFAULT_PANEL_WIDTH = 280

  // In the main window NewComponentPanel is a slot descendant of PropertiesPanel,
  // so the live width is available from context and updates on every resize.
  // The detached window passes panelWidthOverride instead (measured via ResizeObserver).
  const propertiesPanelWidthStore = getContext("propertiesPanelWidth")

  const getFallbackWidth = () => {
    const saved = localStorage.getItem(PANEL_WIDTH_KEY)
    const parsed = saved ? parseInt(saved, 10) : NaN
    return Number.isFinite(parsed) ? parsed : DEFAULT_PANEL_WIDTH
  }

  $: panelWidth =
    panelWidthOverride !== undefined
      ? panelWidthOverride
      : propertiesPanelWidthStore
        ? $propertiesPanelWidthStore
        : getFallbackWidth()

  // Smallest possible 1x1 transparent GIF
  const ghost = new Image(1, 1)
  ghost.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="

  // Aliases for other strings to match to when searching
  const aliases = {
    text: ["headline", "heading", "title", "paragraph", "markdown"],
  }

  let searchString
  let searchRef
  let selectedIndex
  let componentList = []

  $: allowedComponents = getAllowedComponents(
    $componentStore.components,
    $selectedScreen,
    $selectedComponent
  )
  $: structure = getComponentStructure({
    chatbox: $featureFlags.AI_AGENTS && $featureFlags.AI_AGENTS,
  })
  $: enrichedStructure = enrichStructure(
    structure,
    $componentStore.components,
    $componentStore.customComponents
  )
  $: filteredStructure = filterStructure(
    enrichedStructure,
    allowedComponents,
    searchString
  )
  $: orderMap = createComponentOrderMap(componentList)

  const getAllowedComponents = (allComponents, screen, component) => {
    // Default to using the root screen container if no component specified
    if (!component) {
      component = screen.props
    }
    const path = findComponentPath(screen?.props, component?._id)
    if (!path?.length) {
      return []
    }

    // Get initial set of allowed components
    let allowedComponents = []
    const definition = componentStore.getDefinition(component?._component)
    if (definition?.legalDirectChildren?.length) {
      allowedComponents = definition.legalDirectChildren.map(x => {
        return `@budibase/standard-components/${x}`
      })
    } else {
      allowedComponents = Object.keys(allComponents)
    }

    // Build up list of illegal children from ancestors
    let illegalChildren = definition?.illegalChildren || []
    path.forEach(ancestor => {
      // Sidepanels and modals can be nested anywhere in the component tree, but really they are always rendered at the top level.
      // Because of this, it doesn't make sense to carry over any parent illegal children to them, so the array is reset here.
      if (
        [
          "@budibase/standard-components/sidepanel",
          "@budibase/standard-components/modal",
        ].includes(ancestor._component)
      ) {
        illegalChildren = []
      }
      const def = componentStore.getDefinition(ancestor._component)
      const blacklist = def?.illegalChildren?.map(x => {
        return `@budibase/standard-components/${x}`
      })
      illegalChildren = [...illegalChildren, ...(blacklist || [])]
    })
    illegalChildren = [...new Set(illegalChildren)]

    // Filter out illegal children from allowed components
    allowedComponents = allowedComponents.filter(x => {
      return !illegalChildren.includes(x)
    })

    return allowedComponents
  }

  // Creates a simple lookup map from an array, so we can find the selected
  // component much faster
  const createComponentOrderMap = list => {
    let map = {}
    list.forEach((component, idx) => {
      map[component] = idx
    })
    return map
  }

  // Parses the structure in the manifest and returns an enriched structure with
  // explicit categories
  const enrichStructure = (structure, definitions, customComponents) => {
    let enrichedStructure = []

    // Add custom components category
    if (customComponents?.length) {
      enrichedStructure.push({
        name: "Plugins",
        isCategory: true,
        children: customComponents
          .map(x => ({
            ...definitions[x],
            name: definitions[x].friendlyName || definitions[x].name,
          }))
          .sort((a, b) => {
            return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
          }),
      })
    }

    structure.forEach(item => {
      if (typeof item === "string") {
        const def = definitions[`@budibase/standard-components/${item}`]
        if (def) {
          enrichedStructure.push({
            ...def,
            isCategory: false,
          })
        }
      } else {
        enrichedStructure.push({
          ...item,
          isCategory: true,
          children: enrichStructure(item.children || [], definitions),
        })
      }
    })

    return enrichedStructure
  }

  const filterStructure = (structure, allowedComponents, search) => {
    if (!structure?.length) {
      return []
    }
    search = search?.toLowerCase()
    selectedIndex = search ? 0 : null
    componentList = []

    // Return only items which match the search string
    let filteredStructure = []
    structure.forEach(category => {
      let matchedChildren = category.children.filter(child => {
        const name = child.name.toLowerCase()

        // Check if the component matches the search string
        if (search) {
          const nameMatch = name.includes(search)
          const aliasMatch = (aliases[name] || []).some(x => x.includes(search))
          if (!nameMatch && !aliasMatch) {
            return false
          }
        }

        // Check if the component is allowed as a child
        return allowedComponents.includes(child.component)
      })
      if (matchedChildren.length) {
        filteredStructure.push({
          ...category,
          children: matchedChildren,
        })

        // Create a flat list of all components so that we can reference them by
        // order later
        componentList = componentList.concat(
          matchedChildren.map(x => x.component)
        )
      }
    })
    structure = filteredStructure
    return structure
  }

  const addComponent = async component => {
    try {
      await componentStore.create(component)
    } catch (error) {
      notifications.error(error || "Error creating component")
    }
  }

  const handleKeyDown = e => {
    if (e.key === "Tab" || e.key === "ArrowDown" || e.key === "ArrowUp") {
      // Cycle selected components on tab press
      if (selectedIndex == null) {
        selectedIndex = 0
      } else {
        const direction = e.key === "ArrowUp" ? -1 : 1
        selectedIndex = (selectedIndex + direction) % componentList.length
      }
      e.preventDefault()
      e.stopPropagation()
      return false
    } else if (e.key === "Enter") {
      // Add selected component on enter press
      if (componentList[selectedIndex]) {
        addComponent(componentList[selectedIndex])
      }
    }
  }

  onMount(() => {
    searchRef.focus()
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  })

  const onDragStart = (e, component) => {
    e.dataTransfer.setDragImage(ghost, 0, 0)
    previewStore.startDrag(component)
  }

  const onDragEnd = () => {
    previewStore.stopDrag()
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="container"
  class:detached={isDetachedWindow}
  class:embedded={!isDetachedWindow}
  style={isDetachedWindow ? `width: ${panelWidth}px` : undefined}
  transition:fly|local={{ x: panelWidth, duration: 300 }}
>
  <Panel
    title="Add component"
    showCloseButton
    onClickCloseButton={onClose}
    borderLeft
    customWidth={isDetachedWindow ? panelWidth : undefined}
  >
    <Layout paddingX="L" paddingY="XL" gap="S">
      <Search
        placeholder="Search"
        value={searchString}
        on:change={e => (searchString = e.detail)}
        bind:inputRef={searchRef}
      />
      {#if filteredStructure.length}
        {#each filteredStructure as category}
          <Layout noPadding gap="XS">
            <div class="category-label">{category.name}</div>
            {#each category.children as component}
              <div
                draggable="true"
                on:dragstart={e => onDragStart(e, component.component)}
                on:dragend={onDragEnd}
                class="component"
                class:selected={selectedIndex === orderMap[component.component]}
                on:click={() => addComponent(component.component)}
                on:mouseenter={() => (selectedIndex = null)}
              >
                <div class="icon-container">
                  <Icon
                    size="M"
                    color="var(--spectrum-global-color-static-gray-50)"
                    name={component.icon}
                  />
                </div>
                <div class="component-name">
                  <Body
                    size="S"
                    weight="500"
                    color="var(--spectrum-global-color-gray-900)"
                    >{component.name}</Body
                  >
                  {#if component.new}
                    <NewPill />
                  {/if}
                </div>
              </div>
            {/each}
          </Layout>
        {/each}
      {:else}
        <Body size="S">
          There aren't any components matching the current filter
        </Body>
      {/if}
    </Layout>
  </Panel>
</div>

<style>
  .container {
    right: 0;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: stretch;
  }
  .container.detached {
    position: fixed;
  }
  .container.embedded {
    position: absolute;
    top: 0;
    width: 100%;
  }
  .container :global(.panel) {
    width: 100%;
  }
  .container :global(.panel.borderLeft) {
    min-width: 100% !important;
    width: 100% !important;
    flex: 1 1 auto !important;
  }
  .category-label {
    color: var(--spectrum-global-color-gray-600);
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 600;
    margin-top: var(--spacing-xs);
  }
  .component {
    border: 0.5px solid var(--spectrum-global-color-gray-300);
    background: var(--spectrum-alias-background-color-secondary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    transition:
      background 130ms ease-out,
      border-color 130ms ease-out;
    flex-direction: row;
    justify-content: flex-start;
    padding: var(--spacing-s) var(--spacing-m);
    gap: var(--spacing-m);
    overflow: hidden;
  }
  .icon-container {
    background-color: #aa4321;
    border: 0.5px solid #c96442;
    padding: 4px;
    border-radius: 8px;
  }
  .component.selected {
    border-color: var(--spectrum-global-color-blue-400);
  }
  .component:hover {
    background: var(--spectrum-global-color-gray-200);
  }
  .component-name {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 4px;
  }
  .component :global(.spectrum-Body) {
    line-height: 1.2 !important;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
