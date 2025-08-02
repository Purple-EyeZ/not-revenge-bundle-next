import { getNativeModule } from '@revenge-mod/modules/native'
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
    const module = getNativeModule<typeof CacheModule>('NativeCacheModule')

    if (module) return (CacheModule = module)
})!

export let FileModule: DiscordNativeModules.FileModule = proxify(() => {
    const module = getNativeModule<typeof FileModule>('NativeFileModule')

    if (module) return (FileModule = module)
})!

export let ClientInfoModule: DiscordNativeModules.ClientInfoModule = proxify(
    () => {
        const module = getNativeModule<typeof ClientInfoModule>(
            'NativeClientInfoModule',
        )

        if (module) return (ClientInfoModule = module)
    },
)!

export let DeviceModule: DiscordNativeModules.DeviceModule = proxify(() => {
    const module = getNativeModule<typeof DeviceModule>('NativeDeviceModule')

    if (module) return (DeviceModule = module)
})!

export let ThemeModule: DiscordNativeModules.ThemeModule = proxify(() => {
    const module = getNativeModule<typeof ThemeModule>('NativeThemeModule')

    if (module) return (ThemeModule = module)
})!

export let BundleUpdaterManager: DiscordNativeModules.BundleUpdaterManager =
    proxify(() => {
        const module = getNativeModule<typeof BundleUpdaterManager>(
            'BundleUpdaterManager',
        )

        if (module) return (BundleUpdaterManager = module)
    })!
