<script lang="ts">
  import { Label, Select } from "@budibase/bbui"
  import { AppFontSizeOptions, DefaultAppFontSize } from "@budibase/shared-core"
  import type { AppCustomTheme } from "@budibase/types"
  import { createEventDispatcher } from "svelte"

  export let customTheme: AppCustomTheme = {}

  const dispatch = createEventDispatcher<{ change: string }>()

  $: value = customTheme.fontSize || DefaultAppFontSize

  const onChange = (e: any) => {
    dispatch("change", e.detail)
  }
</script>

<div class="container">
  <Label>Font Size</Label>
  <Select options={AppFontSizeOptions} {value} on:change={onChange} />
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: var(--spacing-xs);
  }
</style>
