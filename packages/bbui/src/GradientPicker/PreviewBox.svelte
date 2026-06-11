<script lang="ts">
  import { gradientToCss } from "@budibase/shared-core"
  import type { CustomGradient } from "@budibase/shared-core"

  export let value: string | CustomGradient | undefined = undefined
  export let label = "Live Preview"
  export let compact = false

  $: background = gradientToCss(value)
</script>

<div class="preview-box" class:compact>
  <div class="frame" style={background ? `background: ${background};` : ""}>
    <div class="label">{label}</div>
  </div>
</div>

<style>
  .preview-box {
    width: 100%;
  }

  .frame {
    position: relative;
    min-height: 168px;
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid var(--spectrum-global-color-gray-300);
    background:
      linear-gradient(45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%) 0 0 / 16px
        16px,
      linear-gradient(-45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%) 0 8px /
        16px 16px,
      linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%) 8px -8px /
        16px 16px,
      linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.05) 75%) 8px 0 /
        16px 16px;
    background-color: var(--spectrum-global-color-gray-100);
  }

  .compact .frame {
    min-height: 112px;
  }

  .label {
    position: absolute;
    left: 12px;
    bottom: 12px;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.72);
    color: var(--spectrum-global-color-static-white);
    font-size: 12px;
    line-height: 1;
    backdrop-filter: blur(10px);
  }
</style>
