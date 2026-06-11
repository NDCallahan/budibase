export interface GradientStop {
  color: string
  position: number
}

export type GradientType = "linear" | "radial" | "conic"

export interface CustomGradient {
  type: "custom-gradient"
  gradientType: GradientType
  angle: number
  shape: "circle" | "ellipse"
  position: "center" | "top" | "bottom" | "left" | "right"
  stops: GradientStop[]
}

interface GradientRecord {
  [key: string]: unknown
}

const validPositions = ["center", "top", "bottom", "left", "right"] as const
const validGradientTypes = ["linear", "radial", "conic"] as const

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const isRecord = (value: unknown): value is GradientRecord => {
  return typeof value === "object" && value !== null
}

const normalizeStop = (stop: GradientStop): GradientStop => {
  return {
    color: stop.color || "#000000",
    position: clamp(Number(stop.position) || 0, 0, 100),
  }
}

export const isCustomGradient = (value: unknown): value is CustomGradient => {
  if (!isRecord(value)) {
    return false
  }
  return value.type === "custom-gradient" && Array.isArray(value.stops)
}

export const createDefaultCustomGradient = (): CustomGradient => {
  return {
    type: "custom-gradient",
    gradientType: "linear",
    angle: 90,
    shape: "circle",
    position: "center",
    stops: [
      { color: "#5b85aa", position: 0 },
      { color: "#415d43", position: 100 },
    ],
  }
}

export const cloneCustomGradient = (
  gradient: CustomGradient
): CustomGradient => {
  return {
    ...gradient,
    stops: gradient.stops.map(stop => ({ ...stop })),
  }
}

export const normalizeCustomGradient = (
  gradient: CustomGradient
): CustomGradient => {
  const stops = gradient.stops
    .map(normalizeStop)
    .sort((a, b) => a.position - b.position)

  const position = validPositions.includes(gradient.position)
    ? gradient.position
    : "center"
  const gradientType = validGradientTypes.includes(gradient.gradientType)
    ? gradient.gradientType
    : "linear"

  return {
    ...gradient,
    angle: clamp(Number(gradient.angle) || 0, 0, 360),
    shape: gradient.shape === "ellipse" ? "ellipse" : "circle",
    position,
    gradientType,
    stops: stops.length >= 2 ? stops : createDefaultCustomGradient().stops,
  }
}

const positionToCss = (position: CustomGradient["position"]) => {
  switch (position) {
    case "top":
      return "top"
    case "bottom":
      return "bottom"
    case "left":
      return "left"
    case "right":
      return "right"
    default:
      return "center"
  }
}

export const gradientToCss = (value: string | CustomGradient | undefined) => {
  if (value == null || value === "") {
    return ""
  }
  if (typeof value === "string") {
    return value.replace(/;\s*$/, "")
  }

  const gradient = normalizeCustomGradient(value)
  const stops = gradient.stops
    .map(stop => `${stop.color} ${clamp(stop.position, 0, 100)}%`)
    .join(", ")

  if (gradient.gradientType === "radial") {
    return `radial-gradient(${gradient.shape} at ${positionToCss(
      gradient.position
    )}, ${stops})`
  }

  if (gradient.gradientType === "conic") {
    return `conic-gradient(from ${clamp(gradient.angle, 0, 360)}deg at ${positionToCss(
      gradient.position
    )}, ${stops})`
  }

  return `linear-gradient(${clamp(gradient.angle, 0, 360)}deg, ${stops})`
}
