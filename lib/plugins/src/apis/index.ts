import * as patcher from '@revenge-mod/patcher'
import { modules } from './modules'
import { plugins } from './plugins'
import { react } from './react'
import type {
    UnscopedInitPluginApi,
    UnscopedPluginApi,
    UnscopedPreInitPluginApi,
} from '../types'

// @ts-expect-error: This will be modified by libraries later
export const pUnscopedApi:
    | UnscopedPreInitPluginApi
    | UnscopedInitPluginApi
    | UnscopedPluginApi = {
    modules,
    patcher,
    plugins,
    react,
}

export function spreadDescriptors<T extends object, U extends object>(
    from: T,
    to: U,
): T & U {
    return Object.defineProperties(
        to,
        Object.getOwnPropertyDescriptors(from),
    ) as T & U
}
