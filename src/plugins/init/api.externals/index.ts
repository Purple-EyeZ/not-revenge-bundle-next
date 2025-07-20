import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import { defineLazyProperties } from '@revenge-mod/utils/object'
import type { PluginApiExternals } from '@revenge-mod/externals/types'

registerPlugin(
    {
        id: 'revenge.api.externals',
        name: 'Externals API',
        description: '@revenge-mod/externals API for plugins.',
        author: 'Revenge',
        icon: 'PollsIcon',
    },
    {
        init({ unscoped }) {
            defineLazyProperties(
                (unscoped.externals = {} as PluginApiExternals),
                {
                    Browserify: () => {
                        return require('@revenge-mod/externals/browserify')
                    },
                    ReactNativeClipboard: () => {
                        return require('@revenge-mod/externals/react-native-clipboard')
                    },
                    ReactNavigation: () => {
                        return require('@revenge-mod/externals/react-navigation')
                    },
                    Shopify: () => {
                        return require('@revenge-mod/externals/shopify')
                    },
                },
            )
        },
    },
    PluginFlags.Enabled,
    // biome-ignore format: Don't format this
    InternalPluginFlags.Internal |
    InternalPluginFlags.Essential |
    InternalPluginFlags.ImplicitDependency,
)
