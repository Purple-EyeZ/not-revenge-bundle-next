import { lookupModule } from '@revenge-mod/modules/finders'
import {
    byDependencies,
    byProps,
    preferExports,
} from '@revenge-mod/modules/finders/filters'
import { proxify } from '@revenge-mod/utils/proxy'
import type { NavigationContainerRef } from '@react-navigation/core'

const { loose, relative } = byDependencies

export interface RootNavigationRef {
    getRootNavigationRef<
        T extends object = Record<string, unknown>,
    >(): NavigationContainerRef<T>
}

// modules/main_tabs_v2/RootNavigationRef.native.tsx
export let RootNavigationRef: RootNavigationRef = proxify(
    () => {
        const [module] = lookupModule(
            preferExports(
                byProps<RootNavigationRef>('getRootNavigationRef'),
                byDependencies([
                    loose([[], loose([relative(1), relative(2)])]),
                    2,
                ]),
            ),
            {
                uninitialized: true,
            },
        )

        if (module) return (RootNavigationRef = module)
    },
    {
        hint: {},
    },
)!
