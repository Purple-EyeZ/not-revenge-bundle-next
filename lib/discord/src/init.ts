import { pEmitter, pUnscopedApi } from '@revenge-mod/plugins/_'
import {
    defineLazyProperties,
    defineLazyProperty,
} from '@revenge-mod/utils/object'
import { Logger } from './common'
import type { UnscopedInitPluginApi } from '@revenge-mod/plugins/types'
import type { PluginApiDiscord } from './types/revenge'

defineLazyProperties(
    ((pUnscopedApi as UnscopedInitPluginApi).discord = {} as PluginApiDiscord),
    {
        actions: () => {
            return require('@revenge-mod/discord/actions')
        },
        common: () => {
            return require('@revenge-mod/discord/common')
        },
        design: () => {
            return require('@revenge-mod/discord/design')
        },
        native: () => {
            return require('@revenge-mod/discord/native')
        },
        modules: () =>
            defineLazyProperties({} as PluginApiDiscord.Modules, {
                mainTabsV2: () => {
                    return require('@revenge-mod/discord/modules/main_tabs_v2')
                },
                settings: () => ({
                    ...require('@revenge-mod/discord/modules/settings'),
                    renderer: require('@revenge-mod/discord/modules/settings/renderer'),
                }),
            }),
    },
)

pEmitter.on('init', ({ manifest: { id } }, api) =>
    defineLazyProperty(
        api,
        'logger',
        () => new Logger(`Revenge > Plugins (${id})`),
    ),
)
