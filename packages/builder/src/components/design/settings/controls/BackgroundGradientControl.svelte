<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { GradientPicker } from "@budibase/bbui"
  import { PopoverAlignment } from "@budibase/bbui"
  import { themeStore } from "@/stores/builder"
  import type { CustomGradient } from "@budibase/shared-core"

  export let value: string | CustomGradient | undefined = undefined
  export let options: { label: string; value: string }[] = []
  export let placeholder: string | boolean = false
  export let disabled = false
  export let readonly = false
  export let size: "S" | "M" | "L" = "M"
  export let quiet = false
  export let bordered = true
  export let autoWidth = false
  export let popoverAutoWidth = false
  export let sort = false
  export let customPopoverHeight: string | undefined = undefined
  export let align: PopoverAlignment | undefined = undefined
  export let footer: string | undefined = undefined
  export let searchPlaceholder: string | undefined = undefined
  export let wrapText = false
  export let onChange:
    | ((value: string | CustomGradient) => void)
    | undefined = undefined

  const dispatch = createEventDispatcher<{
    change: string | CustomGradient
  }>()

  const handleChange = (event: CustomEvent<string | CustomGradient>) => {
    dispatch("change", event.detail)
    if (typeof onChange === "function") {
      onChange(event.detail)
    }
  }
</script>

<GradientPicker
  {value}
  {options}
  {placeholder}
  {disabled}
  {readonly}
  {size}
  {quiet}
  {bordered}
  {autoWidth}
  {popoverAutoWidth}
  {sort}
  {customPopoverHeight}
  {align}
  {footer}
  {searchPlaceholder}
  {wrapText}
  spectrumTheme={$themeStore.theme}
  on:change={handleChange}
/>
