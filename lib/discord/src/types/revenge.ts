import type { DiscordModules } from '.'

export interface PluginApiDiscord {
    actions: PluginApiDiscord.Actions
    common: PluginApiDiscord.Common
    design: PluginApiDiscord.Design
    flux: PluginApiDiscord.Flux
    modules: PluginApiDiscord.Modules
    native: PluginApiDiscord.Native
}

export namespace PluginApiDiscord {
    export type Actions = typeof import('@revenge-mod/discord/actions')
    export type Common = typeof import('@revenge-mod/discord/common')
    export type Design = typeof import('@revenge-mod/discord/design')
    export type Flux = typeof import('@revenge-mod/discord/flux')
    export type Native = typeof import('@revenge-mod/discord/native')

    export interface Modules {
        mainTabsV2: typeof import('@revenge-mod/discord/modules/main_tabs_v2')
        settings: typeof import('@revenge-mod/discord/modules/settings') &
            typeof import('@revenge-mod/discord/modules/settings/renderer')
    }
}

declare module '@revenge-mod/plugins/types' {
    export interface UnscopedInitPluginApi {
        discord: PluginApiDiscord
    }

    export interface InitPluginApi {
        logger: DiscordModules.Logger
    }
}
