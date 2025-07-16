import * as patcher from '@revenge-mod/patcher'
import * as storage from '@revenge-mod/storage'
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
    storage,
}
