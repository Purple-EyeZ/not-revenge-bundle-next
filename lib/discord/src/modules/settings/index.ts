import { ReactNavigationNative } from '@revenge-mod/externals/react-navigation'
import { findInTree } from '@revenge-mod/utils/tree'
import { Constants } from '../../common'
import { RootNavigationRef } from '../main_tabs_v2'
import { sData, sSubscriptions } from './_internal'
import type { NavigationState } from '@react-navigation/core'
import type { DiscordModules } from '../../types'

export type SettingsItem = DiscordModules.Modules.Settings.SettingsItem
export type SettingsSection = DiscordModules.Modules.Settings.SettingsSection

export type SettingsModulesLoadedSubscription = () => void

/**
 * Checks if the settings modules are loaded.
 */
export function isSettingsModulesLoaded() {
    return sData[2]
}

/**
 * Subscribes to when settings modules are loaded.
 * Plugins should ideally register their settings in the given callback to ensure fast startup time.
 *
 * @param subcription The subscription function to call when the settings modules are loaded.
 * @returns A function to unsubscribe from the event.
 * @throws Throws an error if the settings modules are already loaded. Check with {@link isSettingsModulesLoaded} first.
 */
export function onSettingsModulesLoaded(
    subcription: SettingsModulesLoadedSubscription,
) {
    if (sData[2]) throw new Error('Settings modules already loaded')

    sSubscriptions.add(subcription)
    return () => sSubscriptions.delete(subcription)
}

/**
 * Registers a settings section with a given key.
 *
 * @param key The key to register the settings section with.
 * @param section The settings section to register.
 * @returns A function to unregister the settings section.
 */
export function registerSettingsSection(key: string, section: SettingsSection) {
    sData[0][key] = section
    return () => delete sData[0][key]
}

/**
 * Registers a settings item with a given key.
 *
 * @param key The key to register the settings item with.
 * @param item The settings item to register.
 * @returns A function to unregister the settings item.
 */
export function registerSettingsItem(key: string, item: SettingsItem) {
    sData[1][key] = item
    return () => delete sData[1][key]
}

/**
 * Registers multiple settings items at once.
 *
 * @param record The settings items to register.
 * @returns A function to unregister the settings items.
 */
export function registerSettingsItems(record: Record<string, SettingsItem>) {
    Object.assign(sData[1], record)
    return () => {
        let ret = true
        for (const key in record) ret &&= delete sData[1][key]
        return ret
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
    const section = sData[0][key]
    if (!section) throw new Error(`Section "${key}" does not exist`)

    const newLength = section.settings.push(item)
    return () => delete section.settings[newLength - 1]
}

const { CommonActions, StackActions } = ReactNavigationNative

/**
 * Refreshes the SettingsOverviewScreen, applying any changes made to settings modules.
 *
 * @param renavigate Whether to renavigate instead of replacing the screen in the stack.
 * @returns Whether the SettingsOverviewScreen was refreshed.
 */
export async function refreshSettingsOverviewScreen(renavigate?: boolean) {
    const navigation = RootNavigationRef.getRootNavigationRef()
    if (!navigation.isReady()) return false

    const state = navigation.getState()

    // State with SettingsOverviewScreen
    const settingsState = findInTree(
        state,
        (node): node is NavigationState =>
            Array.isArray(node.routes) &&
            node.routes[0]?.name ===
                (Constants.UserSettingsSections as Record<string, string>)
                    .OVERVIEW,
    )

    // We're currently not on the settings screen, so we don't need to reset
    if (!settingsState) return false

    if (renavigate) {
        const mainState = findInTree(
            state,
            (node): node is NavigationState =>
                Array.isArray(node.routes) && node.routes.length > 1,
        )

        if (!mainState) return false

        navigation.dispatch({
            ...CommonActions.goBack(),
            target: mainState.key,
        })

        navigation.navigate(mainState.routes[mainState.index].name)

        // Dispatch on next paint
        requestAnimationFrame(() => {
            navigation.dispatch(CommonActions.reset(settingsState))
        })
    } else {
        const {
            key: target,
            routes: [{ name, key: source }],
        } = settingsState

        navigation.dispatch({
            ...StackActions.replace(name),
            source,
            target,
        })
    }

    return true
}
