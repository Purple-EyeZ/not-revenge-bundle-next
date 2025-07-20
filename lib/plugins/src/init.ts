import * as AssetsLibrary from '@revenge-mod/assets'
import { initPlugin, pList } from './_internal'
import { pUnscopedApi } from './apis'
import { PluginFlags } from './constants'
import type { UnscopedInitPluginApi } from './types'

// Setup init plugin APIs
const uapi = pUnscopedApi as UnscopedInitPluginApi
uapi.assets = AssetsLibrary

for (const plugin of pList.values())
    if (plugin.flags & PluginFlags.Enabled) initPlugin(plugin)
