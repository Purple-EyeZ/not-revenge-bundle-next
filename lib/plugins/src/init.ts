import { initPlugin, isPluginEnabled } from './_internal'
import { computePendingNodes, pListOrdered } from './_internal/dependency-graph'

computePendingNodes()

for (const plugin of pListOrdered)
    if (isPluginEnabled(plugin)) initPlugin(plugin)
