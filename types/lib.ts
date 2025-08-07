import type {
    PluginApiExtensionsOptions,
    PluginManifest,
    PluginOptions,
} from '@revenge-mod/plugins/types'

declare global {
    export function plugin<O extends PluginApiExtensionsOptions>(
        manifest: PluginManifest,
        options: PluginOptions<O>,
    ): void
}

export type * from '@revenge-mod/types'
