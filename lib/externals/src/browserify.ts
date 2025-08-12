import { lookupModule } from '@revenge-mod/modules/finders'
import {
    byDependencies,
    byProps,
    preferExports,
} from '@revenge-mod/modules/finders/filters'
import { proxify } from '@revenge-mod/utils/proxy'

const { loose, relative } = byDependencies

export let nodeUtil: typeof import('node:util') = proxify(
    () => {
        const [module] = lookupModule(
            preferExports(
                byProps<typeof nodeUtil>('inspect'),
                byDependencies([
                    loose([relative(2, true), relative(4, true)]),
                    [],
                    [],
                ]),
            ),
            {
                uninitialized: true,
            },
        )

        if (module) return (nodeUtil = module)
    },
    {
        hint: {},
    },
)!
