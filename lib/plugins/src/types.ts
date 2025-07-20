import type { FunctionComponent } from 'react'
import type { PluginApiModules } from './apis/modules'
import type { PluginApiPlugins } from './apis/plugins'
import type { PluginApiReact } from './apis/react'
import type { PluginFlags, PluginStatus } from './constants'

// biome-ignore lint/suspicious/noEmptyInterface: To be extended by actual extensions
export interface PluginApiExtensionsOptions {}

/**
 * The unscoped plugin API (very limited). This API is available as a global for plugins.
 * Available in the `preInit` phase.
 */
export interface UnscopedPreInitPluginApi<
    // biome-ignore lint/correctness/noUnusedVariables: This is for plugin API extensions
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> {
    modules: PluginApiModules
    patcher: typeof import('@revenge-mod/patcher')
    plugins: PluginApiPlugins
    react: PluginApiReact
    storage: typeof import('@revenge-mod/storage')
}

/**
 * The unscoped plugin API (limited). This API is available as a global for plugins.
 * Available in the `init` phase.
 */
export interface UnscopedInitPluginApi<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> extends UnscopedPreInitPluginApi<O> {
    assets: typeof import('@revenge-mod/assets')
}

/**
 * The unscoped plugin API. This API is available as a global for plugins.
 * Available in the `start` and `stop` phase.
 */
export interface UnscopedPluginApi<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> extends UnscopedInitPluginApi<O> {}

export type PluginCleanup = () => any
export type PluginCleanupApi = (...fns: PluginCleanup[]) => void

/**
 * The plugin API (very limited).
 * Available in the `preInit` phase.
 */
export interface PreInitPluginApi<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> {
    decorate(
        decorator: (plugin: Plugin<O, 'PreInit'>, options: O) => void,
    ): void
    unscoped: UnscopedPreInitPluginApi
    cleanup: PluginCleanupApi
    plugin: Plugin
}

/**
 * The plugin API (limited).
 * Available in the `init` phase.
 */
// @ts-expect-error
export interface InitPluginApi<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> extends PreInitPluginApi<O> {
    decorate(decorator: (plugin: Plugin<O, 'Init'>, options: O) => void): void
    unscoped: UnscopedInitPluginApi
}

/**
 * The plugin API.
 * Available in the `start` and `stop` phase.
 */
// @ts-expect-error
export interface PluginApi<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> extends InitPluginApi<O> {
    decorate(decorator: (plugin: Plugin<O, 'Start'>, options: O) => void): void
    unscoped: UnscopedPluginApi
}

// TODO(plugins): support plugin bundles
// export interface PluginBundle {
//     /**
//      * The unique identifier for the plugin bundle.
//      */
//     id: string
//     /**
//      * The author of the plugin bundle.
//      */
//     author: string
//     /**
//      * The URL of the plugin bundle.
//      */
//     url: string
// }

export interface PluginManifest {
    /**
     * The unique identifier for the plugin.
     */
    id: string
    /**
     * The name of the plugin.
     */
    name: string
    /**
     * The author of the plugin.
     */
    author: string
    /**
     * The description of the plugin.
     */
    description: string
    /**
     * The icon of the plugin.
     */
    icon?: string
    /**
     * The dependencies of the plugin.
     */
    dependencies?: PluginDependency[]
}

export interface PluginDependency {
    /**
     * The ID of this dependency.
     */
    id: string
    // TODO(plugins): support plugin bundles
    // /**
    //  * The bundle of this dependency.
    //  */
    // bundle: PluginBundle
}

export interface PluginOptions<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> extends PluginLifecycles<O> {
    SettingsComponent?: PluginSettingsComponent<O>
}

export interface PluginLifecycles<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> {
    /**
     * Runs as soon as possible with very limited APIs.
     * Before the index module (module 0)'s factory is run.
     *
     * @param api Plugin API (very limited).
     */
    preInit?: (api: PreInitPluginApi<O>) => any
    /**
     * Runs as soon as all important modules are initialized.
     * After the index module (module 0)'s factory is run.
     *
     * @param api Plugin API (limited).
     */
    init?: (api: InitPluginApi<O>) => any
    /**
     * Runs when the plugin can be started with all APIs available.
     *
     * @param api Plugin API.
     */
    start?: (api: PluginApi<O>) => any
    /**
     * Runs when the plugin is stopped.
     *
     * @param api Plugin API.
     */
    stop?: (api: PluginApi<O>) => any
}

export interface Plugin<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
    S extends keyof PluginApiInStage<O> = keyof PluginApiInStage<O>,
> {
    // TODO(plugins): support plugin bundles
    // /**
    //  * The plugin bundle this plugin belongs to.
    //  */
    // bundle: PluginBundle
    /**
     * The plugin manifest.
     */
    manifest: PluginManifest
    /**
     * The plugin lifecycles.
     */
    lifecycles: PluginLifecycles<O>

    /**
     * The plugin flags.
     * @see {@link PluginFlags}
     */
    flags: number
    /**
     * The plugin status.
     * @see {@link PluginStatus}
     */
    status: number
    /**
     * Errors encountered during the plugin lifecycles.
     */
    errors: unknown[]

    /**
     * The plugin settings page.
     */
    SettingsComponent?: PluginSettingsComponent<O>

    /**
     * Disable the plugin. This will also stop the plugin if it is running.
     */
    disable(): Promise<void>
    /**
     * Stop the plugin.
     */
    stop(): Promise<void>

    /**
     * The plugin API.
     *
     * Not recommended to use this directly.
     */
    api: PluginApiInStage<O>[S]
}

type PluginApiInStage<O extends PluginApiExtensionsOptions> = {
    Register: undefined
    PreInit: PreInitPluginApi<O>
    Init: InitPluginApi<O>
    Start: PluginApi<O>
}

export interface PluginSettingsComponent<
    O extends PluginApiExtensionsOptions = PluginApiExtensionsOptions,
> extends FunctionComponent<{ api: PluginApi<O> }> {}
