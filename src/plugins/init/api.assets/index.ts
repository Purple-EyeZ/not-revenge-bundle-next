import * as assets from '@revenge-mod/assets'
import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'

registerPlugin(
    {
        id: 'revenge.api.assets',
        name: 'Assets API',
        description: '@revenge-mod/assets API for plugins.',
        author: 'Revenge',
        icon: 'PollsIcon',
    },
    {
        init({ unscoped }) {
            unscoped.assets = assets
        },
    },
    PluginFlags.Enabled,
    // biome-ignore format: Don't format this
    InternalPluginFlags.Internal |
    InternalPluginFlags.Essential |
    InternalPluginFlags.ImplicitDependency,
)
