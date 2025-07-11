import { pUnscopedApi } from '@revenge-mod/plugins/_'

pUnscopedApi.utils = {
    callback: require('@revenge-mod/utils/callback'),
    error: require('@revenge-mod/utils/error'),
    object: require('@revenge-mod/utils/object'),
    promise: require('@revenge-mod/utils/promise'),
    proxy: require('@revenge-mod/utils/proxy'),
    tree: require('@revenge-mod/utils/tree'),
}

export interface PreInitPluginApiUtils {
    callback: typeof import('@revenge-mod/utils/callback')
    error: typeof import('@revenge-mod/utils/error')
    object: typeof import('@revenge-mod/utils/object')
    promise: typeof import('@revenge-mod/utils/promise')
    proxy: typeof import('@revenge-mod/utils/proxy')
    tree: typeof import('@revenge-mod/utils/tree')
}

export interface PluginApiUtils extends PreInitPluginApiUtils {
    react: typeof import('@revenge-mod/utils/react')
    discord: typeof import('@revenge-mod/utils/discord')
}

declare module '@revenge-mod/plugins/types' {
    export interface UnscopedPreInitPluginApi {
        utils: PreInitPluginApiUtils
    }

    export interface UnscopedInitPluginApi {
        utils: PluginApiUtils
    }
}
