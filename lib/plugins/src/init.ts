import { initPlugin } from './_internal'
import { computePendingNodes, pListOrdered } from './_internal/dependency-graph'
import { PluginFlags } from './constants'

computePendingNodes()

for (const plugin of pListOrdered)
    if (plugin.flags & PluginFlags.Enabled) initPlugin(plugin)
