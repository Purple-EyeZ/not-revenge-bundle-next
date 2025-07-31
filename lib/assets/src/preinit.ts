import {
    byDependencies,
    byName,
    byProps,
} from '@revenge-mod/modules/finders/filters'
import {
    lookupModule,
    lookupModules,
} from '@revenge-mod/modules/finders/lookup'
import { waitForModules } from '@revenge-mod/modules/finders/wait'
import {
    mInitializingId,
    mUninitialized,
} from '@revenge-mod/modules/metro/patches'
import { getModuleDependencies } from '@revenge-mod/modules/metro/utils'
import { proxify } from '@revenge-mod/utils/proxy'
import { aOverrides } from './_internal'
import { cacheAsset, cached } from './caches'
import type { ReactNative } from '@revenge-mod/react/types'
import type { Asset, PackagerAsset } from './types'

const { relative } = byDependencies

const [, _classCallCheckId] = lookupModule(byName('_classCallCheck'))
const [, invariantId] = lookupModule(byName('invariant'))
const [, _createClassId] = lookupModule(byName('_createClass'))

// https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/Image/AssetSourceResolver.js
const byAssetSourceResolver = byDependencies([
    _classCallCheckId,
    _createClassId,
    relative(1),
    relative(2),
    undefined,
    invariantId,
])

const cachedOnly = { cached: true }

// Tracking/caching assets
const unsubAR = waitForModules(
    byProps<ReactNative.AssetsRegistry>('registerAsset'),
    (exports, id) => {
        AssetsRegistryModuleId = id
        AssetsRegistry = exports as ReactNative.AssetsRegistry

        // There are two matching exports. One is the original, and one is a re-export.
        // The original asset-registry is simply required by the re-exported one with no changes.

        // This is the re-exported registry, because it has dependencies.
        // We can begin the caching process here, asset registrar modules have the reexported registry as a dependency.
        if (getModuleDependencies(id)!.length) {
            unsubAR()

            // TODO(lib/assets/caches): Ideally we should not wait for the cache promise here, see the promise impl for more info.
            cached.then(cached => {
                if (!cached) {
                    // More fragile way, but also more performant:
                    // There is exactly one asset before the reexported asset registry :/
                    const firstAssetModuleId = id - 1
                    for (const mId of mUninitialized) {
                        if (mId < firstAssetModuleId) continue

                        const deps = getModuleDependencies(mId)!
                        if (deps.length === 1 && deps[0] === id) __r(mId)
                    }
                }
            })

            // We already patched the original asset registry, so we don't need to patch again.
            return
        }

        const orig = exports.registerAsset
        exports.registerAsset = (asset: Asset) => {
            const result = orig(asset as PackagerAsset)

            // Cache and set moduleId for packager assets only
            if ((asset as PackagerAsset).__packager_asset) {
                asset.moduleId = mInitializingId
                cacheAsset(asset, mInitializingId!)
            }

            return (asset.id = result)
        }
    },
    cachedOnly,
)

/**
 * If you need to use this ID before assets-registry is initialized, interact with AssetsRegistry proxy first.
 *
 * ```js
 * preinit() {
 *   AssetsRegistry.getAssetByID(0)
 *   // Module ID will now be set!
 *   AssetsRegistryModuleId // ...
 * }
 * ```
 */
export let AssetsRegistryModuleId: number | undefined

export let AssetsRegistry: ReactNative.AssetsRegistry = proxify(() => {
    for (const [, id] of lookupModules(byDependencies([[]]), {
        initialize: false,
        uninitialized: true,
    })) {
        const deps = getModuleDependencies(id)!
        if (deps.length !== 1) continue

        // The module next to assets-registry is AssetSourceResolver
        if (byAssetSourceResolver(deps[0] + 1)) {
            const module = __r(id)
            // ID will be set by the wait below
            if (module?.registerAsset) return (AssetsRegistry = module)
        }
    }

    throw new Error('assets-registry not found')
})

// Asset overrides
const unsubRAS = waitForModules(
    byName<{
        addCustomSourceTransformer: (
            transformer: (arg: { asset: Asset }) => PackagerAsset,
        ) => void
    }>('resolveAssetSource'),
    rAS => {
        unsubRAS()

        // Custom assets
        // Why do we need to do this? Because RN/Discord (unsure which) will attempt to resolve the asset via its path, which we don't provide via custom assets.
        // This will result in a crash, because it tries to read the path and run checks on it, but the path is undefined.
        // @ts-expect-error
        rAS.addCustomSourceTransformer(({ asset }) => {
            if (!(asset as PackagerAsset).__packager_asset) return asset
        })

        // Asset overrides
        // @ts-expect-error
        rAS.addCustomSourceTransformer(({ asset }) => aOverrides.get(asset))
    },
    cachedOnly,
)
