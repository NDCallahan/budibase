import { AppFontFamily, ThemeMeta, Theme } from "@budibase/types"

export const ThemeClassPrefix = "spectrum--"
export const DefaultBuilderTheme = Theme.DARKEST
export const DefaultAppTheme = Theme.LIGHT

// Currently available theme options for builder and apps
export const ThemeOptions: ThemeMeta[] = [
  {
    id: Theme.LIGHT,
    name: "Light",
  },
  {
    // We call this dark for simplicity, but we want to use the spectrum darkest style
    id: Theme.DARKEST,
    name: "Dark",
  },
  {
    id: Theme.NORD,
    name: "Nord",
    base: Theme.DARKEST,
  },
  {
    id: Theme.MIDNIGHT,
    name: "Midnight",
    base: Theme.DARKEST,
  },
]

export const DefaultExistingAppFontFamily = AppFontFamily.SOURCE_SANS
export const DefaultNewAppFontFamily = AppFontFamily.INTER

export const AppFontFamilyOptions = [
  {
    label: "Inter",
    value: AppFontFamily.INTER,
  },
  {
    label: "Helvetica",
    value: AppFontFamily.HELVETICA,
  },
  {
    label: "Source Sans",
    value: AppFontFamily.SOURCE_SANS,
  },
  {
    label: "Georgia",
    value: AppFontFamily.GEORGIA,
  },
]

export const AppFontFamilyStacks: Record<AppFontFamily, string> = {
  [AppFontFamily.SOURCE_SANS]:
    '"Source Sans 3", -apple-system, BlinkMacSystemFont, Segoe UI, "Inter", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  [AppFontFamily.INTER]:
    '"Inter", -apple-system, BlinkMacSystemFont, Segoe UI, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  [AppFontFamily.HELVETICA]: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  [AppFontFamily.GEORGIA]: 'Georgia, "Times New Roman", Times, serif',
}

export const ensureValidAppFontFamily = (fontFamily?: string) => {
  if (
    fontFamily &&
    Object.prototype.hasOwnProperty.call(AppFontFamilyStacks, fontFamily)
  ) {
    return fontFamily as AppFontFamily
  }
  return DefaultExistingAppFontFamily
}

export const getAppFontFamilyStack = (fontFamily?: string) => {
  return AppFontFamilyStacks[ensureValidAppFontFamily(fontFamily)]
}

export const DefaultAppFontSize = "14px"

export const AppFontSizeOptions = [
  { label: "Small", value: "12px" },
  { label: "Medium", value: "14px" },
  { label: "Large", value: "18px" },
  { label: "Extra large", value: "24px" },
]
