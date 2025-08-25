import { lookupModule } from '@revenge-mod/modules/finders'
import {
    byDependencies,
    byName,
    byProps,
    preferExports,
} from '@revenge-mod/modules/finders/filters'
import { ReactJSXRuntimeModuleId, ReactModuleId } from '@revenge-mod/react'
import { proxify } from '@revenge-mod/utils/proxy'

const { loose, relative } = byDependencies

const [, _createClassModuleId] = lookupModule(byName('_createClass'))
const [, _classCallCheckModuleId] = lookupModule(byName('_classCallCheck'))

export let ReactNavigationNative: typeof import('@react-navigation/native') =
    proxify(
        () => {
            const [module] = lookupModule(
                preferExports(
                    byProps<typeof ReactNavigationNative>('useLinkTo'),
                    byDependencies(
                        loose([
                            [],
                            loose([
                                [_createClassModuleId, _classCallCheckModuleId],
                            ]),
                        ]),
                    ),
                ),
                {
                    uninitialized: true,
                },
            )

            if (module) return (ReactNavigationNative = module)
        },
        {
            hint: {},
        },
    )!

export let ReactNavigationStack: typeof import('@react-navigation/stack') =
    proxify(
        () => {
            const [module] = lookupModule(
                preferExports(
                    byProps<typeof ReactNavigationStack>('StackView'),
                    byDependencies(
                        loose([
                            relative.withDependencies(
                                loose([
                                    [[]],
                                    ReactModuleId,
                                    ReactJSXRuntimeModuleId,
                                ]),
                                1,
                            ),
                            null,
                            relative(3),
                        ]),
                    ),
                ),
                {
                    uninitialized: true,
                },
            )

            if (module) return (ReactNavigationStack = module)
        },
        {
            hint: {},
        },
    )!

export interface ReactNavigationParamList {
    [Page: string]: any
}

declare global {
    namespace ReactNavigation {
        interface RootParamList extends ReactNavigationParamList {}
    }
}
