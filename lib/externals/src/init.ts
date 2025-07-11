import { pUnscopedApi } from '@revenge-mod/plugins/_'
import { defineLazyProperties } from '@revenge-mod/utils/object'
import type { UnscopedInitPluginApi } from '@revenge-mod/plugins/types'
import type { PluginApiExternals } from './types'

defineLazyProperties(
    ((pUnscopedApi as UnscopedInitPluginApi).externals =
        {} as PluginApiExternals),
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
