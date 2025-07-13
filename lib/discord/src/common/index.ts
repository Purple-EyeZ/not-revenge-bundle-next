import {
    byDependencies,
    byName,
    byProps,
    preferExports,
} from '@revenge-mod/modules/finders/filters'
import { lookupModule } from '@revenge-mod/modules/finders/lookup'
import { proxify } from '@revenge-mod/utils/proxy'
import type { Metro } from '@revenge-mod/modules/types'
import type { DiscordModules } from '../types'

export { AppStartPerformance } from '../preinit'
export * as flux from './flux'
export * as utils from './utils'

const { loose, relative } = byDependencies

// ../discord_common/js/packages/logger/Logger.tsx
export const [Logger] = lookupModule(
    byName<typeof DiscordModules.Logger>('Logger'),
) as [typeof DiscordModules.Logger, Metro.ModuleID]

// ../discord_common/js/packages/tokens/native.tsx
export const [Tokens, TokensModuleId] = lookupModule(byProps('RawColor')) as [
    any,
    Metro.ModuleID,
]

const OnlyImportTrackerDep = [2]

export let Constants: DiscordModules.Constants = proxify(
    () => {
        const [module] = lookupModule(
            preferExports(
                byProps<DiscordModules.Constants>('ME'),

                // ID:   1236
                // Deps: 26, 1237, 1238, 1239, 1240, ...
                // Every module has only one dependency, which is the import tracker
                byDependencies(
                    loose([
                        undefined,
                        relative.withDependencies(OnlyImportTrackerDep, 1),
                        relative.withDependencies(OnlyImportTrackerDep, 2),
                        relative.withDependencies(OnlyImportTrackerDep, 3),
                        relative.withDependencies(OnlyImportTrackerDep, 4),
                    ]),
                ),
            ),
        )

        if (module) return (Constants = module)
    },
    { hint: {} },
)!
