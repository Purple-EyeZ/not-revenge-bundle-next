import { lookupModule } from '@revenge-mod/modules/finders'
import {
    byDependencies,
    byProps,
    preferExports,
} from '@revenge-mod/modules/finders/filters'
import type { Metro } from '@revenge-mod/modules/types'
import type { DiscordModules } from '../types'

const { relative } = byDependencies

// ../discord_common/js/packages/flux

export const [Dispatcher, DispatcherModuleId] = lookupModule(
    preferExports(
        byProps<DiscordModules.Flux.Dispatcher>('_interceptors'),
        byDependencies([relative(1), null, null, null, null, 2]),
    ),
    {
        uninitialized: true,
    },
) as [DiscordModules.Flux.Dispatcher, Metro.ModuleID]
