// TODO(lib/assets): do not depend on Discord's ClientInfoModule for versioning, use native interop
import { ClientInfoModule } from '@revenge-mod/discord/native'
import { getStorage } from '@revenge-mod/storage'
import { debounce } from '@revenge-mod/utils/callback'
import { mergeDeep } from '@revenge-mod/utils/object'
import type { Metro } from '@revenge-mod/modules/types'
import type { Asset } from './types'

const Version = 1
const Key = `${Version}.${ClientInfoModule.getConstants().Build}`

// In-memory cache
export const cache: Cache = {}

const CacheStorage = getStorage<Cache>(`revenge/assets.${Key}`, {
    default: cache,
    directory: 'cache',
})

// TODO(lib/assets/caches): This loads way too late and requires native interop to load earlier
export const cached = CacheStorage.get().then(cache_ => {
    const cached = cache_ !== cache
    // If we are not using the default value, merge it into the in-memory cache, then point the storage cache to the in-memory cache.
    if (cached) {
        Object.assign(cache, cache_)
        CacheStorage.cache = cache
    }

    return cached
})

export interface Cache {
    [key: Asset['name']]: {
        [key: Asset['type']]: Metro.ModuleID
    }
}

const save = debounce(() => {
    CacheStorage.set({})
}, 1000)

export function cacheAsset(asset: Asset, moduleId: Metro.ModuleID) {
    // Merge directly into the cache, only debouncing actual writes
    mergeDeep(cache, {
        [asset.name]: {
            [asset.type]: moduleId,
        },
    })

    save()
}
