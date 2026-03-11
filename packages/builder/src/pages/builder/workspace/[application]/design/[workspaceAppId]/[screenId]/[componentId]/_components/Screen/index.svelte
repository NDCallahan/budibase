<script>
  import GeneralPanel from "./GeneralPanel.svelte"
  import { selectedScreen } from "@/stores/builder"
  import Panel from "@/components/design/Panel.svelte"
  import { Layout } from "@budibase/bbui"
  import { getContext } from "svelte"

  const togglePropertiesPanel = getContext("togglePropertiesPanel")
  const propertiesPanelPinned = getContext("propertiesPanelPinned")
  $: closeTooltip = $propertiesPanelPinned ? "Collapse panel" : "Pin panel"
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
  >
    <Layout gap="XS" paddingX="XL" paddingY="XL">
      <GeneralPanel />
    </Layout>
  </Panel>
{/if}
