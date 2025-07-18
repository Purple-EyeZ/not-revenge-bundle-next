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

export const global = globalThis

export const metroRequire = (moduleId => {
    const mod = mList.get(moduleId)!
    const { flags, module: moduleObject } = mod

    if (flags & InitializedOrInitializing) return moduleObject.exports
    if (flags & HasError) throw mod.error

    mod.flags |= Initializing
    moduleObject.id = moduleId

    try {
        const { factory } = mod
        mod.factory = undefined

        factory!()

        mod.flags = (flags & NotInitializedOrInitializingMask) | Initialized

        return moduleObject.exports
    } catch (e) {
        mod.flags = (flags & NotInitializedOrInitializingMask) | HasError
        mod.error = e
        // @ts-expect-error: We never access this key again
        mod.module = undefined

        // @ts-expect-error: Not documented, but used by React Native
        if (global.ErrorUtils) global.ErrorUtils.reportFatalError(e)
        else throw e
    }
}) as Metro.Require

global.__r = metroRequire

export const metroImportDefault: Metro.RequireFn = moduleId => {
    const mod = mList.get(moduleId)!
    if (mod.flags & HasImportedDefault) return mod.importedDefault

    const exports = metroRequire(moduleId)
    return (mod.importedDefault = exports?.__esModule
        ? exports.default
        : exports)
}

export const metroImportAll: Metro.RequireFn = moduleId => {
    const mod = mList.get(moduleId)!
    if (mod.flags & HasImportedAll) return mod.importedAll

    const exports = metroRequire(moduleId)
    if (!exports?.__esModule) exports.default = exports

    return (mod.importedAll = exports)
}
