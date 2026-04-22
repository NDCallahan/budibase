<script>
  import "@/components/design/settings/componentSettings"
  import Panel from "@/components/design/Panel.svelte"
  import {
    selectedScreen,
    componentStore,
    selectedComponent,
    workspaceAppStore,
    appStore,
  } from "@/stores/builder"
  import ComponentSettingsSection from "./ComponentSettingsSection.svelte"
  import DesignSection from "./DesignSection.svelte"
  import CustomStylesSection from "./CustomStylesSection.svelte"
  import ConditionalUISection from "./ConditionalUISection.svelte"
  import { getComponentName } from "@/helpers/components"
  import {
    getBindableProperties,
    getComponentBindableProperties,
  } from "@/dataBinding"
  import { ActionButton, notifications } from "@budibase/bbui"
  import { capitalise } from "@/helpers"
  import { builderStore } from "@/stores/builder"
  import { getContext } from "svelte"
  import { isDetachedPanel, notifyParent } from "@/helpers/detachedPanelBridge"

  const togglePropertiesPanel = getContext("togglePropertiesPanel")
  const propertiesPanelPinned = getContext("propertiesPanelPinned")
  const isPanelPopped = getContext("isPanelPopped")
  const popInPanel = getContext("popInPanel")
  const popOutDetachedPanel = getContext("popOutDetachedPanel")
  $: closeTooltip = $propertiesPanelPinned ? "Collapse panel" : "Pin panel"
  $: isPopped = !!isPanelPopped && !!$isPanelPopped

  const onUpdateName = async value => {
    try {
      await componentStore.updateSetting("_instanceName", value)
      // Notify parent window if we're in a detached panel
      if (isDetachedPanel()) {
        notifyParent({
          type: "COMPONENT_SETTING_UPDATED",
          componentId: $selectedComponent?._id,
          key: "_instanceName",
          value: value,
        })
      }
    } catch (error) {
      notifications.error("Error updating component name")
    }
  }

  const handlePopOut = () => {
    popOutDetachedPanel?.("properties")
  }

  $: componentInstance = $selectedComponent
  $: componentDefinition = componentStore.getDefinition(
    $selectedComponent?._component
  )
  $: bindings = getBindableProperties(
    $selectedScreen,
    $componentStore.selectedComponentId
  )

  $: componentBindings = getComponentBindableProperties(
    $selectedScreen,
    $componentStore.selectedComponentId
  )
  $: isScreen = $selectedComponent?._id === $selectedScreen?.props._id
  $: title = isScreen ? "Screen" : $selectedComponent?._instanceName

  let section = "settings"
  const tabs = ["settings", "styles", "conditions"]

  $: id = $selectedComponent?._id
  $: id, (section = tabs[0])
  $: componentName = getComponentName(componentInstance)

  $: highlightedSetting = $builderStore.highlightedSetting
  $: if (highlightedSetting) {
    if (highlightedSetting.key === "_conditions") {
      section = "conditions"
    } else if (highlightedSetting.key === "_styles") {
      section = "styles"
    } else {
      section = "settings"
    }
  }
</script>

{#if $selectedComponent}
  {#key $selectedComponent._id}
    <Panel
      {title}
      icon={componentDefinition?.icon}
      iconTooltip={componentName}
      borderLeft
      wide
      showCloseButton={!!togglePropertiesPanel}
      closeButtonIcon="sidebar-simple"
      closeButtonTooltip={closeTooltip}
      onClickCloseButton={togglePropertiesPanel}
      showPopOutButton={true}
      popOutButtonIcon={isPopped ? "arrow-square-in" : "arrow-square-out"}
      popOutButtonTooltip={isPopped
        ? "Pop back into panel"
        : "Pop out to new window"}
      onClickPopOutButton={isPopped ? popInPanel : handlePopOut}
    >
      <span class="panel-title-content" slot="panel-title-content">
        <input
          class="input"
          value={title}
          title={componentName}
          placeholder={componentName}
          on:keypress={e => {
            if (e.key.toLowerCase() === "enter") {
              e.target.blur()
            }
          }}
          on:change={e => {
            onUpdateName(e.target.value)
          }}
        />
      </span>
      <span slot="panel-header-content">
        <div class="settings-tabs">
          {#each tabs as tab}
            <ActionButton
              size="M"
              quiet
              selected={section === tab}
              on:click={() => {
                section = tab
              }}
            >
              {capitalise(tab)}
            </ActionButton>
          {/each}
        </div>
      </span>
      {#if section === "settings"}
        <ComponentSettingsSection
          {componentInstance}
          {componentDefinition}
          {bindings}
          {componentBindings}
          {isScreen}
        />
      {/if}
      {#if section === "styles"}
        <DesignSection
          {componentInstance}
          {componentBindings}
          {componentDefinition}
          {bindings}
        />
        <CustomStylesSection
          {componentInstance}
          {componentDefinition}
          {bindings}
          iconTooltip={componentName}
          componentTitle={title}
        />
      {/if}
      {#if section === "conditions"}
        <ConditionalUISection
          {componentInstance}
          {componentDefinition}
          {bindings}
          {componentBindings}
        />
      {/if}
    </Panel>
  {/key}
{/if}

<style>
  .settings-tabs {
    display: flex;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-l);
    padding-bottom: var(--spacing-l);
  }
  .input {
    color: var(--spectrum-global-color-gray-900);
    font-family: inherit;
    font-size: inherit;
    font-weight: 500;
    background-color: transparent;
    border: none;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    padding: 5px;
    right: 6px;
    border: 1px solid transparent;
    border-radius: 3px;
    transition:
      150ms background-color,
      150ms border-color,
      150ms color;
  }

  .input:hover,
  .input:focus {
    cursor: text;
    background-color: var(
      --spectrum-textfield-m-background-color,
      var(--spectrum-global-color-gray-50)
    );
    border: 1px solid white;
    border-color: var(
      --spectrum-textfield-m-border-color,
      var(--spectrum-alias-border-color)
    );
    color: var(
      --spectrum-textfield-m-text-color,
      var(--spectrum-alias-text-color)
    );
  }

  .panel-title-content {
    display: contents;
  }
  .input:focus {
    outline: none;
  }
  input::placeholder {
    color: var(--spectrum-global-color-gray-600);
  }
</style>
