import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'

registerPlugin(
    {
        id: 'revenge.api.utils',
        name: 'Utils API',
        description: '@revenge-mod/utils API for plugins.',
        author: 'Revenge',
        icon: 'PollsIcon',
    },
    {
        preInit({ unscoped }) {
            unscoped.utils = {
                callback: require('@revenge-mod/utils/callback'),
                error: require('@revenge-mod/utils/error'),
                object: require('@revenge-mod/utils/object'),
                promise: require('@revenge-mod/utils/promise'),
                proxy: require('@revenge-mod/utils/proxy'),
                tree: require('@revenge-mod/utils/tree'),
            }
        },
        init({ unscoped: { utils } }) {
            utils.discord = require('@revenge-mod/utils/discord')
            utils.react = require('@revenge-mod/utils/react')
        },
    },
    PluginFlags.Enabled,
    // biome-ignore format: Don't format this
    InternalPluginFlags.Internal |
    InternalPluginFlags.Essential |
    InternalPluginFlags.ImplicitDependency,
)
