import {
    onSettingsModulesLoaded,
    refreshSettingsOverviewScreen,
} from '@revenge-mod/discord/modules/settings'
import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import type { PluginApi } from '@revenge-mod/plugins/types'

interface Storage {
    devtools: {
        address: string
        autoConnect: boolean
    }
}

const defaultStorage: Storage = {
    devtools: {
        address: 'localhost:8097',
        autoConnect: false,
    },
}

// TODO(PalmDevs): only register in development builds once updates can be made automatic
registerPlugin<{ storage: Storage }>(
    {
        id: 'revenge.developer-kit',
        name: 'Developer Kit',
        description: 'Tools assisting Revenge developers.',
        author: 'Revenge',
        icon: 'WrenchIcon',
    },
    {
        storage: {
            load: true,
            default: defaultStorage,
        },
        start(api_) {
            api = api_

            onSettingsModulesLoaded(() => {
                require('./utils').register()
            })

            if (api_.plugin.flags & PluginFlags.EnabledLate)
                refreshSettingsOverviewScreen()

            Promise.all([import('./react-devtools'), api.storage.get()]).then(
                ([rdt, settings]) => {
                    if (settings.devtools.autoConnect) rdt.connect()
                },
            )
        },
        stop() {
            refreshSettingsOverviewScreen()
        },
    },
    PluginFlags.Enabled,
    InternalPluginFlags.Internal,
)

// Expose to EvalJSSetting
export let api: PluginApi<{ storage: Storage }>
