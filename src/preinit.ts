import '@revenge-mod/modules/metro/patches'
import '@revenge-mod/utils/patches/proxy'

import {
    onModuleFirstRequired,
    onModuleInitialized,
} from '@revenge-mod/modules/metro/subscriptions'
import { getErrorStack } from '@revenge-mod/utils/error'
import { BuildEnvironment, FullVersion } from './constants'

const IndexModuleId = 0

onModuleFirstRequired(IndexModuleId, function onIndexRequired() {
    try {
        if (__BUILD_FLAG_LOG_PROMISE_REJECTIONS__)
            // @as-require
            import('./patches/log-promise-rejections')

        if (__DEV__)
            nativeLoggingHook(`\u001b[31m--- PREINIT STAGE ---\u001b[0m`, 1)

        // Initialize preinit libraries
        // @as-require
        import('@revenge-mod/react/preinit')
        // @as-require
        import('@revenge-mod/assets/preinit')
        // @as-require
        import('@revenge-mod/discord/preinit')

        onModuleInitialized(IndexModuleId, function onIndexInitialized() {
            if (__DEV__)
                nativeLoggingHook(`\u001b[31m--- INIT STAGE ---\u001b[0m`, 1)

            try {
                // @as-require
                import('./init')
            } catch (e) {
                onError(e)
            }
        })

        // Run all preinit plugins
        // @as-require
        import('~/plugins/preinit')
        // @as-require
        import('@revenge-mod/plugins/preinit')
    } catch (e) {
        onError(e)
    }
})

export function onError(e: unknown) {
    // TODO(init): Move to use native provided alert function, which will accept a string stack trace
    // Above will reduce the need for runCatching() to exist, as the code won't be able to be deduped any further
    const { ClientInfoModule, DeviceModule } =
        require('@revenge-mod/discord/native') as typeof import('@revenge-mod/discord/native')

    const Client = ClientInfoModule.getConstants()
    const Device = DeviceModule.getConstants()

    alert(
        `Failed to load Revenge (${FullVersion} (${BuildEnvironment}))\n` +
            `Discord: ${Client.Version} (${Client.Build})\n` +
            `Device: ${Device.deviceManufacturer} ${Device.deviceModel}\n\n` +
            getErrorStack(e),
    )
}
