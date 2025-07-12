import '@revenge-mod/utils/patches/proxy'
import '@revenge-mod/utils/patches/objects'

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
            require('./patches/log-promise-rejections')

        if (__DEV__)
            nativeLoggingHook(`\u001b[31m--- PREINIT STAGE ---\u001b[0m`, 1)

        // Initialize preinit libraries
        require('@revenge-mod/utils/preinit')
        require('@revenge-mod/react/preinit')
        require('@revenge-mod/assets/preinit')
        require('@revenge-mod/storage/preinit')
        require('@revenge-mod/discord/preinit')

        // Run all preinit plugins
        require('~/plugins/preinit')
        require('@revenge-mod/plugins/preinit')

        onModuleInitialized(IndexModuleId, function onIndexInitialized() {
            try {
                if (__DEV__)
                    nativeLoggingHook(
                        `\u001b[31m--- INIT STAGE ---\u001b[0m`,
                        1,
                    )

                // Initialize init libraries
                require('@revenge-mod/utils/init')
                require('@revenge-mod/react/init')
                require('@revenge-mod/storage/init')
                require('@revenge-mod/externals/init')
                require('@revenge-mod/discord/init')
                require('@revenge-mod/components/init')

                // Run all init plugins
                require('~/plugins/init')
                require('@revenge-mod/plugins/init')
            } catch (e) {
                onError(e)
            }
        })
    } catch (e) {
        onError(e)
    }
})

function onError(e: unknown) {
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
