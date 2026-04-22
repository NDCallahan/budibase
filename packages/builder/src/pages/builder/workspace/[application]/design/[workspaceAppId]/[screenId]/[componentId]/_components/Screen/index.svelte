<script>
  import GeneralPanel from "./GeneralPanel.svelte"
  import { selectedScreen } from "@/stores/builder"
  import Panel from "@/components/design/Panel.svelte"
  import { Layout } from "@budibase/bbui"
  import { getContext } from "svelte"

  const togglePropertiesPanel = getContext("togglePropertiesPanel")
  const propertiesPanelPinned = getContext("propertiesPanelPinned")
  const isPanelPopped = getContext("isPanelPopped")
  const popInPanel = getContext("popInPanel")
  const popOutDetachedPanel = getContext("popOutDetachedPanel")
  $: closeTooltip = $propertiesPanelPinned ? "Collapse panel" : "Pin panel"
  $: isPopped = !!isPanelPopped && !!$isPanelPopped

  const handlePopOut = () => {
    popOutDetachedPanel?.("properties")
  }
</script>

{#if $selectedScreen}
  <Panel
    title={$selectedScreen.routing.route}
    icon={$selectedScreen.routing.route === "/" ? "house" : "browser"}
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
    <Layout gap="XS" paddingX="XL" paddingY="XL">
      <GeneralPanel />
    </Layout>
  </Panel>
{/if}
