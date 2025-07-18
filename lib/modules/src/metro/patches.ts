import {
    cacheBlacklistedModule,
    cached,
    getCachedBlacklistedModules,
} from '../caches'
import {
    global,
    metroImportAll,
    metroImportDefault,
    metroRequire,
} from './custom'
import { onModuleInitialized } from './subscriptions'
import {
    executeImportedPathSubscriptions,
    executeInitializeSubscriptions,
    executeRequireSubscriptions,
} from './subscriptions/_internal'
import type { Metro, RevengeMetro } from '../types'

export let mInitializingId: Metro.ModuleID | null = null
/** Uninitialized IDs (not blacklisted) */
export const mUninitialized = new Set<Metro.ModuleID>()
/** Initialized IDs (not blacklisted) */
export const mInitialized = new Set<Metro.ModuleID>()

export const mImportedPaths = new Map<string, Metro.ModuleID>()
export const mDeps = new Map<Metro.ModuleID, Metro.DependencyMap>()

export const mList: RevengeMetro.ModuleList = new Map()

const metroDefine = (
    factory: Metro.FactoryFn,
    id: Metro.ModuleID,
    dependencyMap: Metro.DependencyMap,
) => {
    mDeps.set(id, dependencyMap!)
    mUninitialized.add(id)

    const moduleObject = { exports: {} }

    mList.set(id, {
        flags: 0,
        module: moduleObject,
        factory: () => {
            handleFactoryCall(factory, moduleObject)
        },
        importedDefault: undefined,
        importedAll: undefined,
        error: undefined,
    })
}

/**
 * Patching Metro's `__d` function to handle module definitions.
 * We roll our own implementation of Metro's core functions.
 *
 * Here's how Metro sets itself up:
 * 1. `__METRO_GLOBAL_PREFIX__ = ""`
 * 2. `${__METRO_GLOBAL_PREFIX__}__d = function define(...) {}`
 *    - Why don't we patch it here? Because we need to know the value of `__METRO_GLOBAL_PREFIX__` first
 *    - And since Revenge runs before everything else, we need to patch in the next steps:
 *      - We chose to patch it in 4. because we can access all the global functions at that point.
 * 3. `__r = function metroRequire(...) {}`
 * 4. `__c = function clear() {}`
 *    - **PATCH**: Set `__d` to our own implementation.
 *
 * 5. `clear()`
 *    - Metro clears the module list directly with `clear()` and not `__c()`.
 * 6. `metroRequire.importDefault = ...`, `metroRequire.importAll = ...`
 * 7. `__d(..., 0, [...])`
 *    - The first module is defined with ID 0, which is the index module.
 *    - **PATCH**: Override the `importDefault` and `importAll` functions in `__r`.
 * #. `__d` is called with subsequent module definitions
 */
const defineKey = `${__METRO_GLOBAL_PREFIX__}__d` as const

// First __d call
globalThis[defineKey] = function define(origFactory, id, deps) {
    // Set own implementation of metroImportDefault and metroImportAll
    metroRequire.importDefault = metroImportDefault
    metroRequire.importAll = metroImportAll

    // Set to the actual custom implementation
    globalThis[defineKey] = metroDefine
    // Call the custom implementation
    metroDefine(origFactory, id, deps)
}

// Why don't we use all the arguments from Metro.FactoryFn?
// Because there's too many for Hermes to be able to use its dedicated CallN operation
// which only supports up to 4 arguments. (Call, Call1, Call2, Call3, Call4)
function handleFactoryCall(
    factory: Metro.FactoryFn,
    moduleObject: Metro.Module,
) {
    const prevId = mInitializingId
    mInitializingId = moduleObject.id!

    executeRequireSubscriptions(mInitializingId)

    try {
        factory(
            global,
            metroRequire,
            metroImportDefault,
            metroImportAll,
            moduleObject,
            moduleObject.exports,
            mDeps.get(mInitializingId)!,
        )

        const { exports } = moduleObject

        // If we don't have the ID in mUninitialized, it means the module is blacklisted
        if (mUninitialized.has(mInitializingId)) {
            // Blacklist exports that:
            // - are primitives (https://developer.mozilla.org/en-US/docs/Glossary/Primitive)
            // - are empty objects
            if (exports instanceof Object)
                switch (exports.__proto__) {
                    case Object.prototype:
                    // This null case is for nativeModuleProxy specifically
                    // @ts-expect-error: Intentional
                    // biome-ignore lint/suspicious/noFallthroughSwitchClause: Intentional
                    case null:
                        if (!Reflect.ownKeys(exports).length) {
                            cacheBlacklistedModule(mInitializingId)
                            break
                        }

                    default:
                        mInitialized.add(mInitializingId)
                }
            else cacheBlacklistedModule(mInitializingId)
        }

        executeInitializeSubscriptions(mInitializingId, exports)
    } finally {
        mUninitialized.delete(mInitializingId)
        mInitializingId = prevId
    }
}

/// MODULE PATCHES AND BLACKLISTS

// Restore blacklists
cached.then(cached => {
    if (cached)
        for (const id of getCachedBlacklistedModules())
            mUninitialized.delete(id)
})

const ImportTrackerModuleId = 2

onModuleInitialized(ImportTrackerModuleId, (_, exports) => {
    const orig = exports.fileFinishedImporting
    exports.fileFinishedImporting = (path: string) => {
        orig(path)
        const id = mInitializingId!
        mImportedPaths.set(path, id)
        executeImportedPathSubscriptions(id, path)
    }
})
