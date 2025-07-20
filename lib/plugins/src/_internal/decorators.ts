import type {
    InitPluginApi,
    Plugin,
    PluginApi,
    PreInitPluginApi,
} from '../types'
import type { InternalPluginMeta } from '.'

export type PluginApiDecoratorStore<
    A extends PreInitPluginApi | InitPluginApi | PluginApi,
> = [decorator: Parameters<A['decorate']>[0], handleError: (e: unknown) => void]

export const pDecorators: {
    preInit: PluginApiDecoratorStore<PreInitPluginApi>[]
    init: PluginApiDecoratorStore<InitPluginApi>[]
    start: PluginApiDecoratorStore<PluginApi>[]
} = {
    preInit: [],
    init: [],
    start: [],
}

export function decoratePluginApi(
    store: PluginApiDecoratorStore<
        PreInitPluginApi | InitPluginApi | PluginApi
    >[],
    plugin: Plugin,
    meta: InternalPluginMeta,
) {
    for (const [decorator, handleError] of store)
        try {
            decorator(plugin as Plugin<any, any>, meta.options)
        } catch (e) {
            handleError(e)
        }
}
