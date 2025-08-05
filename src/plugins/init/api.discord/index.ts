import { Logger } from '@revenge-mod/discord/common'
import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import {
    defineLazyProperties,
    defineLazyProperty,
} from '@revenge-mod/utils/object'
import type { PluginApiDiscord } from '@revenge-mod/discord/types'

registerPlugin(
    {
        id: 'revenge.api.discord',
        name: 'Discord API',
        description: '@revenge-mod/discord API for plugins.',
        author: 'Revenge',
        icon: 'PollsIcon',
    },
    {
        init({ unscoped, decorate }) {
            decorate(plugin => {
                defineLazyProperty(
                    plugin.api,
                    'logger',
                    () =>
                        new Logger(`Revenge > Plugins (${plugin.manifest.id})`),
                )
            })

            defineLazyProperties((unscoped.discord = {} as PluginApiDiscord), {
                actions: () => {
                    return require('@revenge-mod/discord/actions')
                },
                common: () => {
                    return require('@revenge-mod/discord/common')
                },
                design: () => {
                    return require('@revenge-mod/discord/design')
                },
                flux: () => {
                    return require('@revenge-mod/discord/flux')
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
            })
        },
    },
    PluginFlags.Enabled,
    // biome-ignore format: Don't format this
    InternalPluginFlags.Internal |
    InternalPluginFlags.Essential |
    InternalPluginFlags.ImplicitDependency,
)
