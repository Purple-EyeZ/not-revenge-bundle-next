import type {
    SettingsItem,
    SettingsModulesLoadedSubscription,
    SettingsSection,
} from '.'

// Sections to splice in the SettingsOverviewScreen
export const sSections: Record<string, SettingsSection> = {}
// SETTING_RENDERER_CONFIG settings
export const sConfig: Record<string, SettingsItem> = {}

export const sSubscriptions = new Set<SettingsModulesLoadedSubscription>()
