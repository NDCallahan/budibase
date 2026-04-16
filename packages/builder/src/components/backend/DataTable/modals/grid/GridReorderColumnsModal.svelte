<script>
  import { getContext, onMount } from "svelte"
  import { dndzone } from "svelte-dnd-action"
  import { Icon, Modal, ModalContent } from "@budibase/bbui"

  const {
    visibleColumns,
    columns: gridColumns,
    reorder,
    subscribe,
    datasource,
    rows,
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

      // Get all columns (visible + hidden) from the store
      const allCols = [...$gridColumns]

      // Find which slots (indices) in the full array are visible columns
      const visibleSlots = allCols
        .map((col, idx) => (col.visible ? idx : null))
        .filter(idx => idx !== null)

      // Place the reordered visible columns into those same slot positions
      newVisibleOrder.forEach((name, i) => {
        const colData = $gridColumns.find(c => c.name === name)
        if (colData) {
          allCols[visibleSlots[i]] = colData
        }
      })

      // Update the store with the rearranged full column list
      gridColumns.update(() => allCols)

      // Add schema mutations for all columns with their new order indices
      allCols.forEach((column, idx) => {
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
    on:confirm={saveReorder}
    on:cancel={closeModal}
  >
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
  </ModalContent>
</Modal>

<style>
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
