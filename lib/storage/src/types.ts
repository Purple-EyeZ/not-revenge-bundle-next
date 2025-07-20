import type { AnyObject } from '@revenge-mod/utils/types'
import type { Storage, StorageOptions } from '.'

declare module '@revenge-mod/plugins/types' {
    export interface PluginApiExtensionsOptions {
        storage?: AnyObject
    }

    export interface PluginOptions<O extends PluginApiExtensionsOptions> {
        storage?: Omit<StorageOptions<NonNullable<O['storage']>>, 'directory'>
    }

    export interface InitPluginApi<O extends PluginApiExtensionsOptions> {
        /**
         * The plugin storage.
         *
         * Note that the instance is only created when the plugin accesses the API.
         * This is to prevent unnecessary storage instances from being created.
         *
         * To preload storage, simply call `api.storage.get()`.
         */
        storage: Storage<NonNullable<O['storage']>>
    }
}
