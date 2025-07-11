import { pEmitter } from '@revenge-mod/plugins/_'
import { PluginsStorageDirectory } from '@revenge-mod/plugins/constants'
import { defineLazyProperty } from '@revenge-mod/utils/object'
import { useReRender } from '@revenge-mod/utils/react'
import { useEffect } from 'react'
import { getStorage, Storage } from '.'
import type { StorageSubscription } from '.'

// Actual implementation of Storage#use
const SP: Storage<any> = Storage.prototype
SP.use = function (filter) {
    if (!this.cache) this.get()

    const reRender = useReRender()

    useEffect(() => {
        const sub: StorageSubscription = filter
            ? v => {
                  if (filter(v)) reRender()
              }
            : reRender

        this._s.add(sub)

        return () => {
            this._s.delete(sub)
        }
    }, [])

    return this.cache
}

pEmitter.on('init', ({ _s: storageOptions, manifest: { id } }, api) =>
    defineLazyProperty(api, 'storage', () =>
        getStorage(`${PluginsStorageDirectory}/${id}.json`, {
            ...storageOptions,
            directory: 'documents',
        }),
    ),
)
