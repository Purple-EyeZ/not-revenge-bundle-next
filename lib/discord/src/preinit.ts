import {
    byDependencies,
    byProps,
    preferExports,
} from '@revenge-mod/modules/finders/filters'
import { lookupModule } from '@revenge-mod/modules/finders/lookup'
import type { Metro } from '@revenge-mod/modules/types'
import type { DiscordModules } from './types'

const { relative } = byDependencies

// ../discord_common/js/packages/app-start-performance/AppStartPerformance.tsx
export const [AppStartPerformance] = lookupModule(
    preferExports(
        byProps<DiscordModules.AppStartPerformance>('markAndLog'),
        byDependencies([relative(-1), undefined, undefined, 2]),
    ),
    {
        uninitialized: true,
    },
) as [DiscordModules.AppStartPerformance, Metro.ModuleID]

AppStartPerformance.mark('👊', 'Pre-init')

import './patches/flux'
