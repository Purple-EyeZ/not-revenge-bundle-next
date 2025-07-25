import { noop } from '@revenge-mod/utils/callback'
import { sLoaded } from '../../start'
import { sConfig, sRefresher, sSections, sSubscriptions } from './_internal'
import type { DiscordModules } from '../../types'

export type SettingsItem = DiscordModules.Modules.Settings.SettingsItem
export type SettingsSection = DiscordModules.Modules.Settings.SettingsSection

export type SettingsModulesLoadedSubscription = () => void

/**
 * Checks if the settings modules are loaded.
 */
export function isSettingsModulesLoaded() {
    return sLoaded
}

/**
 * Subscribes to when settings modules are loaded.
 * Plugins should ideally register their settings in the given callback to ensure fast startup time.
 *
 * If settings modules are already loaded, the callback will be called immediately.
 *
 * @param subcription The subscription function to call when the settings modules are loaded.
 * @returns A function to unsubscribe from the event.
 */
export function onSettingsModulesLoaded(
    subcription: SettingsModulesLoadedSubscription,
) {
    if (isSettingsModulesLoaded()) {
        subcription()
        return noop
    }

    sSubscriptions.add(subcription)
    return () => {
        sSubscriptions.delete(subcription)
    }
}

/**
 * Registers a settings section with a given key.
 *
 * @param key The key to register the settings section with.
 * @param section The settings section to register.
 * @returns A function to unregister the settings section.
 */
export function registerSettingsSection(key: string, section: SettingsSection) {
    sSections[key] = section
    return () => {
        delete sSections[key]
    }
}

/**
 * Registers a settings item with a given key.
 *
 * @param key The key to register the settings item with.
 * @param item The settings item to register.
 * @returns A function to unregister the settings item.
 */
export function registerSettingsItem(key: string, item: SettingsItem) {
    sConfig[key] = item
    return () => {
        delete sConfig[key]
    }
}

/**
 * Registers multiple settings items at once.
 *
 * @param record The settings items to register.
 * @returns A function to unregister the settings items.
 */
export function registerSettingsItems(record: Record<string, SettingsItem>) {
    Object.assign(sConfig, record)
    return () => {
        for (const key in record) delete sConfig[key]
    }
}

/**
 * Adds a settings item to an existing section.
 *
 * @param key The section to add the settings item to.
 * @param item The settings item to add.
 * @returns A function to remove the settings item from the section.
 */
export function addSettingsItemToSection(key: string, item: string) {
    const section = sSections[key]
    if (!section) throw new Error(`Section "${key}" does not exist`)

    const newLength = section.settings.push(item)
    return () => {
        delete section.settings[newLength - 1]
    }
}

/**
 * Refreshes the SettingsOverviewScreen.
 */
export function refreshSettingsOverviewScreen() {
    sRefresher.overviewScreen = true
    sRefresher.callOverviewScreen()
}

/**
 * Refreshes the settings navigator.
 */
export function refreshSettingsNavigator() {
    sRefresher.navigator = true
    sRefresher.callNavigator()
}
