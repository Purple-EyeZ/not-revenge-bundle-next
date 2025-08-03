import {
    byDependencies,
    byName,
    byProps,
    createFilterGenerator,
    preferExports,
} from '@revenge-mod/modules/finders/filters'
import {
    lookupModule,
    lookupModules,
} from '@revenge-mod/modules/finders/lookup'
import { waitForModules } from '@revenge-mod/modules/finders/wait'
import { getModuleDependencies } from '@revenge-mod/modules/metro/utils'
import { asap, noop } from '@revenge-mod/utils/callback'
import { cached, cacheFilterResultForId } from '../../../modules/src/caches'
import { FilterResultFlags } from '../../../modules/src/finders/_internal'
import type {
    Filter,
    FilterGenerator,
} from '@revenge-mod/modules/finders/filters'
import type { Metro } from '@revenge-mod/modules/types'
import type { DiscordModules } from '../types'

const { relative } = byDependencies

// ../discord_common/js/packages/flux

export const [Dispatcher, DispatcherModuleId] = lookupModule(
    preferExports(
        byProps<DiscordModules.Flux.Dispatcher>('_interceptors'),
        byDependencies([
            relative(1),
            undefined,
            undefined,
            undefined,
            undefined,
            2,
        ]),
    ),
    {
        uninitialized: true,
    },
) as [DiscordModules.Flux.Dispatcher, Metro.ModuleID]

const _stores: Record<string, DiscordModules.Flux.Store> = {}

/**
 * A proxy object that allows you to access Flux stores by their name, including uninitialized stores.
 *
 * Use `Reflect.ownKeys()` on this proxy to get a list of all initialized stores.
 *
 * @see {@link getStore} for a way to get stores lazily.
 */
export const Stores = new Proxy(_stores, {
    ownKeys: target => Reflect.ownKeys(target),
    get: (target, prop: string) =>
        target[prop] ??
        // @ts-expect-error: This always uses cache
        lookupModule(byStoreName(prop), { uninitialized: true })[0],
})

/**
 * Gets a Flux store by its name, and calls the provided callback with the store.
 *
 * @param name The name of the store to get.
 * @param callback A callback that will be called with the store once it is found.
 * @returns A function that can be used to cancel the wait for the store.
 */
export function getStore<T>(
    name: string,
    callback: (store: DiscordModules.Flux.Store<T>) => void,
) {
    const store = _stores[name]
    if (store) {
        callback(store as DiscordModules.Flux.Store<T>)
        return noop
    }

    return waitForModules(byStoreName<T>(name), callback, { cached: true })
}

/// FILTERING

/* 
    Flux Store dependencies: [
        6, // _classCallCheck
        5, // _createClass
        14, // _possibleConstructorReturn
        16, // bound getPrototypeOf
        17, // _inherits
        (...), // (any amount of dependencies)
        2 // ImportTracker
    ]
*/

const [, _createClassModuleId] = lookupModule(byName('_createClass'))
const [, _classCallCheckModuleId] = lookupModule(byName('_classCallCheck'))
const [, _possibleConstructorReturnModuleId] = lookupModule(
    byName('_possibleConstructorReturn'),
)
const [, _bound_getPrototypeOfModuleId] = lookupModule(
    byName('bound getPrototypeOf'),
)
const [, _inheritsModuleId] = lookupModule(byName('_inherits'))

const FluxStoreLeadingDeps = [
    _classCallCheckModuleId,
    _createClassModuleId,
    _possibleConstructorReturnModuleId,
    _bound_getPrototypeOfModuleId,
    _inheritsModuleId,
]

export type ByStore = FilterGenerator<
    <T>() => Filter<DiscordModules.Flux.Store<T>, boolean>
>

/**
 * A dynamic filter that matches all Flux stores.
 */
export const byStore = createFilterGenerator(
    (_, id, exports) => {
        if (exports) return Boolean(exports._dispatchToken)
        else {
            const deps = getModuleDependencies(id)!
            if (deps.length < FluxStoreLeadingDeps.length) return false

            for (let i = 0; i < FluxStoreLeadingDeps.length; i++)
                if (deps[i] !== FluxStoreLeadingDeps[i]) return false

            return deps[deps.length - 1] === 2
        }
    },
    () => 'revenge.discord.byStore',
) as ByStore

export type ByStoreName = FilterGenerator<
    <T>(name: string) => Filter<DiscordModules.Flux.Store<T>, true>
>

/**
 * A with-exports filter that matches a Flux store by its name.
 */
export const byStoreName = createFilterGenerator(
    ([name], _, exports) =>
        exports.getName?.length === 0 && exports.getName() === name,
    ([name]) => `revenge.discord.byStoreName(${name})`,
) as ByStoreName

/// CACHING

waitForModules(byStore(), (store, id) => {
    const name = store.getName()
    // Cache stores
    cacheFilterResultForId(
        byStoreName.keyFor([name]),
        id,
        FilterResultFlags.Default,
    )
    Stores[name] = store
})

cached.then(cached => {
    if (!cached)
        asap(() => {
            const lookup = lookupModules(byStore(), {
                uninitialized: true,
            })

            while (lookup.next().done);
        })
})
