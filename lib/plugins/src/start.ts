import { pList, startPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from './constants'

for (const plugin of pList.values())
    if (plugin.flags & PluginFlags.Enabled) startPlugin(plugin)
