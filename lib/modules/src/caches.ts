// TODO(lib/modules/caches): do not depend on Discord's ClientInfoModule for versioning, use native interop
import { ClientInfoModule } from '@revenge-mod/discord/native'
import { getStorage } from '@revenge-mod/storage'
import { debounce } from '@revenge-mod/utils/callback'
import type { Metro } from '@revenge-mod/modules/types'
import type { FilterResultFlag } from './finders/_internal'
import type { Filter } from './finders/filters'

const Version = 2
const Key = `${Version}.${ClientInfoModule.getConstants().Build}`

// In-memory cache
const cache: Cache = { b: [], f: {} }

const CacheStorage = getStorage<Cache>(`revenge/modules.${Key}`, {
    default: cache,
    directory: 'cache',
})

// TODO(lib/modules/caches): This loads way too late and requires native interop to load earlier
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
    b: Metro.ModuleID[]
    f: Record<
        Filter['key'],
        Record<Metro.ModuleID, FilterResultFlag> | null | undefined
    >
}

const save = debounce(() => {
    CacheStorage.set({})
}, 1000)

export function cacheBlacklistedModule(id: Metro.ModuleID): boolean {
    cache.b.push(id)
    save()

    return true
}

export function cacheFilterResultForId(
    key: Filter['key'],
    id: Metro.ModuleID,
    flag: FilterResultFlag,
): FilterResultFlag {
    const reg = (cache.f[key] ??= {})
    reg[id] = flag

    save()

    return flag
}

export function cacheFilterNotFound(key: Filter['key']) {
    cache.f[key] = null
}

export const getCachedFilterRegistry = (
    key: Filter['key'],
): Cache['f'][Filter['key']] | undefined => cache.f[key]

export const getCachedBlacklistedModules = () => cache.b
