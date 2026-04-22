import { builderStore } from "@/stores/builder"

const noop = () => {}

interface ResizeActionsConfig {
  elementDimension: "width" | "height"
  mouseCoordinate: "pageX" | "pageY"
  clientDimension: "clientWidth" | "clientHeight"
  directionMultiplier?: 1 | -1
  initialValue?: number
  getMaxValue?: () => number
  setValue?: (value: number) => void
  onResizeStart?: () => void
}

const getResizeActions = ({
  elementDimension,
  mouseCoordinate,
  clientDimension: elementProperty,
  directionMultiplier = 1,
  initialValue,
  getMaxValue,
  setValue = noop,
  onResizeStart = noop,
}: ResizeActionsConfig) => {
  let element: HTMLElement | null = null

  const elementAction = (node: HTMLElement) => {
    element = node

    if (initialValue != null) {
      element.style[elementDimension] = `${initialValue}px`
    }

    return {
      destroy() {
        element = null
      },
    }
  }

  const dragHandleAction = (node: HTMLElement) => {
    let startProperty: number | null = null
    let startPosition: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      // Prevent highlighting while dragging
      e.preventDefault()
      if (!element || startProperty == null || startPosition == null) return

<<<<<<< HEAD
      const change = (e[mouseCoordinate] - startPosition) * directionMultiplier
      const newValue = startProperty + change
=======
      const change = e[mouseCoordinate] - startPosition
      const rawValue = startProperty + change
      const maxValue = getMaxValue ? getMaxValue() : Infinity
      const newValue = Math.min(maxValue, rawValue)
>>>>>>> c8cc2d0491 (pop out functionality for properties panel, allowing it to be resized to the full height of the screen and up to 350px wide (to prevent it from taking up the entire detached workspace when both panels are detached). This involved adding a resize listener in the detached properties panel to track the window width and passing that as a prop to the LeftPanel component to set its maxWidth. The pop out function was also updated to set the initial width of the detached window to 650px to better accommodate the properties panel when both panels are detached.)
      element.style[elementDimension] = `${newValue}px`
    }

    const handleMouseUp = (e: MouseEvent) => {
      // Prevent highlighting while dragging
      e.preventDefault()
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)

      // Re-enable text selection via builderStore
      builderStore.setResizingPanel(false)

      if (element) {
        // Remove temporary transition override
        element.style.removeProperty("transition")

        // Get the actual computed width/height that was set
        const computedValue = parseInt(
          element.style[elementDimension]?.replace("px", "") || "0",
          10
        )

        if (computedValue > 0) {
          setValue(computedValue)
        }
      }

      // Re-enable iframe interactions
      for (let item of Array.from(document.getElementsByTagName("iframe"))) {
        item.style.removeProperty("pointer-events")
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Prevent highlighting while dragging
      e.preventDefault()
      if (!element || startProperty == null || startPosition == null) return

      const change = e[mouseCoordinate] - startPosition
      const rawValue = startProperty + change
      const maxValue = getMaxValue ? getMaxValue() : Infinity
      const newValue = Math.min(maxValue, rawValue)
      element.style[elementDimension] = `${newValue}px`
    }
      }

      const target = e.target as HTMLElement
      if (
        target.hasAttribute("disabled") &&
        target.getAttribute("disabled") !== "false"
      ) {
        return
      }

      if (!element) return

      builderStore.setResizingPanel(true)
      onResizeStart()

      // Temporarily override any height transitions
      element.style.transition = `${elementDimension} 0ms`

      // iframes swallow mouseup events if your cursor ends up over it during a drag, so make them
      // temporarily non-interactive
      for (let item of Array.from(document.getElementsByTagName("iframe"))) {
        item.style.pointerEvents = "none"
      }

      startProperty = element[elementProperty]
      startPosition = e[mouseCoordinate]

      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    const handleDoubleClick = () => {
      if (element) {
        element.style.removeProperty(elementDimension)
        setValue(initialValue || 0)
      }
    }

    node.addEventListener("mousedown", handleMouseDown)
    node.addEventListener("dblclick", handleDoubleClick)

    return {
      destroy() {
        node.removeEventListener("mousedown", handleMouseDown)
        node.removeEventListener("dblclick", handleDoubleClick)
      },
    }
  }

  return [elementAction, dragHandleAction] as const
}

export const getVerticalResizeActions = (
  initialValue?: number,
  setValue?: (value: number) => void
) => {
  return getResizeActions({
    elementDimension: "height",
    mouseCoordinate: "pageY",
    clientDimension: "clientHeight",
    initialValue,
    setValue,
  })
}

export const getHorizontalResizeActions = (
  initialValue?: number,
  setValue?: (value: number) => void,
  onResizeStart?: () => void,
<<<<<<< HEAD
  panelPosition: "left" | "right" = "left"
=======
  getMaxValue?: () => number
>>>>>>> c8cc2d0491 (pop out functionality for properties panel, allowing it to be resized to the full height of the screen and up to 350px wide (to prevent it from taking up the entire detached workspace when both panels are detached). This involved adding a resize listener in the detached properties panel to track the window width and passing that as a prop to the LeftPanel component to set its maxWidth. The pop out function was also updated to set the initial width of the detached window to 650px to better accommodate the properties panel when both panels are detached.)
) => {
  return getResizeActions({
    elementDimension: "width",
    mouseCoordinate: "pageX",
    clientDimension: "clientWidth",
    directionMultiplier: panelPosition === "right" ? -1 : 1,
    initialValue,
    setValue,
    onResizeStart,
    getMaxValue,
  })
}
