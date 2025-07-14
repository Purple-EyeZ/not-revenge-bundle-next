import * as AssetsLibrary from '@revenge-mod/assets'
import { onRunApplication } from '@revenge-mod/react/native'
import { initPlugin, pList, startPlugin } from './_internal'
import { pUnscopedApi } from './apis'
import { react } from './apis/react'
import { PluginFlags } from './constants'
import type { UnscopedInitPluginApi } from './types'

// Setup init plugin APIs
const uapi = pUnscopedApi as UnscopedInitPluginApi
uapi.assets = AssetsLibrary
uapi.react = react

for (const plugin of pList.values())
    if (plugin.flags & PluginFlags.Enabled) initPlugin(plugin)

const unsub = onRunApplication(() => {
    unsub()

    require('~/plugins/start')

    for (const plugin of pList.values())
        if (plugin.flags & PluginFlags.Enabled) startPlugin(plugin)
})
