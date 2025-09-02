import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import {
    PluginFlags,
    PluginsStorageDirectory,
} from '@revenge-mod/plugins/constants'
import * as storage from '@revenge-mod/storage'
import { getStorage } from '@revenge-mod/storage'
import { defineLazyProperty } from '@revenge-mod/utils/object'
import type { AnyPlugin } from '@revenge-mod/plugins/_'
import type { Plugin } from '@revenge-mod/plugins/types'
import type { StorageOptions } from '@revenge-mod/storage'

const storageOptions = new WeakMap<AnyPlugin, StorageOptions>()

registerPlugin(
    {
        id: 'revenge.api.storage',
        name: 'Storage API',
        description: '@revenge-mod/storage API for plugins.',
        author: 'Revenge',
        icon: 'PollsIcon',
    },
    {
        preInit({ decorate, unscoped }) {
            unscoped.storage = storage

            decorate((plugin, { storage }) => {
                if (storage) storageOptions.set(plugin, storage)
            })
        },
        init({ decorate }) {
            const makePluginStorage = (plugin: Plugin, opts?: StorageOptions) =>
                getStorage(
                    `${PluginsStorageDirectory}/${plugin.manifest.id}.json`,
                    {
                        ...opts,
                        directory: 'documents',
                    },
                )

            decorate(plugin => {
                const opts = storageOptions.get(plugin)

                if (opts?.load)
                    plugin.api.storage = makePluginStorage(plugin, opts)
                else
                    defineLazyProperty(plugin.api, 'storage', () =>
                        makePluginStorage(plugin, opts),
                    )
            })
        },
    },
    PluginFlags.Enabled,
    // biome-ignore format: Don't format this
    InternalPluginFlags.Internal |
    InternalPluginFlags.Essential |
    InternalPluginFlags.ImplicitDependency,
)
