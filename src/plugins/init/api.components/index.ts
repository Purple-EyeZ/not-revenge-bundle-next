import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import { defineLazyProperties } from '@revenge-mod/utils/object'

registerPlugin(
    {
        id: 'revenge.api.components',
        name: 'Components API',
        description: '@revenge-mod/components API for plugins.',
        author: 'Revenge',
        icon: 'PollsIcon',
    },
    {
        init({ unscoped }) {
            defineLazyProperties(unscoped, {
                components: () => {
                    return require('@revenge-mod/components')
                },
            })
        },
    },
    PluginFlags.Enabled,
    // biome-ignore format: Don't format this
    InternalPluginFlags.Internal |
    InternalPluginFlags.Essential |
    InternalPluginFlags.ImplicitDependency,
)
