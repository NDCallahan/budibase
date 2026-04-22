/**
 * Bridge for two-way communication between main builder window and detached properties panel
 */

export interface DetachedPanelMessage {
  type: string
  [key: string]: any
}

/**
 * Send a message to the parent window (if this is a detached panel)
 */
export function notifyParent(message: DetachedPanelMessage) {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(message, window.location.origin)
  }
}

/**
 * Send a message to the detached panel window (if it exists)
 */
export function notifyDetachedPanel(
  detachedWindow: Window | null,
  message: DetachedPanelMessage
) {
  if (detachedWindow && !detachedWindow.closed) {
    detachedWindow.postMessage(message, window.location.origin)
  }
}

/**
 * Listen for messages from detached panel and execute handler
 */
export function onDetachedPanelMessage(
  handler: (message: DetachedPanelMessage) => void
) {
  const handleMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return
    handler(e.data)
  }

  window.addEventListener("message", handleMessage)

  return () => {
    window.removeEventListener("message", handleMessage)
  }
}

/**
 * Listen for messages in detached panel from parent
 */
export function onParentMessage(
  handler: (message: DetachedPanelMessage) => void
) {
  return onDetachedPanelMessage(handler)
}

/**
 * Check if we're in a detached panel window
 */
export function isDetachedPanel(): boolean {
  return window.opener !== null && window.opener !== undefined
}
