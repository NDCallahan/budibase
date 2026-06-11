<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import Drawer from "../Drawer/Drawer.svelte"
  import Select from "../Form/Select.svelte"
  import TextArea from "../Form/TextArea.svelte"
  import Button from "../Button/Button.svelte"
  import ActionButton from "../ActionButton/ActionButton.svelte"
  import ButtonGroup from "../ButtonGroup/ButtonGroup.svelte"
  import ColorPicker from "../ColorPicker/ColorPicker.svelte"
  import PreviewBox from "./PreviewBox.svelte"
  import { PopoverAlignment } from "../constants"
  import {
    cloneCustomGradient,
    createDefaultCustomGradient,
    gradientToCss,
    isCustomGradient,
    normalizeCustomGradient,
    type CustomGradient,
    type GradientStop,
  } from "@budibase/shared-core"
  import type { Theme } from "@budibase/types"

  interface GradientOption {
    label: string
    value: string
  }

  interface DraftStop extends GradientStop {
    id: string
  }

  const CUSTOM_VALUE = "__custom__"
  const anglePresets = [0, 45, 90, 135, 180]
  const positionOptions: Array<{
    label: string
    value: CustomGradient["position"]
  }> = [
    { label: "Center", value: "center" },
    { label: "Top", value: "top" },
    { label: "Bottom", value: "bottom" },
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
  ]

  export let value: string | CustomGradient | undefined = undefined
  export let options: GradientOption[] = []
  export let placeholder: string | boolean = "Choose an option"
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
  export let spectrumTheme: Theme | undefined = undefined
  export let customLabel = "Custom…"
  export let onChange: ((value: string | CustomGradient) => void) | undefined =
    undefined

  const dispatch = createEventDispatcher<{
    change: string | CustomGradient
  }>()

  let customDrawer: {
    show: () => void
    hide: () => void
  } | undefined
  let theme: Theme | undefined
  let selectOptions: GradientOption[] = []
  let selectValue: string | undefined
  let cssOutput = ""
  let previewValue: CustomGradient = createDefaultCustomGradient()
  let draftGradient = createDraftGradient(value)
  let activeStopId = draftGradient.stops[0]?.id || ""
  let draggingStopId = ""

  $: theme = spectrumTheme
  $: selectOptions = [...options, { label: customLabel, value: CUSTOM_VALUE }]
  $: selectValue = isCustomGradient(value) ? CUSTOM_VALUE : value
  $: cssOutput = gradientToCss(draftToGradient(draftGradient))
  $: previewValue = draftToGradient(draftGradient)

  function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }

  function createDraftGradient(
    gradient: string | CustomGradient | undefined
  ): { gradient: CustomGradient; stops: DraftStop[] } {
    const source = isCustomGradient(gradient)
      ? cloneCustomGradient(gradient)
      : createDefaultCustomGradient()

    const normalized = normalizeCustomGradient(source)
    const stops = normalized.stops.map(stop => ({
      ...stop,
      id: createId(),
    }))

    return {
      gradient: normalized,
      stops,
    }
  }

  function draftToGradient(draft: {
    gradient: CustomGradient
    stops: DraftStop[]
  }): CustomGradient {
    return normalizeCustomGradient({
      ...draft.gradient,
      stops: draft.stops.map(({ id, ...stop }) => stop),
    })
  }

  function syncDraftFromValue() {
    const nextDraft = createDraftGradient(value)
    draftGradient = nextDraft
    activeStopId = nextDraft.stops[0]?.id || ""
  }

  function updateDraft(
    updater: (draft: {
      gradient: CustomGradient
      stops: DraftStop[]
    }) => {
      gradient: CustomGradient
      stops: DraftStop[]
    }
  ) {
    draftGradient = updater(draftGradient)
    const activeExists = draftGradient.stops.some(stop => stop.id === activeStopId)
    if (!activeExists) {
      activeStopId = draftGradient.stops[0]?.id || ""
    }
  }

  function openCustomDrawer() {
    syncDraftFromValue()
    customDrawer?.show()
  }

  function emitChange(nextValue: string | CustomGradient) {
    dispatch("change", nextValue)
    if (typeof onChange === "function") {
      onChange(nextValue)
    }
  }

  function handleSelectChange(event: CustomEvent<string | undefined>) {
    const nextValue = event.detail
    if (nextValue == null) {
      return
    }
    if (nextValue === CUSTOM_VALUE) {
      openCustomDrawer()
      return
    }
    emitChange(nextValue)
  }

  function setGradientType(nextType: CustomGradient["gradientType"]) {
    updateDraft(draft => ({
      ...draft,
      gradient: {
        ...draft.gradient,
        gradientType: nextType,
      },
    }))
  }

  function setAngle(angle: number) {
    updateDraft(draft => ({
      ...draft,
      gradient: {
        ...draft.gradient,
        angle,
      },
    }))
  }

  function setShape(shape: CustomGradient["shape"]) {
    updateDraft(draft => ({
      ...draft,
      gradient: {
        ...draft.gradient,
        shape,
      },
    }))
  }

  function setPosition(position: CustomGradient["position"]) {
    updateDraft(draft => ({
      ...draft,
      gradient: {
        ...draft.gradient,
        position,
      },
    }))
  }

  function setStopColor(id: string, color: string) {
    updateDraft(draft => ({
      ...draft,
      stops: draft.stops.map(stop => {
        if (stop.id !== id) {
          return stop
        }
        return { ...stop, color }
      }),
    }))
  }

  function setStopPosition(id: string, position: number) {
    updateDraft(draft => ({
      ...draft,
      stops: draft.stops
        .map(stop => {
          if (stop.id !== id) {
            return stop
          }
          return { ...stop, position: clampPosition(position) }
        })
        .sort((a, b) => a.position - b.position),
    }))
  }

  function selectStop(id: string) {
    activeStopId = id
  }

  function addStop(position = 50) {
    const stop = {
      id: createId(),
      color: "#ffffff",
      position: clampPosition(position),
    }
    updateDraft(draft => ({
      ...draft,
      stops: [...draft.stops, stop].sort((a, b) => a.position - b.position),
    }))
    activeStopId = stop.id
  }

  function removeStop(id: string) {
    if (draftGradient.stops.length <= 2) {
      return
    }
    updateDraft(draft => {
      const stops = draft.stops.filter(stop => stop.id !== id)
      return {
        ...draft,
        stops,
      }
    })
  }

  function clampPosition(position: number) {
    return Math.min(100, Math.max(0, Math.round(position)))
  }

  function handleTrackPointerDown(event: PointerEvent) {
    const target = event.currentTarget as HTMLElement | null
    if (!target) {
      return
    }
    const rect = target.getBoundingClientRect()
    const position = ((event.clientX - rect.left) / rect.width) * 100
    addStop(position)
  }

  function handleStopPointerDown(id: string, event: PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    draggingStopId = id
    activeStopId = id
  }

  function handlePointerMove(event: PointerEvent) {
    if (!draggingStopId) {
      return
    }

    const track = document.getElementById("gradient-stop-track")
    if (!track) {
      return
    }
    const rect = track.getBoundingClientRect()
    const position = ((event.clientX - rect.left) / rect.width) * 100
    setStopPosition(draggingStopId, position)
  }

  function handlePointerUp() {
    draggingStopId = ""
  }

  function applyGradient() {
    emitChange(draftToGradient(draftGradient))
    customDrawer?.hide()
  }

  function stopSummary(stop: DraftStop) {
    return `${stop.color} ${stop.position}%`
  }

  function isActiveStop(stopId: string) {
    return stopId === activeStopId
  }
