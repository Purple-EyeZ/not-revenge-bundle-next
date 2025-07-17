/**
 * A more performant implementation of Metro's core functions.
 * Making initialization faster and use less resources.
 */

import { mList } from './patches'
import type { Metro } from '../types'

export const Initialized = 1 << 0
const HasError = 1 << 1
const HasImportedDefault = 1 << 2
const HasImportedAll = 1 << 3
const Initializing = 1 << 4

const InitializedOrInitializing = Initialized | Initializing

const NotInitializedOrInitializingMask = ~InitializedOrInitializing

export const FlagKey = 0
export const ModuleObjectKey = 1
const FactoryKey = 2
const ImportedDefaultKey = 3
const ImportedAllKey = 4
const ErrorKey = 5

export const global = globalThis

export const metroRequire = (moduleId => {
    const module = mList.get(moduleId)!
    const flags = module[FlagKey]
    const moduleObject = module[ModuleObjectKey]

    if (flags & InitializedOrInitializing) return moduleObject.exports
    if (flags & HasError) throw module[ErrorKey]

    module[FlagKey] |= Initializing
    moduleObject.id = moduleId

    try {
        const factory = module[FactoryKey]
        module[FactoryKey] = undefined

        factory!()

        module[FlagKey] =
            (flags & NotInitializedOrInitializingMask) | Initialized

        return moduleObject.exports
    } catch (e) {
        module[FlagKey] = (flags & NotInitializedOrInitializingMask) | HasError
        module[ErrorKey] = e
        // @ts-expect-error: We never access this key again
        module[ModuleObjectKey] = undefined

        // @ts-expect-error: Not documented, but used by React Native
        if (global.ErrorUtils) global.ErrorUtils.reportFatalError(e)
        else throw e
    }
}) as Metro.Require

global.__r = metroRequire

export const metroImportDefault: Metro.RequireFn = moduleId => {
    const mod = mList.get(moduleId)!
    if (mod[FlagKey] & HasImportedDefault) return mod[ImportedDefaultKey]

    const exports = metroRequire(moduleId)
    return (mod[ImportedDefaultKey] = exports?.__esModule
        ? exports.default
        : exports)
}

export const metroImportAll: Metro.RequireFn = moduleId => {
    const mod = mList.get(moduleId)!
    if (mod[FlagKey] & HasImportedAll) return mod[ImportedAllKey]

    const exports = metroRequire(moduleId)
    if (!exports?.__esModule) exports.default = exports

    return (mod[ImportedAllKey] = exports)
}
