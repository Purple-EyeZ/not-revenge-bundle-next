import { proxify } from '@revenge-mod/utils/proxy'
import type { DiscordNativeModules } from './types/native'

/**
 * Naming conventions:
 * - Always use the most recent module name (if we can do it in a non-breaking way)
 * - If the module name starts with "Native", remove it
 * - If the module name starts with "RTN", remove it
 * - If the module name ends with "Module", include it
 * - If the module name ends with "Manager", include it
 */

export let CacheModule: DiscordNativeModules.CacheModule = proxify(() => {
    const module = __turboModuleProxy('NativeCacheModule') as typeof CacheModule

    if (module) return (CacheModule = module)
})!

export let FileModule: DiscordNativeModules.FileModule = proxify(() => {
    const module = __turboModuleProxy('NativeFileModule') as typeof FileModule

    if (module) return (FileModule = module)
})!

export let ClientInfoModule: DiscordNativeModules.ClientInfoModule = proxify(
    () => {
        const module = __turboModuleProxy(
            'NativeClientInfoModule',
        ) as typeof ClientInfoModule

        if (module) return (ClientInfoModule = module)
    },
)!

export let DeviceModule: DiscordNativeModules.DeviceModule = proxify(() => {
    const module = __turboModuleProxy(
        'NativeDeviceModule',
    ) as typeof DeviceModule

    if (module) return (DeviceModule = module)
})!

export let ThemeModule: DiscordNativeModules.ThemeModule = proxify(() => {
    const module = __turboModuleProxy('NativeThemeModule') as typeof ThemeModule

    if (ThemeModule) return (ThemeModule = module)
})!

const nmp = nativeModuleProxy

export let BundleUpdaterManager: DiscordNativeModules.BundleUpdaterManager =
    proxify(() => {
        // Need try-catch here because if you access this before RN sets it up, it will throw an error
        try {
            const module =
                nmp.BundleUpdaterManager as typeof BundleUpdaterManager
            return (BundleUpdaterManager = module)
        } catch {
            return null
        }
    })!
