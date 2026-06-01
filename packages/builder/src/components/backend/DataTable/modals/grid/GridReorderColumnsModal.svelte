<script>
  import { getContext, onMount } from "svelte"
  import { get } from "svelte/store"
  import { dndzone } from "svelte-dnd-action"
  import { Icon, Modal, ModalContent } from "@budibase/bbui"

  const {
    visibleColumns,
    columns: gridColumns,
    reorder,
    subscribe,
    datasource,
  } = getContext("grid")

  let modal
  let columns = []
  let originalOrder = []

  const flipDurationMs = 200

  onMount(() => subscribe("reorder-columns", openModal))

  const openModal = () => {
    originalOrder = $visibleColumns.map(col => col.name)
    columns = $visibleColumns.map((col, idx) => ({
      id: col.name,
      name: col.name,
      label: col.label,
      originalIdx: idx,
    }))
    modal.show()
  }

  const closeModal = () => {
    columns = []
    originalOrder = []
    modal.hide()
  }

  const handleDndEvent = e => {
    columns = e.detail.items
  }

  const handleFinalize = e => {
    columns = e.detail.items
  }

  const saveReorder = async () => {
    try {
      const newVisibleOrder = columns.map(col => col.name)

      // Rearrange the columns store to match the new visible order,
      // mirroring the pattern used by moveColumn in reorder.ts.
      // The `state` in update() is the raw (non-enriched) writable value.
      gridColumns.update(state => {
        const result = [...state]
        const visibleSlots = state
          .map((col, idx) => (col.visible ? idx : null))
          .filter(idx => idx !== null)
        newVisibleOrder.forEach((name, i) => {
          const col = state.find(c => c.name === name)
          if (col) result[visibleSlots[i]] = col
        })
        return result
      })

      // Read the updated enriched columns and assign sequential order mutations
      get(gridColumns).forEach((column, idx) => {
        const mutation = { order: idx }
        if (!column.related) {
          datasource.actions.addSchemaMutation(column.name, mutation)
        } else {
          datasource.actions.addSubSchemaMutation(
            column.related.subField,
            column.related.field,
            mutation
          )
        }
      })

      await datasource.actions.saveSchemaMutations()
      closeModal()
    } catch (error) {
      console.error("Error reordering columns:", error)
    }
  }
</script>

<Modal bind:this={modal}>
  <ModalContent
    title="Reorder Columns"
    confirmText="Save"
    onConfirm={saveReorder}
    onCancel={closeModal}
  >
    <div class="scroll-container">
      <div
        class="columns-list align-left"
        use:dndzone={{
          items: columns,
          flipDurationMs,
          dropTargetStyle: { outline: "none" },
        }}
        on:finalize={handleFinalize}
        on:consider={handleDndEvent}
      >
        {#each columns as column (column.id)}
          <div class="column-item">
            <div class="drag-handle reorder-icon">
              <Icon name="dots-nine" size="M" />
            </div>
            <div class="column-label">{column.label}</div>
          </div>
        {/each}
      </div>
    </div>
  </ModalContent>
</Modal>

<style>
  .scroll-container {
    max-height: 60vh;
    overflow-y: auto;
    width: 100%;
  }

  .columns-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    min-width: 280px;
    align-items: flex-start;
  }

  .columns-list.align-left {
    align-items: flex-start;
  }

  .column-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    padding: var(--spacing-m);
    background: var(--spectrum-global-color-gray-100);
    border-radius: var(--spectrum-border-radius);
    cursor: grab;
    user-select: none;
    transition: background-color 200ms;
  }

  .column-item:hover {
    background: var(--spectrum-global-color-gray-200);
  }

  .drag-handle {
    display: flex;
    align-items: center;
    color: var(--spectrum-global-color-gray-600);
    cursor: grab;
    margin-right: var(--spacing-m);
  }

  .reorder-icon {
    min-width: 24px;
    justify-content: center;
  }
</style>