</script>

<div class="gradient-picker">
  <Select
    value={selectValue}
    {disabled}
    {readonly}
    {size}
    {quiet}
    {bordered}
    {autoWidth}
    {popoverAutoWidth}
    {sort}
    {placeholder}
    {align}
    {footer}
    {customPopoverHeight}
    {searchPlaceholder}
    {wrapText}
    options={selectOptions}
    on:change={handleSelectChange}
    on:click
  />

  <Drawer bind:this={customDrawer} title="Custom Gradient">
    <Button cta slot="buttons" on:click={applyGradient}>Apply Gradient</Button>

    <svelte:fragment slot="body">
      <div class="editor">
      <p class="intro">
        Build a reusable gradient with live preview and copy-ready CSS.
      </p>

      <section class="panel">
        <div class="section-header">
          <div class="section-title">Gradient Type</div>
          <div class="section-subtitle">
            Choose the gradient model that best fits the background.
          </div>
        </div>

        <ButtonGroup>
          <ActionButton
            selected={draftGradient.gradient.gradientType === "linear"}
            on:click={() => setGradientType("linear")}
          >
            Linear
          </ActionButton>
          <ActionButton
            selected={draftGradient.gradient.gradientType === "radial"}
            on:click={() => setGradientType("radial")}
          >
            Radial
          </ActionButton>
          <ActionButton
            selected={draftGradient.gradient.gradientType === "conic"}
            on:click={() => setGradientType("conic")}
          >
            Conic
          </ActionButton>
        </ButtonGroup>
      </section>

      <section class="panel">
        <div class="section-header">
          <div class="section-title">Controls</div>
          <div class="section-subtitle">
            Adjust the shape of the gradient without needing CSS syntax.
          </div>
        </div>

        {#if draftGradient.gradient.gradientType === "linear" || draftGradient.gradient.gradientType === "conic"}
          <div class="control-row">
            <div class="row-heading">
              <span>Angle</span>
              <span>{draftGradient.gradient.angle}deg</span>
            </div>
            <input
              class="range-input"
              type="range"
              min="0"
              max="360"
              step="1"
              value={draftGradient.gradient.angle}
              on:input={event =>
                setAngle(
                  Number((event.currentTarget as HTMLInputElement).value)
                )}
            />
            <div class="preset-row">
              {#each anglePresets as angle}
                <ActionButton
                  quiet
                  selected={draftGradient.gradient.angle === angle}
                  on:click={() => setAngle(angle)}
                >
                  {angle}°
                </ActionButton>
              {/each}
            </div>
          </div>
        {/if}

        {#if draftGradient.gradient.gradientType === "radial"}
          <div class="control-row">
            <div class="row-heading">
              <span>Shape</span>
            </div>
            <ButtonGroup>
              <ActionButton
                selected={draftGradient.gradient.shape === "circle"}
                on:click={() => setShape("circle")}
              >
                Circle
              </ActionButton>
              <ActionButton
                selected={draftGradient.gradient.shape === "ellipse"}
                on:click={() => setShape("ellipse")}
              >
                Ellipse
              </ActionButton>
            </ButtonGroup>
          </div>
        {/if}

        {#if draftGradient.gradient.gradientType === "radial" || draftGradient.gradient.gradientType === "conic"}
          <div class="control-row">
            <div class="row-heading">
              <span>Position</span>
            </div>
            <div class="preset-row wrap">
              {#each positionOptions as position}
                <ActionButton
                  quiet
                  selected={draftGradient.gradient.position === position.value}
                  on:click={() => setPosition(position.value)}
                >
                  {position.label}
                </ActionButton>
              {/each}
            </div>
          </div>
        {/if}
      </section>

      <section class="panel">
        <div class="section-header">
          <div class="section-title">Color Stops</div>
          <div class="section-subtitle">
            Drag to reorder the blend or edit the stop values directly.
          </div>
        </div>

        <div
          class="track-shell"
          id="gradient-stop-track"
          style={`background: ${cssOutput};`}
          on:pointerdown={handleTrackPointerDown}
        >
          {#each draftGradient.stops as stop}
            <button
              class="stop-handle"
              class:active={isActiveStop(stop.id)}
              style={`left: ${stop.position}%; background: ${stop.color};`}
              title={stopSummary(stop)}
              on:pointerdown={event => handleStopPointerDown(stop.id, event)}
              on:click|stopPropagation={() => selectStop(stop.id)}
              type="button"
            ></button>
          {/each}
        </div>

        <div class="stop-list">
          {#each draftGradient.stops as stop}
            <div class="stop-row" class:active={isActiveStop(stop.id)}>
              <button
                class="stop-chip"
                style={`background: ${stop.color};`}
                type="button"
                on:click={() => selectStop(stop.id)}
                title={stopSummary(stop)}
              ></button>

              <div class="stop-fields">
                <div class="stop-color">
                  <ColorPicker
                    value={stop.color}
                    spectrumTheme={theme}
                    on:change={event => setStopColor(stop.id, event.detail)}
                  />
                </div>
                <input
                  class="position-input"
                  type="number"
                  min="0"
                  max="100"
                  value={stop.position}
                  on:input={event =>
                    setStopPosition(
                      stop.id,
                      Number((event.currentTarget as HTMLInputElement).value)
                    )}
                />
              </div>

              <ActionButton
                quiet
                disabled={draftGradient.stops.length <= 2}
                tooltip="Remove stop"
                icon="trash"
                on:click={() => removeStop(stop.id)}
              />
            </div>
          {/each}
        </div>

        <div class="footer-row">
          <Button secondary on:click={() => addStop()}>Add Stop</Button>
        </div>
      </section>

      <section class="panel">
        <div class="section-header">
          <div class="section-title">Live Preview</div>
        </div>
        <PreviewBox value={previewValue} />
      </section>

      <section class="panel">
        <div class="section-header">
          <div class="section-title">CSS Output</div>
        </div>
        <TextArea value={`background-image: ${cssOutput};`} readonly height={120} />
      </section>
      </div>
    </svelte:fragment>
  </Drawer>
</div>

<svelte:window on:pointermove={handlePointerMove} on:pointerup={handlePointerUp} />

<style>
  .gradient-picker {
    width: 100%;
  }

  .editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0 8px 12px;
  }

  .intro {
    margin: 0;
    color: var(--spectrum-global-color-gray-600);
    font-size: 13px;
    line-height: 1.5;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--spectrum-global-color-gray-200);
    border-radius: 14px;
    background: var(--spectrum-global-color-gray-50);
  }

  .section-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--spectrum-global-color-gray-900);
  }

  .section-subtitle {
    font-size: 12px;
    color: var(--spectrum-global-color-gray-600);
  }

  .control-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .row-heading {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 13px;
    font-weight: 500;
    color: var(--spectrum-global-color-gray-800);
  }

  .preset-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .preset-row.wrap {
    justify-content: flex-start;
  }

  .range-input {
    width: 100%;
    margin: 0;
  }

  .track-shell {
    position: relative;
    height: 46px;
    border-radius: 12px;
    border: 1px solid var(--spectrum-global-color-gray-300);
    overflow: hidden;
    cursor: copy;
    background-size: cover;
  }

  .stop-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 2px solid var(--spectrum-global-color-static-white);
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);
    cursor: grab;
  }

  .stop-handle.active {
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: 0 0 0 3px rgba(75, 117, 255, 0.18);
  }

  .stop-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stop-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: start;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--spectrum-global-color-gray-200);
    background: var(--spectrum-global-color-static-white);
  }

  .stop-row.active {
    border-color: var(--spectrum-global-color-blue-500);
    box-shadow: 0 0 0 2px rgba(75, 117, 255, 0.08);
  }

  .stop-chip {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 2px solid var(--spectrum-global-color-static-white);
    box-shadow: 0 0 0 1px var(--spectrum-global-color-gray-300);
    align-self: center;
  }

  .stop-fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px;
    gap: 10px;
    align-items: start;
  }

  .stop-color {
    min-width: 0;
  }

  .position-input {
    height: 36px;
    width: 100%;
    border-radius: 10px;
    border: 1px solid var(--spectrum-global-color-gray-300);
    padding: 0 12px;
    background: var(--spectrum-global-color-static-white);
    color: var(--spectrum-global-color-gray-900);
    font-size: 14px;
  }

  .footer-row {
    display: flex;
    justify-content: flex-start;
  }
</style>
