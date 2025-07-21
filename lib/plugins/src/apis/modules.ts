import * as PluginApiModulesFindersFilters from '@revenge-mod/modules/finders/filters'
import * as PluginApiModulesFindersGet from '@revenge-mod/modules/finders/get'
import * as PluginApiModulesFindersLookup from '@revenge-mod/modules/finders/lookup'
import * as PluginApiModulesFindersWait from '@revenge-mod/modules/finders/wait'
import * as PluginApiModulesMetroSubscriptions from '@revenge-mod/modules/metro/subscriptions'
import * as PluginApiModulesMetroUtils from '@revenge-mod/modules/metro/utils'
import * as PluginApiModulesNative_ from '@revenge-mod/modules/native'
import { spreadDescriptors } from '.'

export interface PluginApiModules {
    finders: PluginApiModulesFinders
    metro: PluginApiModulesMetro
    native: PluginApiModulesNative
}

export type PluginApiModulesNative = typeof PluginApiModulesNative_

export type PluginApiModulesMetro =
    // biome-ignore format: Don't
    typeof PluginApiModulesMetroUtils &
    typeof PluginApiModulesMetroSubscriptions

export type PluginApiModulesFinders =
    // biome-ignore format: Don't
    typeof PluginApiModulesFindersGet &
    typeof PluginApiModulesFindersLookup &
    typeof PluginApiModulesFindersWait & {
        filters: typeof PluginApiModulesFindersFilters
    }

export const modules: PluginApiModules = {
    finders: spreadDescriptors(
        PluginApiModulesFindersGet,
        spreadDescriptors(
            PluginApiModulesFindersLookup,
            spreadDescriptors(PluginApiModulesFindersWait, {
                filters: PluginApiModulesFindersFilters,
            }),
        ),
    ),
    metro: spreadDescriptors(
        PluginApiModulesMetroUtils,
        spreadDescriptors(PluginApiModulesMetroSubscriptions, {}),
    ),
    native: PluginApiModulesNative_,
}
